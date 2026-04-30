import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, TrendingUp, Clock, XCircle,
  CheckCircle2, RefreshCw, LogOut, AlertCircle, Search, ShieldOff,
  UserCheck, UserX, MessageCircle, ChevronDown, ChevronUp, Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Purchase {
  status: string;
  amount: number;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  has_access: boolean;
  created_at: string;
  last_sign_in: string | null;
  purchase: Purchase | null;
}

interface Stats {
  total_users: number;
  users_with_access: number;
  conversion_rate: string;
  total_revenue: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  refunded_count: number;
}

interface AdminData {
  stats: Stats;
  revenue_by_month: Record<string, number>;
  users: AdminUser[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: "Aprovado",  color: "var(--green)", bg: "var(--green-dim)" },
    pending:   { label: "Pendente",  color: "var(--gold)",  bg: "rgba(200,145,42,0.12)" },
    rejected:  { label: "Recusado",  color: "var(--red)",   bg: "var(--red-dim)" },
    refunded:  { label: "Reembolso", color: "var(--text-3)", bg: "var(--bg-card-2)" },
  };
  const s = map[status] ?? { label: status, color: "var(--text-3)", bg: "var(--bg-card-2)" };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color: s.color, background: s.bg, fontFamily: "'Outfit', sans-serif" }}
    >
      {s.label}
    </span>
  );
}

function AccessBadge({ has }: { has: boolean }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        color: has ? "var(--green)" : "var(--text-3)",
        background: has ? "var(--green-dim)" : "var(--bg-card-2)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {has ? "Ativo" : "Sem acesso"}
    </span>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="p-5 rounded-md flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="font-mono-data text-2xl" style={{ color: "var(--text)", fontWeight: 400 }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Revenue Chart (simple bar) ───────────────────────────────────────────────

function RevenueChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  if (entries.length === 0) return (
    <p className="text-xs text-center py-8" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
      Nenhuma receita registrada ainda.
    </p>
  );
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="flex items-end gap-3 h-28 px-2">
      {entries.map(([month, val]) => {
        const [, m] = month.split("-");
        const label = months[parseInt(m) - 1];
        const pct = (val / max) * 100;
        return (
          <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              {fmt(val)}
            </span>
            <div className="w-full rounded-t" style={{
              height: `${Math.max(pct, 4)}%`,
              background: "var(--gold)",
              opacity: 0.85,
              minHeight: 4,
            }} />
            <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SAC Tickets ─────────────────────────────────────────────────────────────

interface SacTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  admin_note: string | null;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  erro:       "Erro no sistema",
  duvida:     "Dúvida de uso",
  financeiro: "Questão financeira",
  melhoria:   "Sugestão de melhoria",
  outro:      "Outro",
};

const STATUS_CFG = {
  open:        { label: "Aberto",       color: "var(--gold)",  bg: "rgba(200,145,42,0.12)" },
  in_progress: { label: "Em análise",   color: "var(--blue)",  bg: "var(--blue-dim)" },
  closed:      { label: "Encerrado",    color: "var(--text-3)", bg: "var(--bg-card-2)" },
};

function SacTickets() {
  const [tickets, setTickets] = useState<SacTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter]   = useState<"all" | "open" | "in_progress" | "closed">("all");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [note, setNote]         = useState<Record<string, string>>({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("sac_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(
        error.code === "42P01"
          ? "Tabela sac_tickets não existe. Execute o arquivo supabase/sac_schema.sql no painel do Supabase."
          : error.message
      );
    } else {
      setTickets((data as SacTicket[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function updateStatus(id: string, status: SacTicket["status"]) {
    setUpdating(id);
    await supabase
      .from("sac_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    setUpdating(null);
  }

  async function saveNote(id: string) {
    setUpdating(id + "note");
    await supabase
      .from("sac_tickets")
      .update({ admin_note: note[id] ?? "", updated_at: new Date().toISOString() })
      .eq("id", id);
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, admin_note: note[id] ?? "" } : t));
    setUpdating(null);
  }

  const filtered = tickets.filter((t) => {
    const matchStatus = filter === "all" || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    closed:      tickets.filter(t => t.status === "closed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full animate-spin"
          style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="w-8 h-8" style={{ color: "var(--red)" }} />
        <p className="text-sm" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", maxWidth: 420 }}>
          {fetchError}
        </p>
        <button
          onClick={fetchTickets}
          className="text-xs px-3 py-1.5 rounded"
          style={{
            background: "var(--bg-card-2)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: "open",        label: "Abertos",    color: "var(--gold)" },
          { key: "in_progress", label: "Em análise", color: "var(--blue)" },
          { key: "closed",      label: "Encerrados", color: "var(--text-3)" },
        ] as const).map(({ key, label, color }) => (
          <div key={key} className="p-4 rounded-md" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{label}</p>
            <p className="font-mono-data text-2xl" style={{ color, fontWeight: 400 }}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {([
            { value: "all",        label: `Todos (${tickets.length})` },
            { value: "open",       label: "Abertos" },
            { value: "in_progress",label: "Em análise" },
            { value: "closed",     label: "Encerrados" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="text-xs px-3 py-1.5 rounded"
              style={{
                background: filter === value ? "var(--gold)" : "var(--bg-card-2)",
                color:      filter === value ? "#0a0a0a"     : "var(--text-3)",
                border:    `1px solid ${filter === value ? "var(--gold)" : "var(--border)"}`,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: filter === value ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail..."
            className="text-xs pl-7 pr-3 py-1.5 rounded w-full sm:w-56"
            style={{
              background: "var(--bg-card-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "'Outfit', sans-serif",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-md" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <MessageCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--border)" }} />
          <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Nenhum ticket encontrado.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => {
            const cfg = STATUS_CFG[t.status];
            const isOpen = expanded === t.id;
            return (
              <div
                key={t.id}
                className="rounded-md overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {/* Ticket header — always visible */}
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                        {t.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                        {t.email}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg, fontFamily: "'Outfit', sans-serif" }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ color: "var(--text-3)", background: "var(--bg-card-2)", fontFamily: "'Outfit', sans-serif" }}
                      >
                        {SUBJECT_LABELS[t.subject] ?? t.subject}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                      {t.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div
                    className="px-4 pb-4 flex flex-col gap-4"
                    style={{ borderTop: "1px solid var(--border-soft)" }}
                  >
                    <p
                      className="pt-4 text-sm leading-relaxed"
                      style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", whiteSpace: "pre-wrap" }}
                    >
                      {t.message}
                    </p>

                    {/* Status actions */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-medium self-center" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                        Status:
                      </span>
                      {(["open", "in_progress", "closed"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(t.id, s)}
                          disabled={t.status === s || updating === t.id}
                          className="text-xs px-3 py-1.5 rounded transition-all"
                          style={{
                            background: t.status === s ? STATUS_CFG[s].bg   : "var(--bg-card-2)",
                            color:      t.status === s ? STATUS_CFG[s].color : "var(--text-3)",
                            border:    `1px solid ${t.status === s ? STATUS_CFG[s].color : "var(--border)"}`,
                            fontFamily: "'Outfit', sans-serif",
                            opacity:    updating === t.id ? 0.5 : 1,
                            fontWeight: t.status === s ? 600 : 400,
                          }}
                        >
                          {STATUS_CFG[s].label}
                        </button>
                      ))}
                    </div>

                    {/* Admin note */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                        Nota interna
                      </label>
                      <textarea
                        rows={2}
                        defaultValue={t.admin_note ?? ""}
                        onChange={(e) => setNote((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Adicione uma nota sobre este ticket..."
                        style={{
                          width: "100%",
                          background: "var(--bg-card-2)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          padding: "8px 10px",
                          fontSize: "0.8125rem",
                          color: "var(--text)",
                          fontFamily: "'Outfit', sans-serif",
                          outline: "none",
                          resize: "none",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      />
                      <button
                        onClick={() => saveNote(t.id)}
                        disabled={updating === t.id + "note"}
                        className="text-xs px-3 py-1.5 rounded self-start"
                        style={{
                          background: "var(--bg-card-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text-2)",
                          fontFamily: "'Outfit', sans-serif",
                          opacity: updating === t.id + "note" ? 0.5 : 1,
                        }}
                      >
                        {updating === t.id + "note" ? "Salvando..." : "Salvar nota"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Admin() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<"dashboard" | "tickets">("dashboard");
  const [data, setData] = useState<AdminData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "access" | "no_access" | "pending">("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportResult, setReportResult]   = useState<string | null>(null);

  async function triggerMonthlyReport() {
    setSendingReport(true);
    setReportResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monthly-report`,
        { headers: { "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY } }
      );
      const json = await res.json();
      setReportResult(res.ok ? `✓ Relatório enviado para ${json.sent} usuário(s).` : `Erro: ${json.error}`);
    } catch (e: any) {
      setReportResult(`Erro: ${e.message}`);
    } finally {
      setSendingReport(false);
      setTimeout(() => setReportResult(null), 6000);
    }
  }

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`,
        {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao buscar dados");
      setData(json);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    if (profile === null) return;
    if (!profile.is_admin) { navigate("/dashboard"); return; }
    fetchData();
  }, [user, profile, authLoading, navigate, fetchData]);

  async function handleAction(targetUserId: string, action: "grant_access" | "revoke_access") {
    setActionLoading(targetUserId + action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, target_user_id: targetUserId }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro na ação");
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (authLoading || (user && profile === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }} />
          <span className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Verificando permissões...
          </span>
        </div>
      </div>
    );
  }

  if (profile && !profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center" style={{ maxWidth: 380 }}>
          <ShieldOff className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--red)" }} />
          <h2 className="font-display text-xl mb-2" style={{ color: "var(--text)", fontWeight: 400 }}>Acesso negado</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Seu usuário não tem permissão de administrador.
          </p>
          <button onClick={() => navigate("/dashboard")} className="btn btn-gold mx-auto">
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }} />
          <span className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Carregando painel admin...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center" style={{ maxWidth: 400 }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--red)" }} />
          <p className="text-sm mb-4" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>{error}</p>
          <button onClick={fetchData} className="btn btn-gold mx-auto">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, revenue_by_month, users } = data;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.company_name.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ? true :
      filter === "access" ? u.has_access :
      filter === "no_access" ? !u.has_access && u.purchase?.status !== "pending" :
      filter === "pending" ? u.purchase?.status === "pending" : true;

    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 flex-wrap"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-xl" style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.06em" }}>
            FinBoard
          </span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(200,145,42,0.15)", color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}>
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Atualizado às {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{ color: "var(--text-2)", background: "var(--bg-card-2)", border: "1px solid var(--border)", fontFamily: "'Outfit', sans-serif" }}
          >
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex border-b px-4 sm:px-6"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        {([
          { value: "dashboard", label: "Dashboard", icon: Users },
          { value: "tickets",   label: "Chamados SAC", icon: MessageCircle },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setAdminTab(value)}
            className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight:  adminTab === value ? 600 : 400,
              color:       adminTab === value ? "var(--gold)" : "var(--text-3)",
              borderBottom: adminTab === value ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {adminTab === "tickets" && <SacTickets />}

        {adminTab === "dashboard" && <>

        {/* Monthly report trigger */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={triggerMonthlyReport}
            disabled={sendingReport}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              fontFamily: "'Outfit', sans-serif",
              opacity: sendingReport ? 0.6 : 1,
            }}
          >
            <Mail className="w-4 h-4" style={{ color: "var(--gold)" }} />
            {sendingReport ? "Enviando..." : "Disparar relatório mensal agora"}
          </button>
          {reportResult && (
            <span
              className="text-xs px-3 py-1.5 rounded"
              style={{
                background: reportResult.startsWith("✓") ? "var(--green-dim)" : "var(--red-dim)",
                color: reportResult.startsWith("✓") ? "var(--green)" : "var(--red)",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {reportResult}
            </span>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label="Usuários cadastrados"
            value={String(stats.total_users)}
            sub={`${stats.users_with_access} com acesso ativo`}
            color="var(--gold)"
          />
          <KpiCard
            icon={DollarSign}
            label="Receita total"
            value={fmt(stats.total_revenue)}
            sub={`${stats.approved_count} compras aprovadas`}
            color="var(--green)"
          />
          <KpiCard
            icon={TrendingUp}
            label="Taxa de conversão"
            value={`${stats.conversion_rate}%`}
            sub="cadastro → pagamento"
            color="#818cf8"
          />
          <KpiCard
            icon={Clock}
            label="Pendentes / Recusados"
            value={`${stats.pending_count} / ${stats.rejected_count}`}
            sub={stats.refunded_count > 0 ? `${stats.refunded_count} reembolsado(s)` : "Nenhum reembolso"}
            color="var(--red)"
          />
        </div>

        {/* Revenue chart */}
        <div
          className="p-5 rounded-md"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
            Receita por mês
          </h2>
          <RevenueChart data={revenue_by_month} />
        </div>

        {/* Users table */}
        <div
          className="rounded-md overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Table header */}
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-medium flex-1" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
              Usuários ({filteredUsers.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter tabs */}
              {(["all", "access", "no_access", "pending"] as const).map((f) => {
                const labels = { all: "Todos", access: "Com acesso", no_access: "Sem acesso", pending: "Pendentes" };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="text-xs px-3 py-1.5 rounded"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      background: filter === f ? "var(--gold)" : "var(--bg-card-2)",
                      color: filter === f ? "#0a0a0a" : "var(--text-3)",
                      border: `1px solid ${filter === f ? "var(--gold)" : "var(--border)"}`,
                      fontWeight: filter === f ? 600 : 400,
                    }}
                  >
                    {labels[f]}
                  </button>
                );
              })}
              {/* Search */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="text-xs pl-7 pr-3 py-1.5 rounded"
                  style={{
                    background: "var(--bg-card-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontFamily: "'Outfit', sans-serif",
                    outline: "none",
                    width: "100%",
                    minWidth: 120,
                    maxWidth: 200,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
                  {["Usuário", "Acesso", "Pagamento", "Valor", "ID MP", "Cadastro", "Último login", "Ações"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-3)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10" style={{ color: "var(--text-3)" }}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border-soft)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "var(--text)" }}>
                        {u.full_name || <span style={{ color: "var(--text-3)" }}>—</span>}
                      </p>
                      <p style={{ color: "var(--text-3)" }}>{u.email}</p>
                      {u.company_name && (
                        <p style={{ color: "var(--text-3)", fontSize: "0.7rem" }}>{u.company_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AccessBadge has={u.has_access} />
                    </td>
                    <td className="px-4 py-3">
                      {u.purchase
                        ? <StatusBadge status={u.purchase.status} />
                        : <span style={{ color: "var(--text-3)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono-data" style={{ color: "var(--text-2)" }}>
                      {u.purchase ? fmt(u.purchase.amount) : <span style={{ color: "var(--text-3)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.purchase?.mp_payment_id
                        ? (
                          <span
                            className="font-mono"
                            style={{ color: "var(--text-3)", fontSize: "0.7rem" }}
                            title={u.purchase.mp_payment_id}
                          >
                            {u.purchase.mp_payment_id.slice(0, 12)}...
                          </span>
                        )
                        : <span style={{ color: "var(--text-3)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>
                      {u.last_sign_in ? fmtDate(u.last_sign_in) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {!u.has_access ? (
                          <button
                            onClick={() => handleAction(u.id, "grant_access")}
                            disabled={actionLoading === u.id + "grant_access"}
                            title="Liberar acesso"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                            style={{
                              background: "var(--green-dim)",
                              color: "var(--green)",
                              border: "1px solid rgba(61,184,112,0.25)",
                              fontFamily: "'Outfit', sans-serif",
                              opacity: actionLoading === u.id + "grant_access" ? 0.5 : 1,
                            }}
                          >
                            <UserCheck className="w-3 h-3" />
                            {actionLoading === u.id + "grant_access" ? "..." : "Liberar"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(u.id, "revoke_access")}
                            disabled={actionLoading === u.id + "revoke_access"}
                            title="Revogar acesso"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                            style={{
                              background: "var(--red-dim)",
                              color: "var(--red)",
                              border: "1px solid rgba(212,88,80,0.25)",
                              fontFamily: "'Outfit', sans-serif",
                              opacity: actionLoading === u.id + "revoke_access" ? 0.5 : 1,
                            }}
                          >
                            <UserX className="w-3 h-3" />
                            {actionLoading === u.id + "revoke_access" ? "..." : "Revogar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle2, label: "Aprovados", count: stats.approved_count, color: "var(--green)" },
            { icon: Clock,        label: "Pendentes",  count: stats.pending_count,  color: "var(--gold)" },
            { icon: XCircle,      label: "Recusados",  count: stats.rejected_count, color: "var(--red)" },
            { icon: RefreshCw,    label: "Reembolsos", count: stats.refunded_count, color: "var(--text-3)" },
          ].map(({ icon: Icon, label, count, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-md"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
              <div>
                <p className="font-mono-data text-xl" style={{ color: "var(--text)" }}>{count}</p>
                <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        </>}

      </div>
    </div>
  );
}
