import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFinancialData } from "../hooks/useFinancialData";
import { useMetas } from "../hooks/useMetas";
import { useAnotacoes } from "../hooks/useAnotacoes";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import DREChart from "../components/charts/DREChart";
import MarginChart from "../components/charts/MarginChart";
import CashFlowChart from "../components/charts/CashFlowChart";
import ExecutivePanel from "../components/charts/ExecutivePanel";
import BudgetChart from "../components/charts/BudgetChart";
import OnboardingWizard from "../components/OnboardingWizard";
import AlertsBanner from "../components/AlertsBanner";
import AnotacaoCard from "../components/AnotacaoCard";
import { PlusCircle, AlertTriangle, RefreshCw, Download } from "lucide-react";
import ExportModal from "../components/export/ExportModal";

const tabTitles: Record<string, string> = {
  dre:       "Resultado do Mês",
  margem:    "Análise de Margem",
  fluxo:     "Fluxo de Caixa",
  orcamento: "Orçamento vs Realizado",
  executivo: "Resumo Executivo",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { company, dreData, fluxoData, loading, error, reload } = useFinancialData(user?.id);
  const { metas, saveMeta } = useMetas(company?.id);
  const { getAnotacao, salvar } = useAnotacoes(company?.id);
  const [activeTab, setActiveTab] = useState("dre");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const navigate = useNavigate();

  const lastPeriodo = dreData[dreData.length - 1]?.periodo ?? "";

  // Show onboarding only while there's no company; close it once company is loaded
  useEffect(() => {
    if (!loading) {
      setShowOnboarding(!company);
    }
  }, [loading, company]);

  async function handleCreateCompany(name: string) {
    if (!user) return;
    const { error: insertErr } = await supabase
      .from("companies")
      .insert({ user_id: user.id, name });
    if (insertErr) throw insertErr;
    await reload();
    setShowOnboarding(false);
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm px-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--red)" }} />
          <p className="text-sm mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
            Não foi possível carregar os dados
          </p>
          <p className="text-xs mb-5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            {error}
          </p>
          <button onClick={() => reload()} className="btn btn-outline-gold text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div
            className="w-9 h-9 rounded-full animate-spin mx-auto mb-4"
            style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-surface)" }}>
      {/* Sidebar — oculta em mobile */}
      <div className="no-print hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 px-4 md:px-6 py-6 overflow-x-hidden pb-20 md:pb-6" style={{ minWidth: 0 }}>
        {/* Alertas automáticos */}
        {dreData.length >= 2 && <AlertsBanner data={dreData} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--text)" }}>
              {tabTitles[activeTab]}
            </h1>
            {company && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                {company.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 no-print">
            {dreData.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="btn btn-outline-gold text-xs"
                style={{ padding: "8px 14px" }}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
            <button
              onClick={() => navigate("/dados")}
              className="btn btn-outline-gold text-xs"
              style={{ padding: "8px 16px" }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{dreData.length > 0 ? "Atualizar dados" : "Inserir dados"}</span>
              <span className="sm:hidden">Dados</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {dreData.length > 0 ? (
          <>
            {activeTab === "dre" && (
              <>
                <DREChart data={dreData} />
                {lastPeriodo && (
                  <div className="mt-4">
                    <AnotacaoCard periodo={lastPeriodo} nota={getAnotacao(lastPeriodo)} onSave={(t) => salvar(lastPeriodo, t)} />
                  </div>
                )}
              </>
            )}
            {activeTab === "margem" && (
              <>
                <MarginChart data={dreData} />
                {lastPeriodo && (
                  <div className="mt-4">
                    <AnotacaoCard periodo={lastPeriodo} nota={getAnotacao(lastPeriodo)} onSave={(t) => salvar(lastPeriodo, t)} />
                  </div>
                )}
              </>
            )}
            {activeTab === "fluxo" && (
              <>
                <CashFlowChart data={fluxoData} />
                {lastPeriodo && (
                  <div className="mt-4">
                    <AnotacaoCard periodo={lastPeriodo} nota={getAnotacao(lastPeriodo)} onSave={(t) => salvar(lastPeriodo, t)} />
                  </div>
                )}
              </>
            )}
            {activeTab === "orcamento" && (
              <>
                <BudgetChart dreData={dreData} metas={metas} onSaveMeta={saveMeta} />
                {lastPeriodo && (
                  <div className="mt-4">
                    <AnotacaoCard periodo={lastPeriodo} nota={getAnotacao(lastPeriodo)} onSave={(t) => salvar(lastPeriodo, t)} />
                  </div>
                )}
              </>
            )}
            {activeTab === "executivo" && (
              <ExecutivePanel
                dreData={dreData}
                fluxoData={fluxoData}
                companyName={company?.name ?? ""}
                cnpj={company?.cnpj}
                segmento={company?.segmento}
              />
            )}
          </>
        ) : (
          /* Empty state — company exists but no data yet */
          <div
            className="flex flex-col items-center justify-center py-12 sm:py-24 text-center rounded-md"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <PlusCircle className="w-9 h-9 mb-4" style={{ color: "var(--border)" }} />
            <h3 className="font-display text-xl mb-2" style={{ color: "var(--text)", fontWeight: 400 }}>
              Nenhum dado ainda
            </h3>
            <p className="text-sm mb-2 max-w-xs" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
              Importe a planilha do seu contador ou preencha os valores manualmente.
            </p>
            <p className="text-xs mb-6 max-w-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Leva menos de 5 minutos e seus gráficos aparecem na hora.
            </p>
            <button onClick={() => navigate("/dados")} className="btn btn-gold">
              Inserir dados agora
            </button>
          </div>
        )}
      </main>

      {/* Mobile nav */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Export modal */}
      {showExport && company && (
        <ExportModal
          open={showExport}
          onClose={() => setShowExport(false)}
          dreData={dreData}
          fluxoData={fluxoData}
          company={company}
        />
      )}

      {/* Onboarding — shown when user has no company */}
      {showOnboarding && (
        <OnboardingWizard
          onCreateCompany={handleCreateCompany}
          onImport={() => { setShowOnboarding(false); navigate("/dados"); }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
