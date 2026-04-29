import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight } from "lucide-react";
import DREChart from "../components/charts/DREChart";
import MarginChart from "../components/charts/MarginChart";
import CashFlowChart from "../components/charts/CashFlowChart";
import ExecutivePanel from "../components/charts/ExecutivePanel";
import Sidebar from "../components/layout/Sidebar";
import type { DreCalculado, FluxoCaixa } from "../types";

// Dados demo — 12 meses de 2024
function gerarDreDemo(): DreCalculado[] {
  const meses = [
    "2024-01","2024-02","2024-03","2024-04","2024-05","2024-06",
    "2024-07","2024-08","2024-09","2024-10","2024-11","2024-12",
  ];
  const bases = [820000,840000,795000,870000,910000,885000,920000,955000,900000,975000,1010000,1080000];
  return meses.map((periodo, i) => {
    const rb = bases[i];
    const ded = rb * 0.13;
    const rl = rb - ded;
    const cmv = rl * 0.38;
    const lb = rl - cmv;
    const dc = rl * 0.07;
    const da = rl * 0.09;
    const dp = rl * 0.12;
    const od = rl * 0.02;
    const ebitda = lb - dc - da - dp - od;
    const dep = rl * 0.015;
    const ebit = ebitda - dep;
    const rf = -(rl * 0.018);
    const lair = ebit + rf;
    const ir = lair * 0.15;
    const ll = lair - ir;
    return {
      periodo,
      receita_bruta: rb,
      deducoes: ded,
      receita_liquida: rl,
      cmv,
      lucro_bruto: lb,
      despesas_comerciais: dc,
      despesas_administrativas: da,
      despesas_pessoal: dp,
      outras_despesas_op: od,
      ebitda,
      depreciacao: dep,
      ebit,
      resultado_financeiro: rf,
      lair,
      ir_csll: ir,
      lucro_liquido: ll,
      margem_bruta: lb / rl,
      margem_ebitda: ebitda / rl,
      margem_liquida: ll / rl,
    };
  });
}

function gerarFluxoDemo(): FluxoCaixa[] {
  const entries: FluxoCaixa[] = [];
  let id = 1;
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2024, i, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  for (const m of meses) {
    const base = 800000 + Math.random() * 200000;
    entries.push({
      id: String(id++), company_id: "demo", data: `${m}-05`,
      tipo: "entrada", categoria: "operacional_recebimento",
      descricao: "Recebimentos de clientes", valor: Math.round(base * 0.95),
      realizado: true,
    });
    entries.push({
      id: String(id++), company_id: "demo", data: `${m}-10`,
      tipo: "saida", categoria: "operacional_pagamento",
      descricao: "Pagamento fornecedores", valor: Math.round(base * 0.38),
      realizado: true,
    });
    entries.push({
      id: String(id++), company_id: "demo", data: `${m}-15`,
      tipo: "saida", categoria: "operacional_pagamento",
      descricao: "Despesas de pessoal", valor: Math.round(base * 0.28),
      realizado: true,
    });
    entries.push({
      id: String(id++), company_id: "demo", data: `${m}-20`,
      tipo: "saida", categoria: "operacional_pagamento",
      descricao: "Despesas operacionais", valor: Math.round(base * 0.18),
      realizado: true,
    });
  }
  return entries;
}

const DEMO_DRE = gerarDreDemo();
const DEMO_FLUXO = gerarFluxoDemo();
const TABS = ["dre", "margem", "fluxo", "executivo"] as const;
const TAB_LABELS: Record<string, string> = {
  dre: "DRE Gerencial",
  margem: "Análise de Margem",
  fluxo: "Fluxo de Caixa",
  executivo: "Painel Executivo",
};

export default function Demo() {
  const [activeTab, setActiveTab] = useState("dre");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-surface)" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 px-6 py-6 overflow-x-hidden pb-24" style={{ minWidth: 0 }}>
        {/* Banner demo */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 mb-5 rounded-md text-sm"
          style={{
            background: "var(--gold-dim)",
            border: "1px solid rgba(200,145,42,0.18)",
            color: "var(--text-2)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <BarChart3 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
          <span>
            <strong style={{ color: "var(--gold)" }}>Modo demonstração</strong>
            {" "}— dados fictícios de Empresa Demo LTDA · Jan–Dez 2024
          </span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--text)" }}>
            {TAB_LABELS[activeTab]}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Empresa Demo LTDA
          </p>
        </div>

        {activeTab === "dre"       && <DREChart data={DEMO_DRE} />}
        {activeTab === "margem"    && <MarginChart data={DEMO_DRE} />}
        {activeTab === "fluxo"     && <CashFlowChart data={DEMO_FLUXO} />}
        {activeTab === "executivo" && (
          <ExecutivePanel dreData={DEMO_DRE} fluxoData={DEMO_FLUXO} companyName="Empresa Demo LTDA" />
        )}
      </main>

      {/* CTA sticky bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-4"
        style={{
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
            Veja seus próprios números aqui
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            <span style={{ textDecoration: "line-through", opacity: 0.55 }}>R$ 197</span>{" "}
            <strong style={{ color: "var(--gold)" }}>R$ 98,60</strong> · Importação via CSV em 5 min
          </p>
        </div>
        <button
          className="btn btn-gold whitespace-nowrap"
          onClick={() => navigate("/auth")}
          style={{ padding: "10px 20px" }}
        >
          Começar agora
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
