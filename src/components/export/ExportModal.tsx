import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, FileText, FileSpreadsheet, Check } from "lucide-react";
import type { DreCalculado, FluxoCaixa, Company } from "../../types";
import { useExportData } from "./useExportData";
import PrintContainer from "./pdf/PrintContainer";
import TemplateCartaoExecutivo from "./pdf/TemplateCartaoExecutivo";
import TemplateDREGerencial from "./pdf/TemplateDREGerencial";
import TemplateAnaliseMargens from "./pdf/TemplateAnaliseMargens";
import TemplateRelatorioCompleto from "./pdf/TemplateRelatorioCompleto";
import TemplateFluxoCaixa from "./pdf/TemplateFluxoCaixa";
import { generateXLSX } from "./xlsx/generateXLSX";

interface Props {
  open: boolean;
  onClose: () => void;
  dreData: DreCalculado[];
  fluxoData: FluxoCaixa[];
  company: Company;
}

const A4 = 794;

const TEMPLATES = [
  { id: "cartao",   label: "Cartão Executivo",  desc: "1 página · KPIs grandes + síntese",    component: TemplateCartaoExecutivo   },
  { id: "dre",      label: "DRE Gerencial",      desc: "1-2 páginas · Tabela completa",         component: TemplateDREGerencial      },
  { id: "margens",  label: "Análise de Margens", desc: "1 página · Evolução das margens",       component: TemplateAnaliseMargens    },
  { id: "completo", label: "Relatório Completo", desc: "3 páginas · Capa + DRE + Fluxo",        component: TemplateRelatorioCompleto },
  { id: "fluxo",    label: "Fluxo de Caixa",     desc: "1 página · Caixa mensal",               component: TemplateFluxoCaixa        },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const XLSX_SHEETS = [
  { name: "Resumo",         desc: "KPIs do último período e YTD" },
  { name: "DRE",            desc: "Todas as 16 linhas × todos os meses + YTD" },
  { name: "Margens",        desc: "Margens Bruta, EBITDA e Líquida mensais" },
  { name: "Fluxo de Caixa", desc: "Entradas, Saídas, FCO e Saldo Acumulado" },
];

/* ─── shared tokens ─── */
const t = {
  titleSize:     "clamp(1.25rem, 5vw, 1.5rem)",
  bodySize:      "clamp(0.9375rem, 2.5vw, 1rem)",      /* 15–16px */
  secondarySize: "clamp(0.8125rem, 2vw, 0.875rem)",    /* 13–14px */
  labelSize:     "0.6875rem",                           /* 11px — ALL CAPS labels */
  hintSize:      "clamp(0.75rem, 1.8vw, 0.8125rem)",   /* 12–13px */
  fontBody:      "'Outfit', sans-serif",
  gap:           "1rem",
  radius:        "0.5rem",
};

export default function ExportModal({ open, onClose, dreData, fluxoData, company }: Props) {
  const [tab, setTab]                     = useState<"pdf" | "xlsx">("pdf");
  const [selected, setSelected]           = useState<TemplateId>("cartao");
  const [xlsxLoading, setXlsxLoading]     = useState(false);
  const [xlsxDone, setXlsxDone]           = useState(false);

  const exportData      = useExportData(dreData, fluxoData, company);
  const SelectedTemplate = TEMPLATES.find(tp => tp.id === selected)!.component;
  const templateProps   = { dreData, fluxoData, company, exportData };

  /* Lock body scroll while modal is open */
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleXLSX = useCallback(async () => {
    setXlsxLoading(true);
    try {
      await generateXLSX(dreData, fluxoData, company, exportData.monthly);
      setXlsxDone(true);
      setTimeout(() => setXlsxDone(false), 3000);
    } finally { setXlsxLoading(false); }
  }, [dreData, fluxoData, company, exportData.monthly]);

  if (!open) return null;

  return (
    <>
      {createPortal(
        /* ── Backdrop ── */
        <div
          className="no-print flex items-end md:items-center justify-center md:p-6"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* ── Sheet / Dialog ── */}
          <div
            className="w-full rounded-t-2xl md:rounded-2xl md:max-w-4xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              /* dvh accounts for mobile browser chrome (iOS Safari address bar) */
              minHeight: "min(65dvh, 65vh)",
              maxHeight: "min(90dvh, 90vh)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Drag handle — mobile only */}
            <div className="flex md:hidden justify-center pt-3 pb-1 flex-shrink-0">
              <div style={{ width: "2.5rem", height: "0.25rem", borderRadius: "99px", background: "var(--border)" }} />
            </div>

            {/* ── Header ── */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{ padding: "1rem 1.25rem 0.875rem", borderBottom: "1px solid var(--border)" }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  className="font-display truncate"
                  style={{ fontSize: t.titleSize, fontWeight: 400, color: "var(--text)", lineHeight: 1.25 }}
                >
                  Exportar Relatório
                </h2>
                <p
                  className="truncate"
                  style={{ fontSize: t.secondarySize, color: "var(--text-3)", fontFamily: t.fontBody, marginTop: "0.2rem" }}
                >
                  {company.name} · {exportData.periodRange}
                </p>
              </div>
              {/* Close — 44px touch target */}
              <button
                onClick={onClose}
                aria-label="Fechar"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "2.75rem", height: "2.75rem",
                  borderRadius: "0.375rem", cursor: "pointer",
                  background: "transparent", border: "none",
                  color: "var(--text-3)", flexShrink: 0, marginLeft: "0.5rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div
              className="flex flex-shrink-0"
              style={{ padding: "0 1.25rem", borderBottom: "1px solid var(--border)" }}
            >
              {([
                { id: "pdf"  as const, label: "PDF",   icon: <FileText size={15} /> },
                { id: "xlsx" as const, label: "Excel",  icon: <FileSpreadsheet size={15} /> },
              ]).map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setTab(tp.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    /* 44px min touch height: 13px top + 18px content + 13px bottom */
                    padding: "0.8125rem 1rem",
                    fontSize: t.bodySize,
                    fontFamily: t.fontBody,
                    fontWeight: tab === tp.id ? 600 : 400,
                    color: tab === tp.id ? "var(--gold)" : "var(--text-3)",
                    background: "transparent", border: "none",
                    borderBottom: tab === tp.id ? "2px solid var(--gold)" : "2px solid transparent",
                    cursor: "pointer", marginBottom: "-1px",
                  }}
                >
                  {tp.icon}
                  {tp.label}
                </button>
              ))}
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "1.25rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>

              {tab === "pdf" ? (
                <>
                  {/* ══ MOBILE layout (< 768px) ══ */}
                  <div className="md:hidden">
                    <p style={{
                      fontSize: t.labelSize, color: "var(--text-3)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      fontFamily: t.fontBody, marginBottom: "0.75rem",
                    }}>
                      Escolha o modelo
                    </p>

                    {/* Template cards — vertical list, full-width tap targets */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
                      {TEMPLATES.map((tp) => {
                        const active = selected === tp.id;
                        return (
                          <button
                            key={tp.id}
                            onClick={() => setSelected(tp.id)}
                            style={{
                              display: "flex", alignItems: "center",
                              width: "100%", textAlign: "left",
                              /* 44px+ touch target via padding */
                              padding: "0.875rem 1rem",
                              background: active ? "var(--gold-dim)" : "var(--bg-card-2)",
                              border: `1.5px solid ${active ? "var(--gold)" : "var(--border)"}`,
                              borderRadius: t.radius,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: t.bodySize, fontWeight: active ? 600 : 500,
                                color: active ? "var(--gold)" : "var(--text)",
                                fontFamily: t.fontBody,
                              }}>
                                {tp.label}
                              </div>
                              <div style={{
                                fontSize: t.secondarySize,
                                color: "var(--text-3)",
                                fontFamily: t.fontBody,
                                marginTop: "0.2rem",
                              }}>
                                {tp.desc}
                              </div>
                            </div>
                            <div style={{
                              width: "1.5rem", height: "1.5rem", borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem",
                              background: active ? "var(--gold)" : "var(--border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "background 0.15s",
                            }}>
                              {active
                                ? <Check size={11} color="#fff" strokeWidth={3} />
                                : <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--bg-card)" }} />
                              }
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action — full-width, 52px tall */}
                    <button
                      onClick={handlePrint}
                      className="btn btn-gold w-full justify-center"
                      style={{ fontSize: "1rem", padding: "0.9375rem 1.25rem", borderRadius: t.radius }}
                    >
                      <Download size={18} />
                      Salvar PDF
                    </button>
                    <p style={{
                      textAlign: "center", fontSize: t.hintSize,
                      color: "var(--text-3)", marginTop: "0.625rem", fontFamily: t.fontBody,
                    }}>
                      Escolha "Salvar como PDF" no menu de impressão
                    </p>
                  </div>

                  {/* ══ DESKTOP layout (≥ 768px) ══ */}
                  <div className="hidden md:flex" style={{ gap: "1.5rem" }}>
                    {/* Left: thumbnail picker */}
                    <div style={{ flexShrink: 0, width: "10rem" }}>
                      <p style={{
                        fontSize: "0.625rem", color: "var(--text-3)",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        marginBottom: "0.625rem", fontFamily: t.fontBody,
                      }}>
                        Modelo
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {TEMPLATES.map((tp) => {
                          const active = selected === tp.id;
                          return (
                            <button
                              key={tp.id}
                              onClick={() => setSelected(tp.id)}
                              style={{
                                background: "transparent",
                                border: `1px solid ${active ? "var(--gold)" : "var(--border)"}`,
                                borderRadius: "0.375rem", overflow: "hidden",
                                cursor: "pointer", position: "relative",
                                padding: 0, textAlign: "left",
                              }}
                            >
                              <div style={{ width: "158px", height: "100px", overflow: "hidden", background: "#fff" }}>
                                <div style={{ transform: "scale(0.2)", transformOrigin: "top left", width: A4, height: 500, pointerEvents: "none", userSelect: "none" }}>
                                  <tp.component {...templateProps} />
                                </div>
                              </div>
                              <div style={{
                                padding: "0.4375rem 0.625rem",
                                borderTop: `1px solid ${active ? "var(--gold)" : "var(--border)"}`,
                                background: active ? "var(--gold-dim)" : "var(--bg-card-2)",
                              }}>
                                <div style={{ fontSize: "0.6875rem", fontWeight: 500, color: active ? "var(--gold)" : "var(--text)", fontFamily: t.fontBody }}>
                                  {tp.label}
                                </div>
                                <div style={{ fontSize: "0.5625rem", color: "var(--text-3)", fontFamily: t.fontBody, marginTop: "0.0625rem" }}>
                                  {tp.desc}
                                </div>
                              </div>
                              {active && (
                                <div style={{
                                  position: "absolute", top: "0.375rem", right: "0.375rem",
                                  width: "1.125rem", height: "1.125rem", borderRadius: "50%",
                                  background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <Check size={10} color="#fff" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: A4 preview */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <p style={{ fontSize: "0.625rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem", fontFamily: t.fontBody }}>
                        Pré-visualização
                      </p>
                      <div style={{ flex: 1, overflow: "auto", background: "var(--bg-surface)", borderRadius: "0.375rem", border: "1px solid var(--border)", padding: "1rem" }}>
                        {/* inner wrapper clamps the scaled A4 — no fixed px width so it adapts to flex column */}
                        <div style={{ maxWidth: "100%", overflow: "hidden", margin: "0 auto" }}>
                          <div style={{ transform: "scale(0.6)", transformOrigin: "top left", width: A4, pointerEvents: "none", userSelect: "none" }}>
                            <SelectedTemplate {...templateProps} />
                          </div>
                        </div>
                      </div>
                      <button onClick={handlePrint} className="btn btn-gold" style={{ marginTop: "0.875rem", justifyContent: "center", padding: "0.75rem 1.5rem", fontSize: "0.875rem" }}>
                        <Download size={16} />
                        Salvar PDF
                      </button>
                      <p style={{ textAlign: "center", fontSize: "0.625rem", color: "var(--text-3)", marginTop: "0.5rem", fontFamily: t.fontBody }}>
                        Use "Salvar como PDF" no menu de impressão do navegador
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* ══ XLSX tab ══ */
                <div>
                  <p style={{ fontSize: t.bodySize, color: "var(--text-2)", fontFamily: t.fontBody, marginBottom: "1.25rem" }}>
                    O arquivo Excel contém <strong style={{ color: "var(--text)" }}>4 abas</strong> com todos os dados formatados.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.75rem" }}>
                    {XLSX_SHEETS.map((s, i) => (
                      <div
                        key={s.name}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.875rem",
                          padding: "0.875rem 1rem",
                          background: "var(--bg-card-2)", border: "1px solid var(--border)", borderRadius: t.radius,
                        }}
                      >
                        <div style={{
                          width: "2rem", height: "2rem", borderRadius: "0.375rem", flexShrink: 0,
                          background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.25)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8125rem", fontWeight: 700, color: "var(--gold)", fontFamily: "'DM Mono', monospace",
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: t.bodySize, fontWeight: 500, color: "var(--text)", fontFamily: t.fontBody }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: t.secondarySize, color: "var(--text-3)", fontFamily: t.fontBody, marginTop: "0.2rem" }}>
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action — full-width on mobile */}
                  <button
                    onClick={handleXLSX}
                    disabled={xlsxLoading}
                    className="btn btn-gold w-full md:w-auto justify-center"
                    style={{ fontSize: "1rem", padding: "0.9375rem 1.75rem", borderRadius: t.radius, opacity: xlsxLoading ? 0.7 : 1 }}
                  >
                    {xlsxDone
                      ? <><Check size={16} /> Baixado!</>
                      : xlsxLoading
                      ? "Gerando..."
                      : <><FileSpreadsheet size={18} /> Baixar Excel (.xlsx)</>
                    }
                  </button>
                  <p style={{ fontSize: t.hintSize, color: "var(--text-3)", marginTop: "0.625rem", fontFamily: t.fontBody }}>
                    Compatível com Microsoft Excel, Google Sheets e LibreOffice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Print portal */}
      <PrintContainer>
        <SelectedTemplate {...templateProps} />
      </PrintContainer>
    </>
  );
}
