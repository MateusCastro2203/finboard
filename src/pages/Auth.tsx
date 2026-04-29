import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: "0.875rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    />
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "reset">("register");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate("/checkout", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(m: typeof mode) {
    setMode(m);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess("Link enviado! Verifique seu e-mail para redefinir a senha.");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSuccess("Conta criada! Verifique seu e-mail para confirmar antes de continuar.");
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError("E-mail ou senha incorretos."); setLoading(false); return; }
      navigate("/checkout");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,42,0.06) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="w-full" style={{ maxWidth: 400 }}>
        <div className="text-center mb-8">
          <span
            className="font-display text-2xl tracking-wide"
            style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.06em" }}
          >
            FinBoard
          </span>
        </div>

        <div
          className="p-7 rounded-md"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {mode === "reset" ? (
            <>
              <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)", fontWeight: 400 }}>
                Recuperar senha
              </h2>
              <p className="text-xs mb-5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Informe seu e-mail e enviaremos um link para redefinir a senha.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                    E-mail
                  </label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@empresa.com" />
                </div>
                {error && <p className="text-xs px-3 py-2 rounded" style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}>{error}</p>}
                {success && <p className="text-xs px-3 py-2 rounded" style={{ color: "var(--green)", background: "var(--green-dim)", fontFamily: "'Outfit', sans-serif" }}>{success}</p>}
                <button type="submit" disabled={loading} className="btn btn-gold w-full justify-center" style={{ opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </form>
              <button onClick={() => switchMode("login")} className="w-full mt-4 text-xs text-center" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                ← Voltar para o login
              </button>
            </>
          ) : (
            <>
              <div className="flex rounded p-0.5 mb-6" style={{ background: "var(--bg-card-2)" }}>
                {(["register", "login"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className="flex-1 py-2 rounded text-sm font-medium transition-all"
                    style={{
                      background: mode === m ? "var(--bg-card)" : "transparent",
                      color: mode === m ? "var(--text)" : "var(--text-3)",
                      border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {m === "register" ? "Criar conta" : "Entrar"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>Nome completo</label>
                    <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Seu nome" />
                  </div>
                )}
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>E-mail</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>Senha</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres" />
                </div>

                {error && <p className="text-xs px-3 py-2 rounded" style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}>{error}</p>}
                {success && <p className="text-xs px-3 py-2 rounded" style={{ color: "var(--green)", background: "var(--green-dim)", fontFamily: "'Outfit', sans-serif" }}>{success}</p>}

                <button type="submit" disabled={loading} className="btn btn-gold w-full justify-center mt-1" style={{ opacity: loading ? 0.6 : 1, fontSize: "0.9rem" }}>
                  {loading ? "Carregando..." : mode === "register" ? "Criar conta e pagar" : "Entrar"}
                </button>

                {mode === "login" && (
                  <button type="button" onClick={() => switchMode("reset")} className="text-xs text-center mt-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    Esqueci minha senha
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Ao criar conta, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
