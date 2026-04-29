import { BASE, GOLD, GREEN, RED, BLUE, BORDER, TEXT, TEXT2, TEXT3, LIGHT, formatPctPrint, formatBRLPrint } from "./shared";
import HeaderBlock from "./HeaderBlock";
import type { TemplatePDFProps } from "./shared";

const MARGINS = [
  { key: "margem_bruta"   as const, label: "Margem Bruta",   color: GOLD,  num: "lucro_bruto"   as const },
  { key: "margem_ebitda"  as const, label: "Margem EBITDA",  color: GREEN, num: "ebitda"         as const },
  { key: "margem_liquida" as const, label: "Margem Líquida", color: BLUE,  num: "lucro_liquido"  as const },
];

export default function TemplateAnaliseMargens({ dreData, company, exportData }: TemplatePDFProps) {
  const { periodRange, generatedAt, ytd } = exportData;

  function avg(key: "margem_bruta" | "margem_ebitda" | "margem_liquida") {
    return dreData.reduce((s, d) => s + d[key], 0) / (dreData.length || 1);
  }
  function best(key: "margem_bruta" | "margem_ebitda" | "margem_liquida") {
    return dreData.reduce((best, d) => d[key] > best[key] ? d : best, dreData[0]);
  }
  function worst(key: "margem_bruta" | "margem_ebitda" | "margem_liquida") {
    return dreData.reduce((worst, d) => d[key] < worst[key] ? d : worst, dreData[0]);
  }

  return (
    <div style={{ ...BASE }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

      <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="Análise de Margens" />

      {/* Summary KPI row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {MARGINS.map((m) => {
          const ytdVal = m.key === "margem_bruta" ? ytd.margem_bruta
            : m.key === "margem_ebitda" ? ytd.margem_ebitda
            : ytd.margem_liquida;
          const avgVal = avg(m.key);
          return (
            <div key={m.key} style={{
              flex: 1,
              border: `1px solid ${BORDER}`,
              borderTop: `3px solid ${m.color}`,
              borderRadius: 6,
              padding: "14px 16px",
              background: "#fff",
            }}>
              <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.09em", marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, color: m.color, marginBottom: 4 }}>
                {formatPctPrint(ytdVal)}
              </div>
              <div style={{ fontSize: 10, color: TEXT3 }}>
                Média mensal: <span style={{ color: m.color, fontWeight: 500 }}>{formatPctPrint(avgVal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main margin evolution table */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: LIGHT, padding: "6px 12px", fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
          Evolução Mensal das Margens
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
              <th style={{ textAlign: "left", padding: "6px 12px", color: TEXT3, fontWeight: 500, width: 130 }}>Margem</th>
              {dreData.map((d) => (
                <th key={d.periodo} style={{ textAlign: "center", padding: "6px 4px", color: TEXT3, fontWeight: 500, fontSize: 9 }}>
                  {fmtPer(d.periodo)}
                </th>
              ))}
              <th style={{ textAlign: "center", padding: "6px 6px", color: TEXT3, fontWeight: 500, fontSize: 9, minWidth: 52 }}>Média</th>
              <th style={{ textAlign: "center", padding: "6px 6px", color: GREEN, fontWeight: 500, fontSize: 9, minWidth: 52 }}>Melhor</th>
              <th style={{ textAlign: "center", padding: "6px 6px", color: RED, fontWeight: 500, fontSize: 9, minWidth: 52 }}>Pior</th>
            </tr>
          </thead>
          <tbody>
            {MARGINS.map((m, mi) => {
              const avgV = avg(m.key);
              const bestD = best(m.key);
              const worstD = worst(m.key);
              return (
                <tr key={m.key} style={{ borderBottom: `1px solid ${BORDER}`, background: mi % 2 === 0 ? "rgba(0,0,0,0.01)" : "transparent" }}>
                  <td style={{ padding: "7px 12px", fontWeight: 600, color: m.color, fontSize: 11 }}>
                    {m.label}
                  </td>
                  {dreData.map((d, i) => {
                    const val = d[m.key];
                    const prev = i > 0 ? dreData[i - 1][m.key] : null;
                    const diff = prev !== null ? val - prev : null;
                    const isAboveAvg = val > avgV;
                    const isNeg = val < 0;
                    return (
                      <td key={d.periodo} style={{
                        textAlign: "center",
                        padding: "7px 4px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        color: isNeg ? RED : m.color,
                        background: isNeg ? "rgba(176,48,40,0.06)"
                          : isAboveAvg ? "rgba(30,122,68,0.05)"
                          : "transparent",
                      }}>
                        <div>{formatPctPrint(val)}</div>
                        {diff !== null && (
                          <div style={{ fontSize: 8, color: diff >= 0 ? GREEN : RED, marginTop: 1 }}>
                            {diff >= 0 ? "▲" : "▼"}{Math.abs(diff * 100).toFixed(1)}p
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", padding: "7px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: TEXT2, fontWeight: 600 }}>
                    {formatPctPrint(avgV)}
                  </td>
                  <td style={{ textAlign: "center", padding: "7px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: GREEN }}>
                    {formatPctPrint(bestD[m.key])}
                    <div style={{ fontSize: 8, color: TEXT3 }}>{fmtPer(bestD.periodo)}</div>
                  </td>
                  <td style={{ textAlign: "center", padding: "7px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: RED }}>
                    {formatPctPrint(worstD[m.key])}
                    <div style={{ fontSize: 8, color: TEXT3 }}>{fmtPer(worstD.periodo)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insight boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {MARGINS.map((m) => {
          const ytdRL = dreData.reduce((s, d) => s + d.receita_liquida, 0);
          const ytdNum = dreData.reduce((s, d) => s + d[m.num], 0);
          return (
            <div key={m.key} style={{
              background: LIGHT,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{m.label} — YTD</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: m.color, marginBottom: 2 }}>
                {ytdRL > 0 ? formatPctPrint(ytdNum / ytdRL) : "—"}
              </div>
              <div style={{ fontSize: 10, color: TEXT2 }}>{formatBRLPrint(ytdNum)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 22, left: 56, right: 56 }}>
        <div style={{ height: 1, background: BORDER, marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT3 }}>
          <span>FinBoard · Análise de Margens · {company.name}</span>
          <span>{generatedAt}</span>
        </div>
      </div>
    </div>
  );
}

function fmtPer(p: string): string {
  const [y, m] = p.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
