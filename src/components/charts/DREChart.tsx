import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Line, ComposedChart
} from "recharts";
import { formatBRL, formatPercent, formatPeriodo } from "../../lib/utils";
import type { DreCalculado } from "../../types";
import { DRE_ROWS } from "../../lib/dreRows";

interface Props { data: DreCalculado[]; }

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

export default function DREChart({ data }: Props) {
  const chartData = data.map((d) => ({
    periodo: formatPeriodo(d.periodo),
    "Receita Líq.": d.receita_liquida,
    "EBITDA": d.ebitda,
    "Margem EBITDA %": d.margem_ebitda * 100,
  }));

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  function delta(cur: number, pre: number) {
    if (!pre) return null;
    return ((cur - pre) / Math.abs(pre)) * 100;
  }

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "16px",
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
                  style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--text)" }}
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
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Evolução — Receita vs. Resultado
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            <Bar yAxisId="left" dataKey="Receita Líq." fill="var(--gold)" opacity={0.35} radius={[2, 2, 0, 0]} />
            <Bar yAxisId="left" dataKey="EBITDA" fill="var(--green)" opacity={0.8} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="Margem EBITDA %" stroke="var(--gold)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* DRE Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Demonstração do Resultado do Exercício
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-5 py-2.5" style={{ color: "var(--text-3)", fontWeight: 500 }}>Linha</th>
                {data.map((d) => (
                  <th key={d.periodo} className="text-right px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-3)", fontWeight: 500 }}>
                    {formatPeriodo(d.periodo)}
                  </th>
                ))}
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
                  {data.map((d) => {
                    const val = d[row.key as keyof DreCalculado] as number;
                    return (
                      <td
                        key={d.periodo}
                        className="text-right px-4 py-2 font-mono-data"
                        style={{
                          color: val < 0 ? "var(--red)" : row.bold ? "var(--text)" : "var(--text-2)",
                          fontWeight: row.bold ? 500 : 400,
                        }}
                      >
                        {formatBRL(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Margin rows */}
              {[
                { label: "Margem Bruta",    key: "margem_bruta" as const },
                { label: "Margem EBITDA",   key: "margem_ebitda" as const },
                { label: "Margem Líquida",  key: "margem_liquida" as const },
              ].map((mr) => (
                <tr key={mr.label} style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--green-dim)" }}>
                  <td className="px-5 py-2 font-medium" style={{ color: "var(--green)", fontFamily: "'Outfit', sans-serif", fontSize: "0.8125rem" }}>
                    {mr.label}
                  </td>
                  {data.map((d) => (
                    <td key={d.periodo} className="text-right px-4 py-2 font-mono-data" style={{ color: "var(--green)" }}>
                      {formatPercent(d[mr.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
