import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const SUBJECTS = [
  { value: "erro",       label: "Erro no sistema" },
  { value: "duvida",     label: "Dúvida de uso" },
  { value: "financeiro", label: "Questão financeira / pagamento" },
  { value: "acesso",     label: "Problema de acesso / login" },
  { value: "melhoria",   label: "Sugestão de melhoria" },
  { value: "outro",      label: "Outro" },
] as const;

const inputCls: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: "0.8125rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

const HIDDEN_PATHS = ["/suporte", "/admin"];

export default function FloatingSupport() {
  const location = useLocation();
  const { user, profile } = useAuth();

  const [open,    setOpen]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState<typeof SUBJECTS[number]["value"]>("acesso");
  const [message, setMessage] = useState("");

  // Pre-fill when user is available or widget opens
  useEffect(() => {
    if (open) {
      setName(profile?.full_name ?? name);
      setEmail(user?.email ?? email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, profile]);

  // Reset form when closing
  function handleClose() {
    setOpen(false);
    if (done) {
      setTimeout(() => {
        setDone(false);
        setMessage("");
        setError(null);
      }, 400);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Preencha nome, e-mail e mensagem.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { data: ticket, error: insErr } = await supabase
        .from("sac_tickets")
        .insert({
          user_id: user?.id ?? null,
          name:    name.trim(),
          email:   email.trim().toLowerCase(),
          subject,
          message: message.trim(),
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      // Fire email notification — non-blocking
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-ticket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket_id: ticket.id }),
        }
      ).catch(() => {});

      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--gold)";
  };
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
  };

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <>
      {/* Modal */}
      <div
        className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 flex flex-col"
        style={{
          width: "min(340px, calc(100vw - 2rem))",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.22,1,0.36,1)",
          transformOrigin: "bottom right",
        }}
      >
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.12)",
            maxHeight: "min(540px, 80vh)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
            style={{ background: "var(--bg-card-2)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.3)" }}
              >
                <MessageCircle className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
                  Suporte FinBoard
                </p>
                <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Resposta em até 48h úteis
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--text-3)" }}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {done ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--green-dim)", border: "1px solid rgba(30,122,68,0.25)" }}
                >
                  <CheckCircle2 className="w-6 h-6" style={{ color: "var(--green)" }} />
                </div>
                <p className="font-medium text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                  Mensagem enviada!
                </p>
                <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Vamos responder no e-mail{" "}
                  <strong style={{ color: "var(--text-2)" }}>{email}</strong>
                </p>
                <button
                  onClick={handleClose}
                  className="text-xs mt-2 px-4 py-2 rounded"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                    background: "var(--bg-card-2)",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>Nome *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      style={inputCls}
                      onFocus={focus}
                      onBlur={blur}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>E-mail *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      style={{ ...inputCls, ...(user ? { opacity: 0.65, cursor: "not-allowed" } : {}) }}
                      onFocus={focus}
                      onBlur={blur}
                      readOnly={!!user}
                      required
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>Assunto</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as typeof subject)}
                    style={{ ...inputCls, appearance: "none", cursor: "pointer" }}
                    onFocus={focus}
                    onBlur={blur}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value} style={{ background: "var(--bg-card)" }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>Mensagem *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva o problema ou dúvida com detalhes..."
                    rows={4}
                    style={{ ...inputCls, resize: "none", lineHeight: 1.5 }}
                    onFocus={focus}
                    onBlur={blur}
                    required
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded" style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-gold w-full justify-center"
                  style={{ opacity: sending ? 0.6 : 1, fontSize: "0.8125rem" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? "Enviando..." : "Enviar mensagem"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center justify-center rounded-full transition-all"
        style={{
          width: 52,
          height: 52,
          background: open ? "var(--bg-card-2)" : "var(--gold)",
          border: open ? "1px solid var(--border)" : "none",
          boxShadow: open
            ? "0 4px 16px rgba(0,0,0,0.12)"
            : "0 4px 20px rgba(184,129,30,0.45), 0 2px 8px rgba(0,0,0,0.15)",
          transform: open ? "rotate(0deg)" : "rotate(0deg)",
          transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
          // On mobile, float above the MobileNav (64px) with 8px gap
          marginBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Suporte"
      >
        <div style={{ transition: "transform 0.2s, opacity 0.15s" }}>
          {open
            ? <X className="w-5 h-5" style={{ color: "var(--text-2)" }} />
            : <MessageCircle className="w-5 h-5" style={{ color: "#fff" }} />
          }
        </div>
      </button>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={handleClose}
        />
      )}
    </>
  );
}
