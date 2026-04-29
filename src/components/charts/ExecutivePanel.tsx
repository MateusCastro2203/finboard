import { formatBRL, formatPercent, formatPeriodo } from "../../lib/utils";
import type { DreCalculado, FluxoCaixa } from "../../types";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  dreData: DreCalculado[];
  fluxoData: FluxoCaixa[];
  companyName: string;
  cnpj?: string | null;
  segmento?: string | null;
}

const TICK = { fontSize: 10, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

export default function ExecutivePanel({ dreData, fluxoData, companyName, cnpj, segmento }: Props) {

  function formatCNPJ(v: string) {
    const d = v.replace(/\D/g, "");
    if (d.length !== 14) return v;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  }
  const last = dreData[dreData.length - 1];
  const prev = dreData[dreData.length - 2];

  function delta(cur: number, pre: number | undefined) {
    if (!pre || pre === 0) return null;
    return ((cur - pre) / Math.abs(pre)) * 100;
  }

  const trendData = dreData.slice(-6).map((d) => ({
    p: formatPeriodo(d.periodo),
    rl: d.receita_liquida / 1000,
    ebitda: d.ebitda / 1000,
  }));

  const totalFluxoEntradas = fluxoData.filter(f => f.tipo === "entrada").reduce((s, f) => s + f.valor, 0);
  const totalFluxoSaidas   = fluxoData.filter(f => f.tipo === "saida").reduce((s, f) => s + f.valor, 0);

  if (!last) {
    return (
      <div
        className="p-12 text-center rounded-md"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-3)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.875rem",
        }}
      >
        Sem dados financeiros para exibir.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Label */}
      <div className="no-print">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Painel Executivo — Boardroom
        </p>
      </div>

      {/* Main panel */}
      <div
        className="rounded-md overflow-hidden print-full"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Report header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-2)" }}
        >
          <div>
            <span
              className="font-display text-lg"
              style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.04em" }}
            >
              FinBoard
            </span>
            <p
              className="text-sm mt-0.5 font-medium"
              style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
            >
              {companyName}
            </p>
            {cnpj && (
              <p className="text-xs mt-0.5 font-mono-data" style={{ color: "var(--text-3)" }}>
                CNPJ {formatCNPJ(cnpj)}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              {segmento ? `${segmento} · ` : ""}Relatório Executivo Financeiro
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>Período de referência</p>
            <p
              className="font-mono-data mt-0.5"
              style={{ color: "var(--gold)", fontSize: "0.9rem" }}
            >
              {formatPeriodo(last.periodo)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Gerado em {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* KPI grid */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
            >
              Indicadores do Mês — {formatPeriodo(last.periodo)}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { label: "Receita Líquida",  value: last.receita_liquida,  prev: prev?.receita_liquida },
                { label: "Lucro Bruto",      value: last.lucro_bruto,      prev: prev?.lucro_bruto,      margin: last.margem_bruta },
                { label: "EBITDA",           value: last.ebitda,           prev: prev?.ebitda,            margin: last.margem_ebitda },
                { label: "Lucro Líquido",    value: last.lucro_liquido,    prev: prev?.lucro_liquido,     margin: last.margem_liquida },
              ].map((kpi) => {
                const d = kpi.prev !== undefined ? delta(kpi.value, kpi.prev) : null;
                return (
                  <div
                    key={kpi.label}
                    style={{ background: "var(--bg-card-2)", borderRadius: 4, border: "1px solid var(--border-soft)", padding: "10px 12px" }}
                  >
                    <p style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", marginBottom: 4 }}>
                      {kpi.label}
                    </p>
                    <p className="font-mono-data" style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)", fontWeight: 400, color: "var(--text)", lineHeight: 1.2 }}>
                      {formatBRL(kpi.value)}
                    </p>
                    {kpi.margin !== undefined && (
                      <p style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.7rem", marginTop: 2 }}>
                        {formatPercent(kpi.margin)} margem
                      </p>
                    )}
                    {d !== null && (
                      <p className="font-mono-data" style={{ fontSize: "0.7rem", marginTop: 4, color: d >= 0 ? "var(--green)" : "var(--red)" }}>
                        {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend + Margins */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
              >
                Tendência — Receita e EBITDA (R$ mil)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData}>
                  <XAxis dataKey="p" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} tickFormatter={(v) => `${v}K`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => `R$ ${v.toFixed(0)}K`}
                    contentStyle={{
                      background: "var(--bg-card-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 11,
                      color: "var(--text)",
                    }}
                    itemStyle={{ color: "var(--text-2)" }}
                  />
                  <Line type="monotone" dataKey="rl"     stroke="var(--gold)"  strokeWidth={1.5} dot={{ r: 2, fill: "var(--gold)" }}  name="Receita Líq." />
                  <Line type="monotone" dataKey="ebitda" stroke="var(--green)" strokeWidth={1.5} dot={{ r: 2, fill: "var(--green)" }} name="EBITDA" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
              >
                Margens — Mês atual
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Margem Bruta",    value: last.margem_bruta,    color: "var(--gold)" },
                  { label: "Margem EBITDA",   value: last.margem_ebitda,   color: "var(--green)" },
                  { label: "Margem Líquida",  value: last.margem_liquida,  color: "var(--blue)" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", fontSize: "0.8125rem" }}>
                        {m.label}
                      </span>
                      <span className="font-mono-data font-medium" style={{ color: "var(--text)", fontSize: "0.8125rem" }}>
                        {formatPercent(m.value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(m.value * 100 * 2.5, 100)}%`, background: m.color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cash flow summary */}
          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 20 }}>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
            >
              Fluxo de Caixa — Período completo
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Entradas",          value: totalFluxoEntradas, color: "var(--green)" },
                { label: "Saídas",            value: totalFluxoSaidas,   color: "var(--red)" },
                { label: "Geração de Caixa",  value: totalFluxoEntradas - totalFluxoSaidas, color: (totalFluxoEntradas - totalFluxoSaidas) >= 0 ? "var(--green)" : "var(--red)" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ background: "var(--bg-card-2)", borderRadius: 4, border: "1px solid var(--border-soft)", padding: "12px 14px" }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{item.label}</p>
                  <p className="font-mono-data" style={{ fontSize: "1rem", fontWeight: 400, color: item.color }}>
                    {formatBRL(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center gap-2 text-xs"
            style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 16, color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            <span
              className="font-display"
              style={{ color: "var(--gold)", fontSize: "0.9rem", fontWeight: 400, letterSpacing: "0.04em" }}
            >
              FinBoard
            </span>
            <span>· Relatório Confidencial · Uso Interno</span>
          </div>
        </div>
      </div>
    </div>
  );
}
