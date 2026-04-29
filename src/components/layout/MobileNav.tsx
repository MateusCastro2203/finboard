import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, ArrowLeftRight, Presentation, PlusCircle, Settings } from "lucide-react";

const navItems = [
  { tab: "dre",        icon: BarChart3,      label: "Resultado" },
  { tab: "margem",     icon: TrendingUp,     label: "Margem" },
  { tab: "fluxo",      icon: ArrowLeftRight, label: "Caixa" },
  { tab: "executivo",  icon: Presentation,   label: "Resumo" },
];

export default function MobileNav({ activeTab, onTabChange }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
    >
      {navItems.map(({ tab, icon: Icon, label }) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            style={{
              color: active ? "var(--gold)" : "var(--text-3)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.04em",
              borderTop: `2px solid ${active ? "var(--gold)" : "transparent"}`,
              background: active ? "var(--gold-dim)" : "transparent",
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
      <button
        onClick={() => navigate("/dados")}
        className="flex-1 flex flex-col items-center gap-1 py-3"
        style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.6rem", letterSpacing: "0.04em", borderTop: "2px solid transparent" }}
      >
        <PlusCircle size={18} />
        Dados
      </button>
      <button
        onClick={() => navigate("/conta")}
        className="flex-1 flex flex-col items-center gap-1 py-3"
        style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.6rem", letterSpacing: "0.04em", borderTop: "2px solid transparent" }}
      >
        <Settings size={18} />
        Conta
      </button>
    </nav>
  );
}
