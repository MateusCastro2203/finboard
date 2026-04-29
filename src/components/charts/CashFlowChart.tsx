import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { formatBRL, formatPeriodo } from "../../lib/utils";
import type { FluxoCaixa } from "../../types";

interface Props { data: FluxoCaixa[]; }

const TICK = { fontSize: 11, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

function groupByMonth(entries: FluxoCaixa[]) {
  const map = new Map<string, { entradas: number; saidas: number }>();
  for (const e of entries) {
    const key = e.data.slice(0, 7);
    if (!map.has(key)) map.set(key, { entradas: 0, saidas: 0 });
    const m = map.get(key)!;
    if (e.tipo === "entrada") m.entradas += e.valor;
    else m.saidas += e.valor;
  }
  let saldo = 0;
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, v]) => {
      const fco = v.entradas - v.saidas;
      saldo += fco;
      return { periodo: formatPeriodo(periodo + "-01"), entradas: v.entradas, saidas: v.saidas, fco, saldo_acumulado: saldo };
    });
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-3 rounded-md text-sm"
      style={{ background: "var(--bg-card-2)", border: "1px solid var(--border)", fontFamily: "'Outfit', sans-serif" }}
    >
      <p className="font-medium mb-2" style={{ color: "var(--text)" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ color: "var(--text-3)" }}>{p.name}:</span>
          <span
            className="font-medium font-mono-data"
            style={{ color: p.value < 0 ? "var(--red)" : "var(--green)" }}
          >
            {formatBRL(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CashFlowChart({ data }: Props) {
  const monthly = groupByMonth(data);
  const totalEntradas = monthly.reduce((s, m) => s + m.entradas, 0);
  const totalSaidas   = monthly.reduce((s, m) => s + m.saidas,   0);
  const totalFCO      = totalEntradas - totalSaidas;

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Total Entradas",        value: totalEntradas, color: "var(--green)" },
          { label: "Total Saídas",          value: totalSaidas,   color: "var(--red)" },
          { label: "Geração de Caixa (FCO)", value: totalFCO,     color: totalFCO >= 0 ? "var(--green)" : "var(--red)" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...card, padding: 20 }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              {kpi.label}
            </p>
            <p className="font-mono-data" style={{ fontSize: "1.4rem", fontWeight: 400, color: kpi.color }}>
              {formatBRL(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Entradas vs Saídas */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Entradas vs. Saídas por Mês
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            <Bar dataKey="entradas" name="Entradas" fill="var(--green)" opacity={0.75} radius={[2, 2, 0, 0]} />
            <Bar dataKey="saidas"   name="Saídas"   fill="var(--red)"   opacity={0.75} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FCO mensal */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Geração de Caixa Mensal (FCO)
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="fco" name="FCO" radius={[2, 2, 0, 0]}>
              {monthly.map((entry, i) => (
                <Cell key={i} fill={entry.fco >= 0 ? "var(--green)" : "var(--red)"} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      {monthly.length > 0 && (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
                  {["Período", "Entradas", "Saídas", "FCO", "Saldo Acum."].map((h, i) => (
                    <th
                      key={h}
                      className={i === 0 ? "text-left px-5 py-2.5" : "text-right px-4 py-2.5"}
                      style={{ color: "var(--text-3)", fontWeight: 500 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.periodo} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td className="px-5 py-2 font-medium" style={{ color: "var(--text)" }}>{m.periodo}</td>
                    <td className="text-right px-4 py-2 font-mono-data" style={{ color: "var(--green)" }}>{formatBRL(m.entradas)}</td>
                    <td className="text-right px-4 py-2 font-mono-data" style={{ color: "var(--red)" }}>{formatBRL(m.saidas)}</td>
                    <td className="text-right px-4 py-2 font-mono-data font-medium" style={{ color: m.fco >= 0 ? "var(--green)" : "var(--red)" }}>
                      {formatBRL(m.fco)}
                    </td>
                    <td className="text-right px-4 py-2 font-mono-data" style={{ color: m.saldo_acumulado >= 0 ? "var(--text)" : "var(--red)" }}>
                      {formatBRL(m.saldo_acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
