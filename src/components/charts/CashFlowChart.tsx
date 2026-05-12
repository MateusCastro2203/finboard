import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { formatBRL, formatPeriodo } from "../../lib/utils";
import type { FluxoCaixa, FluxoCategoria } from "../../types";

interface Props { data: FluxoCaixa[]; }

const TICK = { fontSize: 11, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

const CATEGORIA_LABELS: Record<FluxoCategoria, string> = {
  operacional_recebimento: "Recebimentos Operacionais",
  operacional_pagamento:   "Pagamentos Operacionais",
  investimento:            "Investimentos",
  financiamento_entrada:   "Financiamento (entrada)",
  financiamento_saida:     "Financiamento (saída)",
};

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
      return { periodo: formatPeriodo(periodo + "-01"), raw: periodo, entradas: v.entradas, saidas: v.saidas, fco, saldo_acumulado: saldo };
    });
}

function getMonthDetail(entries: FluxoCaixa[], ym: string) {
  const items = entries.filter(e => e.data.startsWith(ym));
  const entradas = items.filter(e => e.tipo === "entrada");
  const saidas   = items.filter(e => e.tipo === "saida");

  function byCat(list: FluxoCaixa[]) {
    const map = new Map<FluxoCategoria, { total: number; rows: FluxoCaixa[] }>();
    for (const e of list) {
      if (!map.has(e.categoria)) map.set(e.categoria, { total: 0, rows: [] });
      const g = map.get(e.categoria)!;
      g.total += e.valor;
      g.rows.push(e);
    }
    return map;
  }

  return {
    entradas: byCat(entradas),
    saidas:   byCat(saidas),
    totalEntradas: entradas.reduce((s, e) => s + e.valor, 0),
    totalSaidas:   saidas.reduce((s, e) => s + e.valor, 0),
  };
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
          <span className="font-medium font-mono-data" style={{ color: p.value < 0 ? "var(--red)" : "var(--green)" }}>
            {formatBRL(Math.abs(p.value))}
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

  const lastMonth = monthly[monthly.length - 1]?.raw ?? "";
  const [selectedMonth, setSelectedMonth] = useState(lastMonth);

  const detail = selectedMonth ? getMonthDetail(data, selectedMonth) : null;
  const fcoMes = detail ? detail.totalEntradas - detail.totalSaidas : 0;

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Total Entradas",         value: totalEntradas, color: "var(--green)" },
          { label: "Total Saídas",           value: totalSaidas,   color: "var(--red)"   },
          { label: "Geração de Caixa (FCO)", value: totalFCO,      color: totalFCO >= 0 ? "var(--green)" : "var(--red)" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...card, padding: 20 }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              {kpi.label}
            </p>
            <p className="font-mono-data" style={{ fontSize: "clamp(1rem, 3.5vw, 1.4rem)", fontWeight: 400, color: kpi.color }}>
              {formatBRL(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts — side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entradas vs Saídas */}
        <div style={{ ...card, padding: "20px 20px 12px" }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Entradas vs. Saídas por Mês
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
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
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Geração de Caixa Mensal (FCO)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
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
      </div>

      {/* Resumo detalhado por mês */}
      {monthly.length > 0 && (
        <div style={{ ...card, overflow: "hidden" }}>
          {/* Header com seletor */}
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Resumo Detalhado
            </p>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                fontSize: "0.8rem", padding: "4px 10px", borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-card-2)",
                color: "var(--text)",
                fontFamily: "'Outfit', sans-serif",
                outline: "none",
              }}
            >
              {monthly.map((m) => (
                <option key={m.raw} value={m.raw}>{m.periodo}</option>
              ))}
            </select>
          </div>

          {detail && (
            <div className="p-5 flex flex-col gap-5">
              {/* FCO do mês */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Entradas",    value: detail.totalEntradas, color: "var(--green)" },
                  { label: "Saídas",      value: detail.totalSaidas,   color: "var(--red)"   },
                  { label: "Saldo (FCO)", value: fcoMes, color: fcoMes >= 0 ? "var(--green)" : "var(--red)" },
                ].map((k) => (
                  <div key={k.label} className="flex-1 min-w-[120px] rounded-md p-3" style={{ background: "var(--bg-card-2)", border: "1px solid var(--border-soft)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{k.label}</p>
                    <p className="font-mono-data font-medium" style={{ color: k.color, fontSize: "1rem" }}>{formatBRL(k.value)}</p>
                  </div>
                ))}
              </div>

              {/* Entradas por categoria */}
              {detail.entradas.size > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--green)", fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Entradas
                  </p>
                  <div className="flex flex-col gap-1">
                    {Array.from(detail.entradas.entries()).map(([cat, group]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between py-1.5 px-3 rounded" style={{ background: "var(--green-dim)" }}>
                          <span className="text-sm font-medium" style={{ color: "var(--green)", fontFamily: "'Outfit', sans-serif" }}>
                            {CATEGORIA_LABELS[cat]}
                          </span>
                          <span className="font-mono-data font-medium text-sm" style={{ color: "var(--green)" }}>
                            {formatBRL(group.total)}
                          </span>
                        </div>
                        {group.rows.length > 1 && group.rows.map((row) => (
                          <div key={row.id} className="flex items-center justify-between py-1 px-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                            <span className="text-xs truncate max-w-[60%]" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                              {row.descricao || "—"}
                            </span>
                            <span className="font-mono-data text-xs" style={{ color: "var(--text-2)" }}>
                              {formatBRL(row.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saídas por categoria */}
              {detail.saidas.size > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--red)", fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Saídas
                  </p>
                  <div className="flex flex-col gap-1">
                    {Array.from(detail.saidas.entries()).map(([cat, group]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between py-1.5 px-3 rounded" style={{ background: "var(--red-dim)" }}>
                          <span className="text-sm font-medium" style={{ color: "var(--red)", fontFamily: "'Outfit', sans-serif" }}>
                            {CATEGORIA_LABELS[cat]}
                          </span>
                          <span className="font-mono-data font-medium text-sm" style={{ color: "var(--red)" }}>
                            {formatBRL(group.total)}
                          </span>
                        </div>
                        {group.rows.length > 1 && group.rows.map((row) => (
                          <div key={row.id} className="flex items-center justify-between py-1 px-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                            <span className="text-xs truncate max-w-[60%]" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                              {row.descricao || "—"}
                            </span>
                            <span className="font-mono-data text-xs" style={{ color: "var(--text-2)" }}>
                              {formatBRL(row.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.entradas.size === 0 && detail.saidas.size === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Nenhuma movimentação neste mês.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabela resumo */}
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
                  <tr
                    key={m.periodo}
                    onClick={() => setSelectedMonth(m.raw)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border-soft)",
                      background: selectedMonth === m.raw ? "var(--gold-dim)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (selectedMonth !== m.raw) (e.currentTarget as HTMLElement).style.background = "var(--bg-card-2)"; }}
                    onMouseLeave={(e) => { if (selectedMonth !== m.raw) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td className="px-5 py-2 font-medium" style={{ color: selectedMonth === m.raw ? "var(--gold)" : "var(--text)" }}>{m.periodo}</td>
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
