import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, CheckCircle2, HelpCircle, AlertCircle, Wrench, FileQuestion, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const SUBJECTS = [
  { value: "erro",        label: "Erro no sistema",   icon: AlertCircle  },
  { value: "duvida",      label: "Dúvida de uso",     icon: HelpCircle   },
  { value: "financeiro",  label: "Financeiro",         icon: FileQuestion },
  { value: "melhoria",    label: "Sugestão",           icon: Wrench       },
  { value: "outro",       label: "Outro",              icon: FileQuestion },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
        {label}
      </span>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "var(--bg-card-2)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "9px 12px",
          opacity: 0.7,
          cursor: "not-allowed",
        }}
      >
        <span
          className="flex-1 truncate text-sm"
          style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
        >
          {value}
        </span>
        <Lock size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function SupportModal({ open, onClose }: Props) {
  const { user, profile } = useAuth();

  const name  = profile?.full_name?.trim() || user?.email || "";
  const email = user?.email ?? "";

  const [subject, setSubject] = useState<typeof SUBJECTS[number]["value"]>("duvida");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* Reset form when reopened */
  useEffect(() => {
    if (open) {
      setSubject("duvida");
      setMessage("");
      setDone(false);
      setError(null);
    }
  }, [open]);

  /* Lock body scroll */
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Descreva sua mensagem antes de enviar.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const ticketId = crypto.randomUUID();
      const { error: insErr } = await supabase
        .from("sac_tickets")
        .insert({
          id:      ticketId,
          user_id: user?.id ?? null,
          name:    name.trim(),
          email:   email.trim().toLowerCase(),
          subject,
          message: message.trim(),
        });
      if (insErr) throw insErr;

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ ticket_id: ticketId }),
        }
      ).catch(() => {});

      setDone(true);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Não foi possível enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }, [user, name, email, subject, message]);

  if (!open) return null;

  return createPortal(
    <div
      className="no-print flex items-end md:items-center justify-center md:p-6"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-t-2xl md:rounded-2xl md:max-w-lg"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxHeight: "min(90dvh, 90vh)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex md:hidden justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: "2.5rem", height: "0.25rem", borderRadius: "99px", background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: "1rem 1.25rem 0.875rem", borderBottom: "1px solid var(--border)" }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              className="font-display truncate"
              style={{ fontSize: "clamp(1.2rem, 5vw, 1.375rem)", fontWeight: 400, color: "var(--text)", lineHeight: 1.25 }}
            >
              Central de Atendimento
            </h2>
            <p
              className="truncate"
              style={{ fontSize: "0.8125rem", color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", marginTop: "0.2rem" }}
            >
              Relate um erro, tire dúvidas ou envie uma sugestão
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.75rem", height: "2.75rem",
              borderRadius: "0.375rem", cursor: "pointer",
              background: "transparent", border: "none",
              color: "var(--text-3)", flexShrink: 0, marginLeft: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            padding: "1.25rem",
            paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {done ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--green-dim)", border: "1px solid rgba(30,122,68,0.25)" }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: "var(--green)" }} />
              </div>
              <div>
                <h3 className="font-display text-xl mb-1" style={{ color: "var(--text)", fontWeight: 400 }}>
                  Mensagem enviada
                </h3>
                <p className="text-sm mb-1" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                  Responderemos em breve em:
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}>
                  {email}
                </p>
              </div>
              <button onClick={onClose} className="btn btn-outline-gold mt-2">
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Locked identity fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LockedField label="Nome" value={name || "—"} />
                <LockedField label="E-mail" value={email || "—"} />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                  Assunto *
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUBJECTS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSubject(value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded text-sm text-left transition-all"
                      style={{
                        background:  subject === value ? "var(--gold-dim)"  : "var(--bg-card-2)",
                        border:      `1px solid ${subject === value ? "var(--gold)" : "var(--border)"}`,
                        color:       subject === value ? "var(--gold)"       : "var(--text-2)",
                        fontFamily:  "'Outfit', sans-serif",
                        fontWeight:  subject === value ? 500 : 400,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                  Mensagem *
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva sua dúvida, erro ou sugestão com o máximo de detalhes..."
                  rows={4}
                  style={{
                    width: "100%",
                    background: "var(--bg-card-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "9px 12px",
                    fontSize: "0.875rem",
                    color: "var(--text)",
                    fontFamily: "'Outfit', sans-serif",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.6,
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  required
                />
                <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Para erros, informe o que estava fazendo quando ocorreu.
                </p>
              </div>

              {/* Error */}
              {error && (
                <p
                  className="text-xs px-4 py-3 rounded"
                  style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="btn btn-gold w-full justify-center"
                style={{ fontSize: "0.9375rem", padding: "0.875rem 1.25rem", opacity: sending ? 0.6 : 1 }}
              >
                <Send className="w-4 h-4" />
                {sending ? "Enviando..." : "Enviar mensagem"}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Respondemos em até 48h úteis · Suporte em português
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
