import { BASE, GOLD, GREEN, BLUE, BORDER, TEXT, TEXT2, TEXT3, LIGHT, formatBRLPrint, formatPctPrint } from "./shared";
import HeaderBlock from "./HeaderBlock";
import type { TemplatePDFProps } from "./shared";
import { DRE_ROWS } from "../../../lib/dreRows";

const SUBTOTAL_BG: Record<string, string> = {
  gold:  "rgba(184,129,30,0.07)",
  green: "rgba(30,122,68,0.07)",
  blue:  "rgba(58,110,200,0.07)",
};
const SUBTOTAL_COLOR: Record<string, string> = {
  gold: GOLD, green: GREEN, blue: BLUE,
};

export default function TemplateDREGerencial({ dreData, company, exportData }: TemplatePDFProps) {
  const { periodRange, generatedAt } = exportData;

  // YTD for each key
  function ytd(key: string): number {
    return dreData.reduce((s, d) => s + ((d as any)[key] as number), 0);
  }

  const colW = Math.max(72, Math.min(90, Math.floor((A4_INNER - 180) / (dreData.length + 1))));

  return (
    <div style={{ ...BASE, padding: "40px 44px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

      <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="DRE Gerencial" />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
        <thead>
          <tr style={{ background: LIGHT, borderBottom: `2px solid ${BORDER}` }}>
            <th style={{ textAlign: "left", padding: "7px 10px 7px 4px", color: TEXT3, fontWeight: 500, whiteSpace: "nowrap", minWidth: 170 }}>
              Linha
            </th>
            {dreData.map((d) => (
              <th key={d.periodo} style={{ textAlign: "right", padding: "7px 6px", color: TEXT3, fontWeight: 500, whiteSpace: "nowrap", width: colW }}>
                {fmtPer(d.periodo)}
              </th>
            ))}
            <th style={{ textAlign: "right", padding: "7px 4px 7px 6px", color: TEXT, fontWeight: 600, whiteSpace: "nowrap", width: colW }}>
              YTD
            </th>
          </tr>
        </thead>
        <tbody>
          {DRE_ROWS.map((row) => {
            const st = row.subtotal as string | false;
            const bg = st ? SUBTOTAL_BG[st] : row.bold ? "rgba(0,0,0,0.025)" : "transparent";
            const labelColor = st ? SUBTOTAL_COLOR[st] : row.bold ? TEXT : TEXT2;
            const ytdVal = ytd(row.key);
            return (
              <tr key={row.key} style={{ borderBottom: `1px solid ${BORDER}`, background: bg }}>
                <td style={{ padding: "5px 10px 5px 4px", color: labelColor, fontWeight: row.bold ? 600 : 400 }}>
                  {row.label}
                </td>
                {dreData.map((d) => {
                  const val = (d as any)[row.key] as number;
                  return (
                    <td key={d.periodo} style={{
                      textAlign: "right",
                      padding: "5px 6px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: val < 0 ? "#B03028" : st ? SUBTOTAL_COLOR[st] : row.bold ? TEXT : TEXT2,
                      fontWeight: row.bold ? 600 : 400,
                    }}>
                      {formatBRLPrint(val)}
                    </td>
                  );
                })}
                <td style={{
                  textAlign: "right",
                  padding: "5px 4px 5px 6px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: ytdVal < 0 ? "#B03028" : st ? SUBTOTAL_COLOR[st] : TEXT,
                  fontWeight: 700,
                }}>
                  {formatBRLPrint(ytdVal)}
                </td>
              </tr>
            );
          })}

          {/* Margin rows */}
          <tr style={{ background: "rgba(30,122,68,0.04)", borderTop: `2px solid ${BORDER}` }}>
            <td colSpan={dreData.length + 2} style={{ padding: "4px 4px 2px", fontSize: 9, color: TEXT3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Margens
            </td>
          </tr>
          {([
            { key: "margem_bruta",   label: "Margem Bruta",   color: GOLD  },
            { key: "margem_ebitda",  label: "Margem EBITDA",  color: GREEN },
            { key: "margem_liquida", label: "Margem Líquida", color: BLUE  },
          ] as const).map((mr) => {
            const ytdRL = dreData.reduce((s, d) => s + d.receita_liquida, 0);
            const ytdNumerator = mr.key === "margem_bruta"
              ? dreData.reduce((s, d) => s + d.lucro_bruto, 0)
              : mr.key === "margem_ebitda"
              ? dreData.reduce((s, d) => s + d.ebitda, 0)
              : dreData.reduce((s, d) => s + d.lucro_liquido, 0);
            const ytdMargem = ytdRL > 0 ? ytdNumerator / ytdRL : 0;
            return (
              <tr key={mr.key} style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(30,122,68,0.04)" }}>
                <td style={{ padding: "5px 10px 5px 4px", color: mr.color, fontWeight: 500 }}>
                  {mr.label}
                </td>
                {dreData.map((d) => (
                  <td key={d.periodo} style={{
                    textAlign: "right",
                    padding: "5px 6px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: mr.color,
                  }}>
                    {formatPctPrint(d[mr.key])}
                  </td>
                ))}
                <td style={{
                  textAlign: "right",
                  padding: "5px 4px 5px 6px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: mr.color,
                  fontWeight: 700,
                }}>
                  {formatPctPrint(ytdMargem)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ position: "absolute", bottom: 22, left: 44, right: 44 }}>
        <div style={{ height: 1, background: BORDER, marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT3 }}>
          <span>FinBoard · DRE Gerencial · {company.name}</span>
          <span>{generatedAt}</span>
        </div>
      </div>
    </div>
  );
}

const A4_INNER = 794 - 88;

function fmtPer(p: string): string {
  const [y, m] = p.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
