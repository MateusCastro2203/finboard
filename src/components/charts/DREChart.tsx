import { useState } from "react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Line, ComposedChart
} from "recharts";
import { formatBRL, formatPercent, formatPeriodo } from "../../lib/utils";
import type { DreCalculado, FluxoCaixa, FluxoCategoria } from "../../types";
import { DRE_ROWS } from "../../lib/dreRows";

function calcularProjecao(data: DreCalculado[]) {
  if (data.length < 3) return [];
  const last3 = data.slice(-3);

  function growthRate(values: number[]): number {
    const valid = values.filter(v => v > 0);
    if (valid.length < 2) return 0;
    return Math.pow(valid[valid.length - 1] / valid[0], 1 / (valid.length - 1)) - 1;
  }

  const rlGrowth     = growthRate(last3.map(d => d.receita_liquida));
  const ebitdaGrowth = growthRate(last3.map(d => d.ebitda));
  const lastRL       = data[data.length - 1].receita_liquida;
  const lastEBITDA   = data[data.length - 1].ebitda;
  const lastPeriodo  = data[data.length - 1].periodo;

  return Array.from({ length: 3 }, (_, i) => {
    const [year, month] = lastPeriodo.split("-").map(Number);
    const next = new Date(year, month - 1 + i + 1, 1);
    const label = formatPeriodo(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    return {
      periodo:     label,
      rl_proj:     lastRL     * Math.pow(1 + rlGrowth,     i + 1),
      ebitda_proj: lastEBITDA * Math.pow(1 + ebitdaGrowth, i + 1),
    };
  });
}

const CATEGORIA_LABELS: Record<FluxoCategoria, string> = {
  operacional_recebimento: "Recebimentos Operacionais",
  operacional_pagamento:   "Pagamentos Operacionais",
  investimento:            "Investimentos",
  financiamento_entrada:   "Financiamento (entrada)",
  financiamento_saida:     "Financiamento (saída)",
};

interface Props {
  data: DreCalculado[];
  fluxoData?: FluxoCaixa[];
  onTabChange?: (tab: string) => void;
}

const TICK = { fontSize: 11, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

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
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill ?? p.stroke }} />
          <span style={{ color: "var(--text-3)" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>
            {typeof p.value === "number" && p.name?.includes("%")
              ? `${p.value.toFixed(1)}%`
              : formatBRL(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DREChart({ data, fluxoData = [], onTabChange }: Props) {
  const [showProjecao, setShowProjecao] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const realData = data.map((d) => ({
    periodo: formatPeriodo(d.periodo),
    "Receita Líq.": d.receita_liquida,
    "EBITDA": d.ebitda,
    "Margem EBITDA %": d.margem_ebitda * 100,
  }));

  const projecao = showProjecao && data.length >= 3 ? calcularProjecao(data) : [];
  const chartData = [
    ...realData,
    ...projecao.map(p => ({ periodo: p.periodo, rl_proj: p.rl_proj, ebitda_proj: p.ebitda_proj })),
  ];

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  // ── Caixa do mês (último período da DRE) ──
  const lastYM = last?.periodo.slice(0, 7) ?? "";
  const fluxoMes = fluxoData.filter(f => f.data.startsWith(lastYM));
  const entradasMes = fluxoMes.filter(f => f.tipo === "entrada").reduce((s, f) => s + f.valor, 0);
  const saidasMes   = fluxoMes.filter(f => f.tipo === "saida").reduce((s, f) => s + f.valor, 0);
  const fcoMes = entradasMes - saidasMes;

  const caixaByCat = new Map<FluxoCategoria, { entradas: number; saidas: number }>();
  for (const f of fluxoMes) {
    if (!caixaByCat.has(f.categoria)) caixaByCat.set(f.categoria, { entradas: 0, saidas: 0 });
    const g = caixaByCat.get(f.categoria)!;
    if (f.tipo === "entrada") g.entradas += f.valor;
    else g.saidas += f.valor;
  }

  function delta(cur: number, pre: number) {
    if (!pre) return null;
    return ((cur - pre) / Math.abs(pre)) * 100;
  }

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "clamp(12px, 3vw, 16px)",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Cards */}
      {last && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Receita Líquida",  value: last.receita_liquida,  prev: prev?.receita_liquida },
            { label: "Lucro Bruto",      value: last.lucro_bruto,      prev: prev?.lucro_bruto },
            { label: "EBITDA",           value: last.ebitda,           prev: prev?.ebitda },
            { label: "Lucro Líquido",    value: last.lucro_liquido,    prev: prev?.lucro_liquido },
          ].map((kpi) => {
            const d = kpi.prev !== undefined ? delta(kpi.value, kpi.prev) : null;
            return (
              <div key={kpi.label} style={card}>
                <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  {kpi.label}
                </p>
                <p
                  className="font-mono-data"
                  style={{ fontSize: "clamp(0.85rem, 4vw, 1.25rem)", fontWeight: 400, color: "var(--text)" }}
                >
                  {formatBRL(kpi.value)}
                </p>
                {d !== null && (
                  <p
                    className="text-xs mt-1 font-mono-data"
                    style={{ color: d >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% vs mês ant.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Evolução — Receita vs. Resultado
          </p>
          {data.length >= 3 && (
            <button
              onClick={() => setShowProjecao(v => !v)}
              style={{
                fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4,
                border: "1px solid var(--border)",
                background: showProjecao ? "var(--gold-dim)" : "transparent",
                color: showProjecao ? "var(--gold)" : "var(--text-3)",
                fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              }}
            >
              Projeção 3m
            </button>
          )}
        </div>
        <ResponsiveContainer width="100%" height="100%" minHeight={200} aspect={2.2}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            <Bar yAxisId="left" dataKey="Receita Líq." fill="var(--gold)" opacity={0.35} radius={[2, 2, 0, 0]} />
            <Bar yAxisId="left" dataKey="EBITDA" fill="var(--green)" opacity={0.8} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="Margem EBITDA %" stroke="var(--gold)" strokeWidth={1.5} dot={false} />
            {showProjecao && (
              <>
                <Line yAxisId="left" type="monotone" dataKey="rl_proj" name="Receita Líq. (proj.)" stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.55} />
                <Line yAxisId="left" type="monotone" dataKey="ebitda_proj" name="EBITDA (proj.)" stroke="var(--green)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.55} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {showProjecao && (
          <p style={{ fontSize: "0.68rem", color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", textAlign: "center", marginTop: 8 }}>
            Projeção baseada na tendência dos últimos 3 meses. Não constitui previsão garantida.
          </p>
        )}
      </div>

      {/* ── Caixa do Mês ── */}
      {last && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Caixa do Mês — {formatPeriodo(last.periodo)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", opacity: 0.7 }}>
                Regime de caixa vs. resultado pelo regime de competência (DRE)
              </p>
            </div>
            {onTabChange && (
              <button
                onClick={() => onTabChange("fluxo")}
                style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Ver detalhes →
              </button>
            )}
          </div>

          {fluxoMes.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Nenhum lançamento de caixa registrado para este período.
              </p>
              {onTabChange && (
                <button
                  onClick={() => onTabChange("fluxo")}
                  className="mt-2 text-xs underline"
                  style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif", background: "none", border: "none", cursor: "pointer" }}
                >
                  Adicionar via Fluxo de Caixa
                </button>
              )}
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4">
              {/* Mini-cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Entradas",    value: entradasMes, color: "var(--green)" },
                  { label: "Saídas",      value: saidasMes,   color: "var(--red)"   },
                  { label: "FCO (caixa)", value: fcoMes,      color: fcoMes >= 0 ? "var(--green)" : "var(--red)" },
                ].map(k => (
                  <div key={k.label} className="rounded-md p-3" style={{ background: "var(--bg-card-2)", border: "1px solid var(--border-soft)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{k.label}</p>
                    <p className="font-mono-data font-medium" style={{ color: k.color, fontSize: "clamp(0.8rem, 3vw, 1rem)" }}>{formatBRL(k.value)}</p>
                  </div>
                ))}
              </div>

              {/* Comparação competência vs caixa */}
              {last && (
                <div
                  className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-md text-xs"
                  style={{ background: "var(--bg-card-2)", fontFamily: "'Outfit', sans-serif" }}
                >
                  <span style={{ color: "var(--text-3)" }}>Lucro Líquido (competência):</span>
                  <span className="font-mono-data font-medium" style={{ color: last.lucro_liquido >= 0 ? "var(--green)" : "var(--red)" }}>
                    {formatBRL(last.lucro_liquido)}
                  </span>
                  <span style={{ color: "var(--border)", margin: "0 2px" }}>·</span>
                  <span style={{ color: "var(--text-3)" }}>FCO (caixa):</span>
                  <span className="font-mono-data font-medium" style={{ color: fcoMes >= 0 ? "var(--green)" : "var(--red)" }}>
                    {formatBRL(fcoMes)}
                  </span>
                  {(() => {
                    const diff = fcoMes - last.lucro_liquido;
                    if (Math.abs(diff) < 1) return null;
                    return (
                      <span
                        className="ml-auto px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: diff > 0 ? "var(--green-dim)" : "var(--red-dim)",
                          color: diff > 0 ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {diff > 0 ? "Caixa acima do lucro" : "Caixa abaixo do lucro"}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Breakdown por categoria */}
              <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full" style={{ fontSize: "0.78rem", fontFamily: "'Outfit', sans-serif" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card-2)", borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-2" style={{ color: "var(--text-3)", fontWeight: 500 }}>Categoria</th>
                      <th className="text-right px-4 py-2" style={{ color: "var(--green)", fontWeight: 500 }}>Entradas</th>
                      <th className="text-right px-4 py-2" style={{ color: "var(--red)", fontWeight: 500 }}>Saídas</th>
                      <th className="text-right px-4 py-2" style={{ color: "var(--text-3)", fontWeight: 500 }}>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(caixaByCat.entries()).map(([cat, v], i) => {
                      const liquido = v.entradas - v.saidas;
                      return (
                        <tr key={cat} style={{ borderBottom: "1px solid var(--border-soft)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                          <td className="px-4 py-2" style={{ color: "var(--text-2)" }}>{CATEGORIA_LABELS[cat]}</td>
                          <td className="text-right px-4 py-2 font-mono-data" style={{ color: v.entradas > 0 ? "var(--green)" : "var(--text-3)" }}>
                            {v.entradas > 0 ? formatBRL(v.entradas) : "—"}
                          </td>
                          <td className="text-right px-4 py-2 font-mono-data" style={{ color: v.saidas > 0 ? "var(--red)" : "var(--text-3)" }}>
                            {v.saidas > 0 ? formatBRL(v.saidas) : "—"}
                          </td>
                          <td className="text-right px-4 py-2 font-mono-data font-medium" style={{ color: liquido >= 0 ? "var(--green)" : "var(--red)" }}>
                            {formatBRL(liquido)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRE Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Demonstração do Resultado do Exercício
          </p>
          <button
            onClick={() => setShowAnalysis(v => !v)}
            style={{
              fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4,
              border: "1px solid var(--border)",
              background: showAnalysis ? "var(--gold-dim)" : "transparent",
              color: showAnalysis ? "var(--gold)" : "var(--text-3)",
              fontFamily: "'Outfit', sans-serif", cursor: "pointer",
            }}
          >
            Análise H/V
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-5 py-2.5" style={{ color: "var(--text-3)", fontWeight: 500 }}>Linha</th>
                {data.flatMap((d) => {
                  const cells = [
                    <th key={d.periodo} className="text-right px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-3)", fontWeight: 500 }}>
                      {formatPeriodo(d.periodo)}
                    </th>,
                  ];
                  if (showAnalysis) {
                    cells.push(
                      <th key={`${d.periodo}-prl`} className="text-right px-2 py-2.5" style={{ color: "var(--text-3)", fontWeight: 400, fontSize: "0.7rem" }}>% RL</th>,
                      <th key={`${d.periodo}-delta`} className="text-right px-2 py-2.5" style={{ color: "var(--text-3)", fontWeight: 400, fontSize: "0.7rem" }}>Δ%</th>,
                    );
                  }
                  return cells;
                })}
              </tr>
            </thead>
            <tbody>
              {DRE_ROWS.map((row) => (
                <tr
                  key={row.key}
                  style={{
                    borderBottom: "1px solid var(--border-soft)",
                    background: row.bold ? "var(--bg-card-2)" : "transparent",
                  }}
                >
                  <td
                    className="px-5 py-2"
                    style={{ color: row.bold ? "var(--text)" : "var(--text-2)", fontWeight: row.bold ? 500 : 400 }}
                  >
                    {row.label}
                  </td>
                  {data.flatMap((d, idx) => {
                    const val = d[row.key as keyof DreCalculado] as number;
                    const prevD = idx > 0 ? data[idx - 1] : null;
                    const prevVal = prevD ? prevD[row.key as keyof DreCalculado] as number : 0;
                    const prl = d.receita_liquida > 0 ? (val / d.receita_liquida) * 100 : null;
                    const deltaVal = prevD && prevVal !== 0 ? ((val - prevVal) / Math.abs(prevVal)) * 100 : null;
                    const deltaColor = deltaVal === null ? "var(--text-3)"
                      : row.positive === true  ? (deltaVal >= 0 ? "var(--green)" : "var(--red)")
                      : row.positive === false ? (deltaVal <= 0 ? "var(--green)" : "var(--red)")
                      : "var(--text-3)";
                    const cells = [
                      <td
                        key={`${d.periodo}-val`}
                        className="text-right px-4 py-2 font-mono-data"
                        style={{
                          color: val < 0 ? "var(--red)" : row.bold ? "var(--text)" : "var(--text-2)",
                          fontWeight: row.bold ? 500 : 400,
                        }}
                      >
                        {formatBRL(val)}
                      </td>,
                    ];
                    if (showAnalysis) {
                      cells.push(
                        <td key={`${d.periodo}-prl`} className="text-right px-2 py-2 font-mono-data" style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>
                          {prl !== null ? `${prl.toFixed(1)}%` : "—"}
                        </td>,
                        <td key={`${d.periodo}-delta`} className="text-right px-2 py-2 font-mono-data" style={{ color: deltaColor, fontSize: "0.72rem" }}>
                          {deltaVal !== null ? `${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(1)}%` : "—"}
                        </td>,
                      );
                    }
                    return cells;
                  })}
                </tr>
              ))}
              {/* Margin rows */}
              {[
                { label: "Margem Bruta",   key: "margem_bruta"   as const },
                { label: "Margem EBITDA",  key: "margem_ebitda"  as const },
                { label: "Margem Líquida", key: "margem_liquida" as const },
              ].map((mr) => (
                <tr key={mr.label} style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--green-dim)" }}>
                  <td className="px-5 py-2 font-medium" style={{ color: "var(--green)", fontFamily: "'Outfit', sans-serif", fontSize: "0.8125rem" }}>
                    {mr.label}
                  </td>
                  {data.flatMap((d) => {
                    const cells = [
                      <td key={`${d.periodo}-val`} className="text-right px-4 py-2 font-mono-data" style={{ color: "var(--green)" }}>
                        {formatPercent(d[mr.key])}
                      </td>,
                    ];
                    if (showAnalysis) {
                      cells.push(
                        <td key={`${d.periodo}-prl`} />,
                        <td key={`${d.periodo}-delta`} />,
                      );
                    }
                    return cells;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
