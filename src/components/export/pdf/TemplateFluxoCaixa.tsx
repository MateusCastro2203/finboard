import { BASE, GOLD, GREEN, RED, BORDER, TEXT, TEXT2, TEXT3, LIGHT, formatBRLPrint } from "./shared";
import HeaderBlock from "./HeaderBlock";
import type { TemplatePDFProps } from "./shared";

export default function TemplateFluxoCaixa({ company, exportData }: TemplatePDFProps) {
  const { periodRange, generatedAt, monthly, totalEntradas, totalSaidas, geracao } = exportData;

  const geracaoColor = geracao >= 0 ? GREEN : RED;

  return (
    <div style={{ ...BASE }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

      <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="Fluxo de Caixa" />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Entradas",   value: totalEntradas,  color: GREEN, bg: "rgba(30,122,68,0.07)" },
          { label: "Total Saídas",     value: -totalSaidas,   color: RED,   bg: "rgba(176,48,40,0.07)" },
          { label: "Geração de Caixa", value: geracao,        color: geracaoColor, bg: geracaoColor === GREEN ? "rgba(30,122,68,0.07)" : "rgba(176,48,40,0.07)" },
        ].map((c) => (
          <div key={c.label} style={{
            flex: 1,
            padding: "18px 20px",
            background: c.bg,
            border: `1px solid ${c.color}22`,
            borderRadius: 8,
            borderLeft: `4px solid ${c.color}`,
          }}>
            <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, color: c.color, fontWeight: 400 }}>
              {formatBRLPrint(c.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: LIGHT, padding: "6px 12px", fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
          Movimentação Mensal
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
              {["Período", "Entradas Op.", "Saídas Op.", "FCO", "Saldo Acumulado"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? "left" : "right",
                  padding: "7px 12px",
                  color: TEXT3,
                  fontWeight: 500,
                  fontSize: 10,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthly.map((row, i) => (
              <tr key={row.periodo} style={{
                borderBottom: `1px solid ${BORDER}`,
                background: i % 2 === 0 ? "rgba(0,0,0,0.015)" : "transparent",
              }}>
                <td style={{ padding: "6px 12px", color: TEXT, fontWeight: 500, fontSize: 11 }}>
                  {row.periodo}
                </td>
                <td style={{ textAlign: "right", padding: "6px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: GREEN }}>
                  {formatBRLPrint(row.entradas)}
                </td>
                <td style={{ textAlign: "right", padding: "6px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: RED }}>
                  {formatBRLPrint(row.saidas)}
                </td>
                <td style={{
                  textAlign: "right",
                  padding: "6px 12px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  color: row.fco >= 0 ? GREEN : RED,
                }}>
                  {formatBRLPrint(row.fco)}
                </td>
                <td style={{
                  textAlign: "right",
                  padding: "6px 12px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: row.saldo_acumulado >= 0 ? TEXT2 : RED,
                }}>
                  {formatBRLPrint(row.saldo_acumulado)}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr style={{ background: LIGHT, borderTop: `2px solid ${BORDER}` }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: TEXT, fontSize: 11 }}>Total</td>
              <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: GREEN }}>
                {formatBRLPrint(totalEntradas)}
              </td>
              <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: RED }}>
                {formatBRLPrint(totalSaidas)}
              </td>
              <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: geracaoColor }}>
                {formatBRLPrint(geracao)}
              </td>
              <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: TEXT }}>
                —
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FCO breakdown note */}
      <div style={{
        background: "rgba(184,129,30,0.06)",
        border: `1px solid rgba(184,129,30,0.2)`,
        borderRadius: 6,
        padding: "12px 16px",
        fontSize: 10,
        color: TEXT2,
      }}>
        <span style={{ fontWeight: 600, color: GOLD }}>FCO</span> = Entradas Operacionais − Saídas Operacionais (resultado líquido de caixa do período).
        Saldo acumulado representa o caixa gerado ao longo de todo o intervalo analisado.
      </div>

      <div style={{ position: "absolute", bottom: 22, left: 56, right: 56 }}>
        <div style={{ height: 1, background: BORDER, marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT3 }}>
          <span>FinBoard · Fluxo de Caixa · {company.name} · Baseado em lançamentos realizados</span>
          <span>{generatedAt}</span>
        </div>
      </div>
    </div>
  );
}
