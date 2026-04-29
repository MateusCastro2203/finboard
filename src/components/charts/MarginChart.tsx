import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { formatPercent, formatBRL, formatPeriodo } from "../../lib/utils";
import type { DreCalculado } from "../../types";

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
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.stroke }} />
          <span style={{ color: "var(--text-3)" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function MarginChart({ data }: Props) {
  const chartData = data.map((d) => ({
    periodo: formatPeriodo(d.periodo),
    "Margem Bruta":   parseFloat((d.margem_bruta   * 100).toFixed(2)),
    "Margem EBITDA":  parseFloat((d.margem_ebitda  * 100).toFixed(2)),
    "Margem Líquida": parseFloat((d.margem_liquida * 100).toFixed(2)),
  }));

  const last = data[data.length - 1];
  const acumulado = data.reduce(
    (acc, d) => ({
      receita:      acc.receita      + d.receita_liquida,
      lucro_bruto:  acc.lucro_bruto  + d.lucro_bruto,
      ebitda:       acc.ebitda       + d.ebitda,
      lucro_liquido:acc.lucro_liquido + d.lucro_liquido,
    }),
    { receita: 0, lucro_bruto: 0, ebitda: 0, lucro_liquido: 0 }
  );

  const acumMargem = {
    bruta:   acumulado.receita > 0 ? acumulado.lucro_bruto   / acumulado.receita : 0,
    ebitda:  acumulado.receita > 0 ? acumulado.ebitda        / acumulado.receita : 0,
    liquida: acumulado.receita > 0 ? acumulado.lucro_liquido / acumulado.receita : 0,
  };

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  };

  const marginColors = ["var(--gold)", "var(--green)", "var(--blue)"];

  return (
    <div className="flex flex-col gap-5">
      {/* Margin KPI cards */}
      {last && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Margem Bruta",    value: last.margem_bruta,    acum: acumMargem.bruta,   color: marginColors[0] },
            { label: "Margem EBITDA",   value: last.margem_ebitda,   acum: acumMargem.ebitda,  color: marginColors[1] },
            { label: "Margem Líquida",  value: last.margem_liquida,  acum: acumMargem.liquida, color: marginColors[2] },
          ].map((kpi) => (
            <div key={kpi.label} style={{ ...card, padding: 20 }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                {kpi.label}
              </p>
              <p
                className="font-mono-data mb-3"
                style={{ fontSize: "1.75rem", fontWeight: 400, color: "var(--text)" }}
              >
                {formatPercent(kpi.value)}
              </p>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(kpi.value * 100 * 2, 100)}%`,
                    background: kpi.color,
                    opacity: 0.75,
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Acumulado: {formatPercent(kpi.acum)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Trend chart */}
      <div style={{ ...card, padding: "20px 20px 12px" }}>
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Tendência de Margem — últimos meses
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: "var(--text-3)" }} />
            <ReferenceLine y={0} stroke="var(--red)" strokeDasharray="3 3" opacity={0.5} />
            <Line type="monotone" dataKey="Margem Bruta"   stroke={marginColors[0]} strokeWidth={2} dot={{ r: 2.5, fill: marginColors[0] }} />
            <Line type="monotone" dataKey="Margem EBITDA"  stroke={marginColors[1]} strokeWidth={2} dot={{ r: 2.5, fill: marginColors[1] }} />
            <Line type="monotone" dataKey="Margem Líquida" stroke={marginColors[2]} strokeWidth={2} dot={{ r: 2.5, fill: marginColors[2] }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accumulated totals */}
      <div style={{ ...card, padding: 20 }}>
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Resultado Acumulado do Período
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Receita Líquida",  value: acumulado.receita },
            { label: "Lucro Bruto",      value: acumulado.lucro_bruto },
            { label: "EBITDA",           value: acumulado.ebitda },
            { label: "Lucro Líquido",    value: acumulado.lucro_liquido },
          ].map((item) => (
            <div
              key={item.label}
              style={{ background: "var(--bg-card-2)", borderRadius: 4, padding: "12px 14px" }}
            >
              <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                {item.label}
              </p>
              <p
                className="font-mono-data"
                style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text)" }}
              >
                {formatBRL(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
