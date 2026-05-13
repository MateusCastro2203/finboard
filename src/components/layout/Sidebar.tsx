import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, ArrowLeftRight, Presentation, LogOut, Target, Settings, HelpCircle, CalendarRange, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const ANALISES = [
  { tab: "dre",       icon: BarChart3,      label: "Resultado do Mês" },
  { tab: "fluxo",     icon: ArrowLeftRight, label: "Fluxo de Caixa"  },
  { tab: "margem",    icon: TrendingUp,     label: "Análise de Margem" },
  { tab: "orcamento", icon: Target,         label: "Orçamento vs Real" },
];

const VISOES = [
  { tab: "executivo", icon: Presentation, label: "Resumo Executivo"  },
  { tab: "anual",     icon: CalendarRange, label: "Comparativo Anual" },
];

function NavBtn({ tab, icon: Icon, label, active, onClick, disabled = false }: {
  tab: string; icon: any; label: string; active: boolean;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      key={tab}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Disponível quando você tiver dados de 2 anos" : undefined}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-left transition-colors"
      style={{
        color:      disabled ? "var(--border)" : active ? "var(--gold)" : "var(--text-3)",
        background: active ? "var(--gold-dim)" : "transparent",
        borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: active ? 500 : 400,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
          (e.currentTarget as HTMLElement).style.background = "var(--border-soft)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ opacity: disabled ? 0.3 : 1 }} />
      <span style={{ opacity: disabled ? 0.4 : 1 }}>{label}</span>
      {disabled && (
        <span className="ml-auto text-xs" style={{ color: "var(--border)", fontSize: "0.65rem" }}>2+ anos</span>
      )}
    </button>
  );
}

export default function Sidebar({ activeTab, onTabChange, isDemo = false, onOpenSupport, hasMultipleYears = false }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDemo?: boolean;
  onOpenSupport?: () => void;
  hasMultipleYears?: boolean;
}) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  function sectionLabel(text: string) {
    return (
      <p
        className="px-3 pt-3 pb-1 text-xs uppercase tracking-widest"
        style={{ color: "var(--border)", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.1em", fontSize: "0.65rem" }}
      >
        {text}
      </p>
    );
  }

  return (
    <aside
      className="w-56 flex flex-col"
      style={{ minHeight: "100vh", background: "var(--bg)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <span className="font-display text-lg tracking-wide" style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.06em" }}>
          FinBoard
        </span>
        {profile?.full_name && (
          <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-3)" }}>
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col">
        {sectionLabel("Análises")}
        <div className="flex flex-col gap-0.5">
          {ANALISES.map(({ tab, icon, label }) => (
            <NavBtn
              key={tab} tab={tab} icon={icon} label={label}
              active={activeTab === tab}
              onClick={() => onTabChange(tab)}
            />
          ))}
        </div>

        <div className="mt-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          {sectionLabel("Visões")}
          <div className="flex flex-col gap-0.5">
            {VISOES.map(({ tab, icon, label }) => (
              <NavBtn
                key={tab} tab={tab} icon={icon} label={label}
                active={activeTab === tab}
                onClick={() => !(!hasMultipleYears && tab === "anual") && onTabChange(tab)}
                disabled={tab === "anual" && !hasMultipleYears}
              />
            ))}
          </div>
        </div>

        {!isDemo && (
          <div className="mt-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
            {sectionLabel("Operacional")}
            <NavBtn
              tab="caixa" icon={Wallet} label="Caixa Diário"
              active={activeTab === "caixa"}
              onClick={() => navigate("/caixa")}
            />
          </div>
        )}

        {!isDemo && (
          <div className="pt-3 mt-3 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--border-soft)" }}>
            {[
              { label: "Dados da conta", icon: Settings,    action: () => navigate("/conta") },
              { label: "Suporte",        icon: HelpCircle,  action: onOpenSupport ?? (() => navigate("/suporte")) },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
                style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", background: "transparent", borderLeft: "2px solid transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--border-soft)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Sign out */}
      {!isDemo && (
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--border-soft)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
