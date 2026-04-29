import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Company } from "../types";
import { ArrowLeft, Save, Building2, User, CheckCircle2, AlertCircle } from "lucide-react";

const inputCls: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "9px 12px",
  fontSize: "0.875rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelCls: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  marginBottom: 6,
  color: "var(--text-2)",
  fontFamily: "'Outfit', sans-serif",
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputCls, ...(props.disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
      onFocus={(e) => { if (!props.disabled) e.currentTarget.style.borderColor = "var(--gold)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    />
  );
}

function formatCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-6 rounded-md"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4" style={{ color: "var(--gold)" }} />
        <h2 className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function Conta() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Company fields
  const [companyName, setCompanyName]       = useState("");
  const [cnpj, setCnpj]                     = useState("");
  const [segmento, setSegmento]             = useState("");
  const [moeda, setMoeda]                   = useState("BRL");

  // Profile fields
  const [fullName, setFullName]             = useState("");

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        const co = data?.[0] ?? null;
        setCompany(co);
        if (co) {
          setCompanyName(co.name ?? "");
          setCnpj(co.cnpj ?? "");
          setSegmento(co.segmento ?? "");
          setMoeda(co.moeda ?? "BRL");
        }
        setLoadingCompany(false);
      });
  }, [user]);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Save profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // Save company
      if (company) {
        const { error: coErr } = await supabase
          .from("companies")
          .update({
            name: companyName.trim(),
            cnpj: cnpj.replace(/\D/g, "") || null,
            segmento: segmento.trim() || null,
            moeda,
          })
          .eq("id", company.id);
        if (coErr) throw coErr;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl" style={{ color: "var(--text)", fontWeight: 400 }}>
              Dados da conta
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Informações usadas nos relatórios e no painel
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">

          {/* Company section */}
          {!loadingCompany && company && (
            <SectionCard icon={Building2} title="Dados da empresa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label style={labelCls}>Nome da empresa *</label>
                  <StyledInput
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div>
                  <label style={labelCls}>CNPJ</label>
                  <StyledInput
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label style={labelCls}>Segmento</label>
                  <StyledInput
                    type="text"
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    placeholder="Ex: Distribuição, Varejo, Serviços"
                  />
                </div>

                <div>
                  <label style={labelCls}>Moeda</label>
                  <select
                    value={moeda}
                    onChange={(e) => setMoeda(e.target.value)}
                    style={{ ...inputCls }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <option value="BRL">R$ — Real Brasileiro</option>
                    <option value="USD">$ — Dólar Americano</option>
                    <option value="EUR">€ — Euro</option>
                  </select>
                </div>

                <div>
                  <label style={labelCls}>Usando desde</label>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", padding: "9px 0" }}
                  >
                    {formatDate(company.created_at)}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* User section */}
          <SectionCard icon={User} title="Sua conta">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelCls}>Nome</label>
                <StyledInput
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label style={labelCls}>E-mail</label>
                <StyledInput
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  placeholder="—"
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Não é possível alterar o e-mail aqui.
                </p>
              </div>

              <div>
                <label style={labelCls}>Conta criada em</label>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", padding: "9px 0" }}
                >
                  {profile?.created_at ? formatDate(profile.created_at) : "—"}
                </p>
              </div>

              <div>
                <label style={labelCls}>Plano</label>
                <div className="flex items-center gap-2 py-2">
                  {profile?.has_access ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" style={{ color: "var(--green)" }} />
                      <span className="text-sm" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                        Acesso vitalício ativo
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                      <span className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                        Sem acesso ativo
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Feedback */}
          {error && (
            <p
              className="text-xs px-4 py-3 rounded"
              style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}
            >
              {error}
            </p>
          )}
          {saved && (
            <p
              className="text-xs px-4 py-3 rounded"
              style={{ color: "var(--green)", background: "var(--green-dim)", fontFamily: "'Outfit', sans-serif" }}
            >
              ✓ Dados salvos com sucesso.
            </p>
          )}

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-gold"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
            <button onClick={() => navigate("/dashboard")} className="btn btn-ghost">
              Voltar ao painel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
