import { formatBRL, formatPercent } from "../../lib/utils";
import type { DreCalculado } from "../../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props { data: DreCalculado[]; }

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const COLORS  = ["var(--gold)", "var(--green)", "var(--blue)"];
const TICK    = { fontSize: 11, fill: "var(--text-3)", fontFamily: "'Outfit', sans-serif" };

export default function AnnualChart({ data }: Props) {
  const byYear = new Map<string, DreCalculado[]>();
  for (const d of data) {
    const year = d.periodo.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(d);
  }
  const years = Array.from(byYear.keys()).sort();

  function sumYear(entries: DreCalculado[]) {
    return entries.reduce(
      (acc, d) => ({
        receita_bruta:   acc.receita_bruta   + d.receita_bruta,
        receita_liquida: acc.receita_liquida + d.receita_liquida,
        lucro_bruto:     acc.lucro_bruto     + d.lucro_bruto,
        ebitda:          acc.ebitda          + d.ebitda,
        lucro_liquido:   acc.lucro_liquido   + d.lucro_liquido,
        months:          acc.months          + 1,
      }),
      { receita_bruta: 0, receita_liquida: 0, lucro_bruto: 0, ebitda: 0, lucro_liquido: 0, months: 0 }
    );
  }

  const yearTotals = years.map(y => ({ year: y, ...sumYear(byYear.get(y)!) }));

  const chartData = MONTHS.map((m, i) => {
    const row: Record<string, number | string | null> = { mes: m };
    for (const y of years) {
      const entry = byYear.get(y)?.find(d => parseInt(d.periodo.slice(5, 7)) - 1 === i);
      row[y] = entry?.receita_liquida ?? null;
    }
    return row;
  }).filter(row => years.some(y => row[y] !== null));

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  };

  const ROWS = [
    { label: "Receita Bruta",   key: "receita_bruta"   as const },
    { label: "Receita Líquida", key: "receita_liquida" as const },
    { label: "Lucro Bruto",     key: "lucro_bruto"     as const },
    { label: "EBITDA",          key: "ebitda"          as const },
    { label: "Lucro Líquido",   key: "lucro_liquido"   as const },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Annual totals comparison table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Comparativo Anual — Totais Acumulados
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-5 py-2.5" style={{ color: "var(--text-3)", fontWeight: 500 }}>Indicador</th>
                {yearTotals.map(y => (
                  <th key={y.year} className="text-right px-4 py-2.5" style={{ color: "var(--text-3)", fontWeight: 500 }}>
                    {y.year}
                    <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 400, marginLeft: 4 }}>
                      ({y.months}m)
                    </span>
                  </th>
                ))}
                {yearTotals.length >= 2 && (
                  <th className="text-right px-4 py-2.5" style={{ color: "var(--text-3)", fontWeight: 500, fontSize: "0.75rem" }}>Δ%</th>
                )}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => {
                const last2 = yearTotals.slice(-2);
                const delta = last2.length === 2 && last2[0][row.key] !== 0
                  ? ((last2[1][row.key] - last2[0][row.key]) / Math.abs(last2[0][row.key])) * 100
                  : null;
                return (
                  <tr key={row.key} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td className="px-5 py-2" style={{ color: "var(--text-2)" }}>{row.label}</td>
                    {yearTotals.map(y => (
                      <td key={y.year} className="text-right px-4 py-2 font-mono-data"
                        style={{ color: y[row.key] < 0 ? "var(--red)" : "var(--text)" }}>
                        {formatBRL(y[row.key])}
                      </td>
                    ))}
                    {yearTotals.length >= 2 && (
                      <td className="text-right px-4 py-2 font-mono-data"
                        style={{ color: delta === null ? "var(--text-3)" : delta >= 0 ? "var(--green)" : "var(--red)", fontSize: "0.75rem" }}>
                        {delta === null ? "—" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}%`}
                      </td>
                    )}
                  </tr>
                );
              })}
              {/* Margin rows */}
              {[
                { label: "Margem EBITDA",  getValue: (y: typeof yearTotals[0]) => y.receita_liquida > 0 ? y.ebitda / y.receita_liquida : 0 },
                { label: "Margem Líquida", getValue: (y: typeof yearTotals[0]) => y.receita_liquida > 0 ? y.lucro_liquido / y.receita_liquida : 0 },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--green-dim)" }}>
                  <td className="px-5 py-2 font-medium" style={{ color: "var(--green)", fontSize: "0.8125rem" }}>{row.label}</td>
                  {yearTotals.map(y => (
                    <td key={y.year} className="text-right px-4 py-2 font-mono-data" style={{ color: "var(--green)" }}>
                      {formatPercent(row.getValue(y))}
                    </td>
                  ))}
                  {yearTotals.length >= 2 && <td className="px-4 py-2" />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart: monthly Receita Líquida by year */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Receita Líquida por Mês — Comparativo Anual
        </p>
        <ResponsiveContainer width="100%" height="100%" minHeight={200} aspect={2.5}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number) => formatBRL(v)}
              contentStyle={{ background: "var(--bg-card-2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "'Outfit', sans-serif", fontSize: 11, color: "var(--text)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            {years.map((y, i) => (
              <Bar key={y} dataKey={y} fill={COLORS[i % COLORS.length]} opacity={0.8} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
