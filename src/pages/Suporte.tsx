import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, HelpCircle, AlertCircle, Wrench, FileQuestion } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const SUBJECTS = [
  { value: "erro",      label: "Erro no sistema",          icon: AlertCircle },
  { value: "duvida",    label: "Dúvida de uso",            icon: HelpCircle },
  { value: "financeiro",label: "Questão financeira",       icon: FileQuestion },
  { value: "melhoria",  label: "Sugestão de melhoria",     icon: Wrench },
  { value: "outro",     label: "Outro",                    icon: FileQuestion },
] as const;

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

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>{hint}</p>
      )}
    </div>
  );
}

export default function Suporte() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [name,    setName]    = useState(profile?.full_name ?? "");
  const [email,   setEmail]   = useState(user?.email ?? "");
  const [subject, setSubject] = useState<typeof SUBJECTS[number]["value"]>("duvida");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Preencha todos os campos obrigatórios.");
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

      // Fire email notification — non-blocking (UX doesn't depend on it)
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ ticket_id: ticketId }),
        }
      ).catch((e) => console.error("notify-ticket:", e));

      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Não foi possível enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const focusGold = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--gold)";
  };
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm w-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "var(--green-dim)", border: "1px solid rgba(30,122,68,0.25)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "var(--green)" }} />
          </div>
          <h2 className="font-display text-2xl mb-2" style={{ color: "var(--text)", fontWeight: 400 }}>
            Mensagem enviada
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
            Recebemos seu contato e responderemos em breve no e-mail:
          </p>
          <p className="text-sm font-medium mb-6" style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}>
            {email}
          </p>
          <button
            onClick={() => user ? navigate("/dashboard") : navigate("/")}
            className="btn btn-outline-gold mx-auto"
          >
            {user ? "Voltar ao painel" : "Voltar ao início"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => user ? navigate("/dashboard") : navigate("/")}
            className="p-2 rounded transition-colors flex-shrink-0"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl sm:text-2xl" style={{ color: "var(--text)", fontWeight: 400 }}>
              Central de Atendimento
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Relate um erro, tire dúvidas ou envie uma sugestão
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="p-4 sm:p-6 rounded-md"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  style={inputCls}
                  onFocus={focusGold}
                  onBlur={blurBorder}
                  required
                />
              </Field>
              <Field label="E-mail *">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{ ...inputCls, ...(user ? { opacity: 0.65, cursor: "not-allowed" } : {}) }}
                  onFocus={focusGold}
                  onBlur={blurBorder}
                  readOnly={!!user}
                  required
                />
              </Field>
            </div>

            {/* Subject */}
            <Field label="Assunto *">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUBJECTS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSubject(value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded text-sm text-left transition-all"
                    style={{
                      background:  subject === value ? "var(--gold-dim)"   : "var(--bg-card-2)",
                      border:      `1px solid ${subject === value ? "var(--gold)" : "var(--border)"}`,
                      color:       subject === value ? "var(--gold)"        : "var(--text-2)",
                      fontFamily:  "'Outfit', sans-serif",
                      fontWeight:  subject === value ? 500 : 400,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Message */}
            <Field
              label="Mensagem *"
              hint="Descreva com o máximo de detalhes. Para erros, informe o que estava fazendo quando ocorreu."
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva sua dúvida, erro ou sugestão..."
                rows={5}
                style={{ ...inputCls, resize: "vertical", lineHeight: 1.6 }}
                onFocus={focusGold}
                onBlur={blurBorder}
                required
              />
            </Field>

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
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={sending}
                className="btn btn-gold flex-1 justify-center"
                style={{ opacity: sending ? 0.6 : 1 }}
              >
                <Send className="w-4 h-4" />
                {sending ? "Enviando..." : "Enviar mensagem"}
              </button>
              <button
                type="button"
                onClick={() => user ? navigate("/dashboard") : navigate("/")}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Info footer */}
        <p className="text-xs text-center mt-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Respondemos em até 48h úteis · Suporte em português
        </p>
      </div>
    </div>
  );
}
