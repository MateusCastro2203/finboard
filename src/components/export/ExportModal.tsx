import { useState, useCallback } from "react";
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
  {
    id: "cartao",
    label: "Cartão Executivo",
    desc: "1 página · KPIs grandes + síntese",
    component: TemplateCartaoExecutivo,
  },
  {
    id: "dre",
    label: "DRE Gerencial",
    desc: "1-2 páginas · Tabela completa",
    component: TemplateDREGerencial,
  },
  {
    id: "margens",
    label: "Análise de Margens",
    desc: "1 página · Evolução das margens",
    component: TemplateAnaliseMargens,
  },
  {
    id: "completo",
    label: "Relatório Completo",
    desc: "3 páginas · Capa + DRE + Fluxo",
    component: TemplateRelatorioCompleto,
  },
  {
    id: "fluxo",
    label: "Fluxo de Caixa",
    desc: "1 página · Caixa mensal",
    component: TemplateFluxoCaixa,
  },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const XLSX_SHEETS = [
  { name: "Resumo", desc: "KPIs do último período e YTD" },
  { name: "DRE",    desc: "Todas as 16 linhas × todos os meses + YTD" },
  { name: "Margens", desc: "Margens Bruta, EBITDA e Líquida mensais" },
  { name: "Fluxo de Caixa", desc: "Entradas, Saídas, FCO e Saldo Acumulado" },
];

export default function ExportModal({ open, onClose, dreData, fluxoData, company }: Props) {
  const [tab, setTab] = useState<"pdf" | "xlsx">("pdf");
  const [selected, setSelected] = useState<TemplateId>("cartao");
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [xlsxDone, setXlsxDone] = useState(false);

  const exportData = useExportData(dreData, fluxoData, company);

  const SelectedTemplate = TEMPLATES.find(t => t.id === selected)!.component;

  const templateProps = { dreData, fluxoData, company, exportData };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleXLSX = useCallback(async () => {
    setXlsxLoading(true);
    try {
      await generateXLSX(dreData, fluxoData, company, exportData.monthly);
      setXlsxDone(true);
      setTimeout(() => setXlsxDone(false), 3000);
    } finally {
      setXlsxLoading(false);
    }
  }, [dreData, fluxoData, company, exportData.monthly]);

  if (!open) return null;

  return (
    <>
      {/* Screen modal */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: "100%",
            maxWidth: 920,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            <div>
              <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 400, color: "var(--text)" }}>
                Exportar Relatório
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                {company.name} · {exportData.periodRange}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ color: "var(--text-3)", padding: 6, borderRadius: 4, cursor: "pointer", background: "transparent", border: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {([
              { id: "pdf" as const,  label: "PDF",   icon: <FileText size={14} /> },
              { id: "xlsx" as const, label: "Excel",  icon: <FileSpreadsheet size={14} /> },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: tab === t.id ? 500 : 400,
                  color: tab === t.id ? "var(--gold)" : "var(--text-3)",
                  background: "transparent",
                  border: "none",
                  borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }} className="sm:p-6">
            {tab === "pdf" ? (
              <>
                {/* ── MOBILE: selector horizontal + botão direto ── */}
                <div className="md:hidden">
                  {/* Chips de template com scroll horizontal */}
                  <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                    Modelo
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
                    {TEMPLATES.map((t) => {
                      const isActive = selected === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelected(t.id)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md"
                          style={{
                            fontSize: 12,
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? "var(--gold-dim)" : "var(--bg-card-2)",
                            border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                            color: isActive ? "var(--gold)" : "var(--text-3)",
                            cursor: "pointer",
                          }}
                        >
                          {isActive && <Check size={11} style={{ color: "var(--gold)" }} />}
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Info do modelo selecionado */}
                  <div style={{ padding: "12px 14px", background: "var(--bg-card-2)", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", fontFamily: "'Outfit', sans-serif", marginBottom: 3 }}>
                      {TEMPLATES.find(t => t.id === selected)?.label}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                      {TEMPLATES.find(t => t.id === selected)?.desc}
                    </p>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="btn btn-gold w-full justify-center"
                    style={{ padding: "13px 24px", fontSize: 14 }}
                  >
                    <Download size={16} />
                    Salvar PDF — {TEMPLATES.find(t => t.id === selected)?.label}
                  </button>
                  <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>
                    Use "Salvar como PDF" no menu de impressão do navegador
                  </p>
                </div>

                {/* ── DESKTOP: seletor + preview lado a lado ── */}
                <div className="hidden md:flex" style={{ gap: 24 }}>
                  {/* Left: template picker */}
                  <div style={{ flexShrink: 0, width: 160 }}>
                    <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>
                      Modelo
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {TEMPLATES.map((t) => {
                        const isActive = selected === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelected(t.id)}
                            style={{
                              background: "transparent",
                              border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                              borderRadius: 6,
                              overflow: "hidden",
                              cursor: "pointer",
                              position: "relative",
                              padding: 0,
                              textAlign: "left",
                            }}
                          >
                            <div style={{ width: 158, height: 100, overflow: "hidden", background: "#fff", position: "relative" }}>
                              <div style={{ transform: "scale(0.2)", transformOrigin: "top left", width: A4, height: 500, pointerEvents: "none", userSelect: "none" }}>
                                <t.component {...templateProps} />
                              </div>
                            </div>
                            <div style={{ padding: "7px 10px", borderTop: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`, background: isActive ? "var(--gold-dim)" : "var(--bg-card-2)" }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: isActive ? "var(--gold)" : "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                                {t.label}
                              </div>
                              <div style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", marginTop: 1 }}>
                                {t.desc}
                              </div>
                            </div>
                            {isActive && (
                              <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Check size={10} color="#fff" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: A4 preview */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>
                      Pré-visualização
                    </p>
                    <div style={{ flex: 1, overflow: "auto", background: "var(--bg-surface)", borderRadius: 6, border: "1px solid var(--border)", padding: 16 }}>
                      <div style={{ width: Math.floor(A4 * 0.6), overflow: "hidden", position: "relative", margin: "0 auto" }}>
                        <div style={{ transform: "scale(0.6)", transformOrigin: "top left", width: A4, pointerEvents: "none", userSelect: "none" }}>
                          <SelectedTemplate {...templateProps} />
                        </div>
                      </div>
                    </div>
                    <button onClick={handlePrint} className="btn btn-gold" style={{ marginTop: 14, justifyContent: "center", padding: "12px 24px", fontSize: 14 }}>
                      <Download size={16} />
                      Salvar PDF
                    </button>
                    <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>
                      Use "Salvar como PDF" no menu de impressão do navegador
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* XLSX tab */
              <div style={{ maxWidth: 540 }}>
                <p style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", marginBottom: 20 }}>
                  O arquivo Excel contém <strong style={{ color: "var(--text)" }}>4 abas</strong> com todos os dados formatados e prontos para análise.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {XLSX_SHEETS.map((s, i) => (
                    <div key={s.name} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "14px 16px",
                      background: "var(--bg-card-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        background: "var(--gold-dim)",
                        border: "1px solid rgba(184,129,30,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--gold)",
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleXLSX}
                  disabled={xlsxLoading}
                  className="btn btn-gold"
                  style={{ padding: "12px 28px", fontSize: 14, opacity: xlsxLoading ? 0.7 : 1 }}
                >
                  {xlsxDone
                    ? <><Check size={16} /> Baixado!</>
                    : xlsxLoading
                    ? "Gerando..."
                    : <><FileSpreadsheet size={16} /> Baixar Excel (.xlsx)</>
                  }
                </button>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 10, fontFamily: "'Outfit', sans-serif" }}>
                  Compatível com Microsoft Excel, Google Sheets e LibreOffice.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print portal — always mounted, hidden on screen, shown on print */}
      <PrintContainer>
        <SelectedTemplate {...templateProps} />
      </PrintContainer>
    </>
  );
}
