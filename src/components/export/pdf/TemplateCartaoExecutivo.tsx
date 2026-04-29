import { BASE, GOLD, GREEN, RED, BLUE, BORDER, TEXT, TEXT2, TEXT3, LIGHT, formatBRLPrint, formatPctPrint, delta } from "./shared";
import HeaderBlock from "./HeaderBlock";
import type { TemplatePDFProps } from "./shared";

export default function TemplateCartaoExecutivo({ dreData, company, exportData }: TemplatePDFProps) {
  const { last, prev, periodRange, generatedAt } = exportData;
  if (!last) return null;

  const kpis = [
    {
      label: "Receita Líquida",
      value: formatBRLPrint(last.receita_liquida),
      delta: delta(last.receita_liquida, prev?.receita_liquida),
      sub: prev ? `vs ${dreData[dreData.length - 2]?.periodo.slice(0, 7)}` : null,
      color: GOLD,
    },
    {
      label: "EBITDA",
      value: formatBRLPrint(last.ebitda),
      delta: delta(last.ebitda, prev?.ebitda),
      sub: `Margem ${formatPctPrint(last.margem_ebitda)}`,
      color: GREEN,
    },
    {
      label: "Margem EBITDA",
      value: formatPctPrint(last.margem_ebitda),
      delta: prev ? (last.margem_ebitda - prev.margem_ebitda) * 100 : null,
      sub: `${dreData.length} meses analisados`,
      color: BLUE,
      isDelta: true,
    },
    {
      label: "Lucro Líquido",
      value: formatBRLPrint(last.lucro_liquido),
      delta: delta(last.lucro_liquido, prev?.lucro_liquido),
      sub: `Margem ${formatPctPrint(last.margem_liquida)}`,
      color: last.lucro_liquido >= 0 ? GREEN : RED,
    },
  ];

  return (
    <div style={{ ...BASE }}>
      {/* Gold top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

      <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="Cartão Executivo" />

      {/* Period badge */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{
          display: "inline-block",
          background: `rgba(184,129,30,0.1)`,
          border: `1px solid rgba(184,129,30,0.3)`,
          borderRadius: 4,
          padding: "4px 16px",
          fontSize: 11,
          color: GOLD,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}>
          {last.periodo.slice(0, 7)}
        </span>
      </div>

      {/* 2×2 KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi) => {
          const d = kpi.delta;
          return (
            <div key={kpi.label} style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
              borderLeft: `4px solid ${kpi.color}`,
            }}>
              <div style={{ fontSize: 10, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 400, color: kpi.color, marginBottom: 8, lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              {d !== null && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: d >= 0 ? GREEN : RED,
                  fontFamily: "'DM Mono', monospace",
                  background: d >= 0 ? "rgba(30,122,68,0.08)" : "rgba(176,48,40,0.08)",
                  padding: "2px 8px",
                  borderRadius: 3,
                }}>
                  {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}{kpi.isDelta ? " p.p." : "%"}
                </div>
              )}
              {kpi.sub && (
                <div style={{ fontSize: 10, color: TEXT3, marginTop: 6 }}>{kpi.sub}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Margin summary strip */}
      <div style={{
        display: "flex",
        gap: 0,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 32,
      }}>
        {[
          { label: "Margem Bruta",   value: last.margem_bruta,   color: GOLD },
          { label: "Margem EBITDA",  value: last.margem_ebitda,  color: GREEN },
          { label: "Margem Líquida", value: last.margem_liquida, color: BLUE },
        ].map((m, i) => (
          <div key={m.label} style={{
            flex: 1,
            padding: "14px 0",
            textAlign: "center",
            borderRight: i < 2 ? `1px solid ${BORDER}` : undefined,
            background: LIGHT,
          }}>
            <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: m.color, fontWeight: 400 }}>
              {formatPctPrint(m.value)}
            </div>
          </div>
        ))}
      </div>

      {/* DRE mini summary */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ background: LIGHT, padding: "8px 16px", fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
          Síntese do Período
        </div>
        {[
          { label: "Receita Bruta",   value: last.receita_bruta },
          { label: "(-) Deduções",    value: -last.deducoes },
          { label: "(=) Rec. Líquida",value: last.receita_liquida, bold: true },
          { label: "(-) CMV/CPV",     value: -last.cmv },
          { label: "(=) Lucro Bruto", value: last.lucro_bruto, bold: true, color: GOLD },
          { label: "(=) EBITDA",      value: last.ebitda, bold: true, color: GREEN },
          { label: "(=) Lucro Líquido",value: last.lucro_liquido, bold: true, color: last.lucro_liquido >= 0 ? GREEN : RED },
        ].map((row, i) => (
          <div key={row.label} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 16px",
            borderTop: `1px solid ${i === 0 ? "transparent" : BORDER}`,
            background: row.bold ? "rgba(0,0,0,0.02)" : "transparent",
          }}>
            <span style={{ fontSize: 11, color: row.bold ? TEXT : TEXT2, fontWeight: row.bold ? 600 : 400 }}>
              {row.label}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: row.color ?? (row.value < 0 ? RED : TEXT2), fontWeight: row.bold ? 600 : 400 }}>
              {formatBRLPrint(row.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 56, right: 56 }}>
        <div style={{ height: 1, background: BORDER, marginBottom: 10 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT3 }}>
          <span>FinBoard · Relatório Confidencial</span>
          <span>Gerado em {generatedAt}</span>
        </div>
      </div>
    </div>
  );
}
