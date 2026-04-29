import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Save } from "lucide-react";
import { formatBRL, formatPercent, formatPeriodo } from "../../lib/utils";
import type { DreCalculado } from "../../types";
import type { Meta } from "../../hooks/useMetas";

interface Props {
  dreData: DreCalculado[];
  metas: Meta[];
  onSaveMeta: (meta: Meta) => Promise<void>;
}

const TICK = { fontSize: 11, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: "0.8125rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export default function BudgetChart({ dreData, metas, onSaveMeta }: Props) {
  const last = dreData[dreData.length - 1];

  const lastMeta: Meta = metas.find(m => m.periodo === last?.periodo) ?? {
    periodo: last?.periodo ?? "",
    receita_liquida_meta: null,
    margem_ebitda_meta: null,
    lucro_liquido_meta: null,
  };

  const [form, setForm] = useState({
    receita: lastMeta.receita_liquida_meta != null ? String(lastMeta.receita_liquida_meta) : "",
    margem:  lastMeta.margem_ebitda_meta  != null ? String((lastMeta.margem_ebitda_meta * 100).toFixed(1)) : "",
    lucro:   lastMeta.lucro_liquido_meta  != null ? String(lastMeta.lucro_liquido_meta) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const chartData = dreData.map(d => {
    const meta = metas.find(m => m.periodo === d.periodo);
    return {
      periodo:        formatPeriodo(d.periodo),
      "Receita Real": d.receita_liquida,
      "Receita Meta": meta?.receita_liquida_meta ?? null,
      "Lucro Real":   d.lucro_liquido,
      "Lucro Meta":   meta?.lucro_liquido_meta  ?? null,
    };
  });

  async function handleSave() {
    if (!last) return;
    setSaving(true);
    await onSaveMeta({
      periodo:              last.periodo,
      receita_liquida_meta: form.receita ? parseFloat(form.receita) : null,
      margem_ebitda_meta:   form.margem  ? parseFloat(form.margem) / 100 : null,
      lucro_liquido_meta:   form.lucro   ? parseFloat(form.lucro)  : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function atingimento(real: number, meta: number | null) {
    if (!meta || meta === 0) return null;
    return (real / meta) * 100;
  }

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Atingimento cards */}
      {last && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              label: "Receita Líquida",
              real:  last.receita_liquida,
              meta:  lastMeta.receita_liquida_meta,
              fmt:   formatBRL,
            },
            {
              label: "Margem EBITDA",
              real:  last.margem_ebitda * 100,
              meta:  lastMeta.margem_ebitda_meta != null ? lastMeta.margem_ebitda_meta * 100 : null,
              fmt:   (v: number) => `${v.toFixed(1)}%`,
            },
            {
              label: "Lucro Líquido",
              real:  last.lucro_liquido,
              meta:  lastMeta.lucro_liquido_meta,
              fmt:   formatBRL,
            },
          ].map(kpi => {
            const at = atingimento(kpi.real, kpi.meta);
            const cor = at == null ? "var(--text-3)" : at >= 100 ? "var(--green)" : at >= 80 ? "var(--gold)" : "var(--red)";
            const bg  = at == null ? "transparent"  : at >= 100 ? "var(--green-dim)" : at >= 80 ? "var(--gold-dim)" : "var(--red-dim)";
            return (
              <div key={kpi.label} style={{ ...card, padding: 20 }}>
                <p className="text-xs mb-2" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  {kpi.label}
                </p>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="font-mono-data" style={{ fontSize: "1.1rem", color: "var(--text)" }}>
                      {kpi.fmt(kpi.real)}
                    </p>
                    {kpi.meta != null && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                        Meta: {kpi.fmt(kpi.meta)}
                      </p>
                    )}
                  </div>
                  {at != null && (
                    <span
                      className="font-mono-data text-xs px-2 py-0.5 rounded"
                      style={{ color: cor, background: bg }}
                    >
                      {at.toFixed(0)}%
                    </span>
                  )}
                </div>
                {at != null ? (
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(at, 100)}%`, background: cor, opacity: 0.75 }}
                    />
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    Meta não definida abaixo ↓
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Realizado vs. Meta — Receita e Lucro
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                color: "var(--text)",
              }}
              formatter={(v: number) => v != null ? formatBRL(v) : "—"}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            <Bar dataKey="Receita Real" fill="var(--gold)" opacity={0.5}  radius={[2, 2, 0, 0]} />
            <Bar dataKey="Receita Meta" fill="var(--gold)" opacity={0.15} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="Lucro Real" stroke="var(--green)" strokeWidth={2}   dot={{ r: 2, fill: "var(--green)" }} />
            <Line type="monotone" dataKey="Lucro Meta" stroke="var(--green)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Meta form */}
      {last && (
        <div style={{ ...card, padding: 20 }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Definir metas para {formatPeriodo(last.periodo)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Receita Líquida Meta (R$)", key: "receita" as const, placeholder: "Ex: 1000000" },
              { label: "Margem EBITDA Meta (%)",    key: "margem"  as const, placeholder: "Ex: 15" },
              { label: "Lucro Líquido Meta (R$)",   key: "lucro"   as const, placeholder: "Ex: 80000" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                  {f.label}
                </label>
                <input
                  type="number"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-outline-gold text-sm"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Salvo ✓" : saving ? "Salvando..." : "Salvar metas"}
          </button>
        </div>
      )}
    </div>
  );
}
