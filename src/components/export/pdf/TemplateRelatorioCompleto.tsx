import { BASE, GOLD, GREEN, RED, BLUE, BORDER, TEXT, TEXT2, TEXT3, LIGHT, formatBRLPrint, formatPctPrint, delta } from "./shared";
import HeaderBlock from "./HeaderBlock";
import type { TemplatePDFProps } from "./shared";
import { DRE_ROWS } from "../../../lib/dreRows";

const CONDENSED_KEYS = ["receita_liquida", "lucro_bruto", "ebitda", "ebit", "lucro_liquido"] as const;
const CONDENSED_COLORS: Record<string, string> = {
  receita_liquida: TEXT,
  lucro_bruto: GOLD,
  ebitda: GREEN,
  ebit: TEXT2,
  lucro_liquido: BLUE,
};

export default function TemplateRelatorioCompleto({ dreData, company, exportData }: TemplatePDFProps) {
  const { last, prev, ytd, monthly, periodRange, generatedAt, totalEntradas, totalSaidas, geracao } = exportData;
  if (!last) return null;

  const rows = DRE_ROWS.filter((r) => CONDENSED_KEYS.includes(r.key as any));
  const geracaoColor = geracao >= 0 ? GREEN : RED;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: TEXT, background: "#fff" }}>

      {/* ───── PAGE 1 — COVER ───── */}
      <div className="pdf-page-break" style={{
        width: 794,
        minHeight: 1123,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 80px",
        position: "relative",
        boxSizing: "border-box",
      }}>
        {/* Decorative top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: GOLD }} />

        {/* FinBoard logo */}
        <div style={{ fontFamily: "'Cormorant', serif", fontSize: 18, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 48 }}>
          FinBoard
        </div>

        {/* Watermark */}
        <div style={{ position: "absolute", fontSize: 120, fontFamily: "'Cormorant', serif", color: GOLD, opacity: 0.04, userSelect: "none", letterSpacing: "0.02em" }}>
          FB
        </div>

        {/* Main content */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ fontFamily: "'Cormorant', serif", fontSize: 42, fontWeight: 400, color: TEXT, marginBottom: 8, lineHeight: 1.2 }}>
            {company.name}
          </div>
          {company.segmento && (
            <div style={{ fontSize: 13, color: TEXT3, marginBottom: 4 }}>{company.segmento}</div>
          )}
          {company.cnpj && (
            <div style={{ fontSize: 11, color: TEXT3, marginBottom: 32 }}>CNPJ {company.cnpj}</div>
          )}
          <div style={{ width: 64, height: 2, background: GOLD, margin: "0 auto 32px" }} />
          <div style={{ fontSize: 16, color: TEXT2, fontWeight: 500, marginBottom: 6 }}>
            Relatório Financeiro
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, color: GOLD, marginBottom: 32 }}>
            {periodRange}
          </div>
          <div style={{ fontSize: 11, color: TEXT3 }}>
            Gerado em {generatedAt}
          </div>
        </div>

        {/* Bottom tag */}
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", fontSize: 10, color: TEXT3, letterSpacing: "0.08em" }}>
          CONFIDENCIAL · USO INTERNO
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: LIGHT }} />
      </div>

      {/* ───── PAGE 2 — KPIs + CONDENSED DRE ───── */}
      <div className="pdf-page-break" style={{ ...BASE, paddingTop: 40 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

        <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="Resumo Financeiro" />

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Receita Líquida", value: last.receita_liquida, prev: prev?.receita_liquida, ytdV: ytd.receita_liquida, color: GOLD },
            { label: "EBITDA",          value: last.ebitda,          prev: prev?.ebitda,          ytdV: ytd.ebitda,          color: GREEN },
            { label: "Lucro Bruto",     value: last.lucro_bruto,     prev: prev?.lucro_bruto,     ytdV: ytd.lucro_bruto,     color: TEXT2 },
            { label: "Lucro Líquido",   value: last.lucro_liquido,   prev: prev?.lucro_liquido,   ytdV: ytd.lucro_liquido,   color: last.lucro_liquido >= 0 ? BLUE : RED },
          ].map((kpi) => {
            const d = delta(kpi.value, kpi.prev);
            return (
              <div key={kpi.label} style={{
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${kpi.color}`,
                borderRadius: 6,
                padding: "14px 18px",
                background: "#fff",
              }}>
                <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.09em", marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, color: kpi.color, marginBottom: 4 }}>
                  {formatBRLPrint(kpi.value)}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 9 }}>
                  {d !== null && (
                    <span style={{ color: d >= 0 ? GREEN : RED }}>
                      {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% MoM
                    </span>
                  )}
                  <span style={{ color: TEXT3 }}>YTD: <span style={{ color: TEXT2 }}>{formatBRLPrint(kpi.ytdV)}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Margins */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Margem Bruta", val: last.margem_bruta, ytdV: ytd.margem_bruta, color: GOLD },
            { label: "Margem EBITDA", val: last.margem_ebitda, ytdV: ytd.margem_ebitda, color: GREEN },
            { label: "Margem Líquida", val: last.margem_liquida, ytdV: ytd.margem_liquida, color: BLUE },
          ].map((m) => (
            <div key={m.label} style={{
              flex: 1,
              background: LIGHT,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: "10px 14px",
            }}>
              <div style={{ fontSize: 9, color: TEXT3, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: m.color }}>{formatPctPrint(m.val)}</div>
              <div style={{ fontSize: 9, color: TEXT3 }}>YTD {formatPctPrint(m.ytdV)}</div>
            </div>
          ))}
        </div>

        {/* Condensed DRE */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ background: LIGHT, padding: "6px 12px", fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
            Síntese DRE — Linhas Principais
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: LIGHT }}>
                <th style={{ textAlign: "left", padding: "6px 12px", color: TEXT3, fontWeight: 500 }}>Linha</th>
                {dreData.slice(-6).map((d) => (
                  <th key={d.periodo} style={{ textAlign: "right", padding: "6px 8px", color: TEXT3, fontWeight: 500, fontSize: 9 }}>
                    {fmtPer(d.periodo)}
                  </th>
                ))}
                <th style={{ textAlign: "right", padding: "6px 8px 6px 12px", color: TEXT, fontWeight: 700, fontSize: 9 }}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ytdVal = dreData.reduce((s, d) => s + (d as any)[row.key], 0);
                const color = CONDENSED_COLORS[row.key] ?? TEXT2;
                return (
                  <tr key={row.key} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "5px 12px", fontWeight: 600, color, fontSize: 11 }}>{row.label}</td>
                    {dreData.slice(-6).map((d) => {
                      const val = (d as any)[row.key] as number;
                      return (
                        <td key={d.periodo} style={{
                          textAlign: "right", padding: "5px 8px",
                          fontFamily: "'DM Mono', monospace", fontSize: 10,
                          color: val < 0 ? RED : color, fontWeight: 500,
                        }}>
                          {formatBRLPrint(val)}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "right", padding: "5px 8px 5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: ytdVal < 0 ? RED : color }}>
                      {formatBRLPrint(ytdVal)}
                    </td>
                  </tr>
                );
              })}
              {/* Margin rows */}
              {[
                { label: "Margem Bruta",   key: "margem_bruta"   as const, color: GOLD  },
                { label: "Margem EBITDA",  key: "margem_ebitda"  as const, color: GREEN },
                { label: "Margem Líquida", key: "margem_liquida" as const, color: BLUE  },
              ].map((mr) => (
                <tr key={mr.key} style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(30,122,68,0.04)" }}>
                  <td style={{ padding: "5px 12px", fontWeight: 500, color: mr.color, fontSize: 11 }}>{mr.label}</td>
                  {dreData.slice(-6).map((d) => (
                    <td key={d.periodo} style={{ textAlign: "right", padding: "5px 8px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: mr.color }}>
                      {formatPctPrint(d[mr.key])}
                    </td>
                  ))}
                  <td style={{ textAlign: "right", padding: "5px 8px 5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: mr.color }}>
                    {formatPctPrint(ytd[mr.key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───── PAGE 3 — CASH FLOW ───── */}
      <div style={{ ...BASE, paddingTop: 40 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: GOLD }} />

        <HeaderBlock company={company} periodRange={periodRange} generatedAt={generatedAt} title="Fluxo de Caixa" />

        {/* Summary */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Entradas",   value: totalEntradas, color: GREEN, bg: "rgba(30,122,68,0.07)" },
            { label: "Total Saídas",     value: totalSaidas,   color: RED,   bg: "rgba(176,48,40,0.07)" },
            { label: "Geração de Caixa", value: geracao,       color: geracaoColor, bg: geracaoColor === GREEN ? "rgba(30,122,68,0.07)" : "rgba(176,48,40,0.07)" },
          ].map((c) => (
            <div key={c.label} style={{
              flex: 1,
              padding: "14px 16px",
              background: c.bg,
              border: `1px solid ${c.color}22`,
              borderRadius: 8,
              borderLeft: `3px solid ${c.color}`,
            }}>
              <div style={{ fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: c.color }}>{formatBRLPrint(c.value)}</div>
            </div>
          ))}
        </div>

        {/* Cash flow table */}
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ background: LIGHT, padding: "6px 12px", fontSize: 9, color: TEXT3, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
            Movimentação Mensal
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {["Período", "Entradas Op.", "Saídas Op.", "FCO", "Saldo Acumulado"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "6px 12px", color: TEXT3, fontWeight: 500, fontSize: 10 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((row, i) => (
                <tr key={row.periodo} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? "rgba(0,0,0,0.015)" : "transparent" }}>
                  <td style={{ padding: "5px 12px", color: TEXT, fontWeight: 500 }}>{row.periodo}</td>
                  <td style={{ textAlign: "right", padding: "5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: GREEN }}>{formatBRLPrint(row.entradas)}</td>
                  <td style={{ textAlign: "right", padding: "5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: RED }}>{formatBRLPrint(row.saidas)}</td>
                  <td style={{ textAlign: "right", padding: "5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: row.fco >= 0 ? GREEN : RED }}>
                    {formatBRLPrint(row.fco)}
                  </td>
                  <td style={{ textAlign: "right", padding: "5px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: row.saldo_acumulado >= 0 ? TEXT2 : RED }}>
                    {formatBRLPrint(row.saldo_acumulado)}
                  </td>
                </tr>
              ))}
              <tr style={{ background: LIGHT, borderTop: `2px solid ${BORDER}` }}>
                <td style={{ padding: "7px 12px", fontWeight: 700, color: TEXT }}>Total</td>
                <td style={{ textAlign: "right", padding: "7px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: GREEN }}>{formatBRLPrint(totalEntradas)}</td>
                <td style={{ textAlign: "right", padding: "7px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: RED }}>{formatBRLPrint(totalSaidas)}</td>
                <td style={{ textAlign: "right", padding: "7px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: geracaoColor }}>{formatBRLPrint(geracao)}</td>
                <td style={{ textAlign: "right", padding: "7px 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: TEXT }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ position: "absolute", bottom: 22, left: 56, right: 56 }}>
          <div style={{ height: 1, background: BORDER, marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT3 }}>
            <span>FinBoard · Relatório Financeiro Completo · {company.name}</span>
            <span>{generatedAt}</span>
          </div>
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
