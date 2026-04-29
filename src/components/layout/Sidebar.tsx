import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, ArrowLeftRight, Presentation, PlusCircle, LogOut, Target, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

const navItems = [
  { tab: "dre",        icon: BarChart3,       label: "Resultado do Mês" },
  { tab: "margem",     icon: TrendingUp,      label: "Análise de Margem" },
  { tab: "fluxo",      icon: ArrowLeftRight,  label: "Fluxo de Caixa" },
  { tab: "orcamento",  icon: Target,          label: "Orçamento vs Real" },
  { tab: "executivo",  icon: Presentation,    label: "Resumo Executivo" },
];

export default function Sidebar({ activeTab, onTabChange, isDemo = false }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDemo?: boolean;
}) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <aside
      className="w-56 flex flex-col"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <span
          className="font-display text-lg tracking-wide"
          style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.06em" }}
        >
          FinBoard
        </span>
        {profile?.full_name && (
          <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-3)" }}>
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ tab, icon: Icon, label }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-left transition-colors"
              style={{
                color: active ? "var(--gold)" : "var(--text-3)",
                background: active ? "var(--gold-dim)" : "transparent",
                borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
                  (e.currentTarget as HTMLElement).style.background = "var(--border-soft)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}

        {!isDemo && (
          <div className="pt-3 mt-3 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--border-soft)" }}>
            {[
              { label: "Inserir dados",  icon: PlusCircle, path: "/dados" },
              { label: "Dados da conta", icon: Settings,   path: "/conta" },
            ].map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
                style={{
                  color: "var(--text-3)",
                  fontFamily: "'Outfit', sans-serif",
                  background: "transparent",
                  borderLeft: "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
                  (e.currentTarget as HTMLElement).style.background = "var(--border-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Sign out — oculto no modo demo */}
      {!isDemo && (
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
              (e.currentTarget as HTMLElement).style.background = "var(--border-soft)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
