import { useNavigate } from "react-router-dom";
import { FileUp, PenLine, ArrowRight, Download } from "lucide-react";

function GhostCharts() {
  return (
    <svg
      viewBox="0 0 480 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 480, opacity: 0.18 }}
      aria-hidden
    >
      {/* Bar chart left */}
      <rect x="16"  y="100" width="22" height="44" rx="3" fill="#C8912A"/>
      <rect x="46"  y="72"  width="22" height="72" rx="3" fill="#C8912A"/>
      <rect x="76"  y="48"  width="22" height="96" rx="3" fill="#C8912A"/>
      <rect x="106" y="60"  width="22" height="84" rx="3" fill="#C8912A"/>
      <rect x="136" y="32"  width="22" height="112" rx="3" fill="#C8912A"/>
      <rect x="166" y="52"  width="22" height="92" rx="3" fill="#C8912A"/>

      {/* Divider */}
      <line x1="220" y1="16" x2="220" y2="144" stroke="#C8912A" strokeWidth="1" strokeDasharray="4 4"/>

      {/* Line chart right */}
      <polyline
        points="240,120 270,88 300,100 330,60 360,72 390,44 420,56 450,32"
        stroke="#C8912A"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="240" cy="120" r="4" fill="#C8912A"/>
      <circle cx="300" cy="100" r="4" fill="#C8912A"/>
      <circle cx="360" cy="72"  r="4" fill="#C8912A"/>
      <circle cx="420" cy="56"  r="4" fill="#C8912A"/>
      <circle cx="450" cy="32"  r="5" fill="#C8912A"/>

      {/* Baseline */}
      <line x1="16" y1="144" x2="464" y2="144" stroke="#C8912A" strokeWidth="1" opacity="0.4"/>
    </svg>
  );
}

export default function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">

      {/* Ghost chart illustration */}
      <div className="w-full max-w-lg mb-8">
        <GhostCharts />
      </div>

      {/* Headline */}
      <h2
        className="font-display text-2xl sm:text-3xl text-center mb-3"
        style={{ color: "var(--text)", fontWeight: 400, maxWidth: 480 }}
      >
        Seus relatórios estão prontos para receber dados
      </h2>
      <p
        className="text-sm text-center mb-8 max-w-sm"
        style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}
      >
        Importe o DRE do seu contador ou preencha manualmente. Os gráficos aparecem na hora.
      </p>

      {/* Two option cards */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">

        {/* Option A — CSV (recommended) */}
        <button
          onClick={() => navigate("/dados")}
          className="text-left p-5 rounded-md transition-colors group"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--gold)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--gold-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.25)" }}
            >
              <FileUp className="w-4 h-4" style={{ color: "var(--gold)" }} />
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(200,145,42,0.12)",
                color: "var(--gold)",
                fontFamily: "'Outfit', sans-serif",
                border: "1px solid rgba(200,145,42,0.2)",
              }}
            >
              Recomendado
            </span>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
            Importar via CSV
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
            Peça o DRE ao seu contador, importe a planilha e veja tudo pronto em segundos.
          </p>
          <div className="flex items-center gap-1 mt-3" style={{ color: "var(--gold)" }}>
            <span className="text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>Ir para importação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Option B — Manual */}
        <button
          onClick={() => navigate("/dados")}
          className="text-left p-5 rounded-md transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--text-3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          <div className="mb-3">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: "var(--bg-card-2)", border: "1px solid var(--border)" }}
            >
              <PenLine className="w-4 h-4" style={{ color: "var(--text-2)" }} />
            </div>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
            Preencher manualmente
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
            Insira os valores de receita, custos e despesas mês a mês direto no painel.
          </p>
          <div className="flex items-center gap-1 mt-3" style={{ color: "var(--text-3)" }}>
            <span className="text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>Preencher agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Template download hint */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-md"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxWidth: 448,
          width: "100%",
        }}
      >
        <Download className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--text-2)" }}>Dica:</strong> Em{" "}
          <button
            onClick={() => navigate("/dados")}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-2)" }}
          >
            Inserir dados → CSV
          </button>{" "}
          você baixa o template para enviar ao seu contador.
        </p>
      </div>
    </div>
  );
}
