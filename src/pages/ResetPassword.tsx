import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

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
      onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
    />
  );
}

type Stage = "loading" | "form" | "done" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [stage,    setStage]    = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands via the reset link
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStage("form");
      }
    });

    // Also check if there's already an active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStage("form");
      } else {
        // Wait up to 3s for the PASSWORD_RECOVERY event before showing invalid
        const timeout = setTimeout(() => {
          setStage((current) => current === "loading" ? "invalid" : current);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStage("done");
    setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        navigate(session ? "/dashboard" : "/auth", { replace: true });
      });
    }, 2500);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,42,0.06) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="w-full" style={{ maxWidth: 400 }}>

        {/* Logo */}
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

          {/* Loading */}
          {stage === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div
                className="w-7 h-7 rounded-full animate-spin"
                style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Verificando link...
              </p>
            </div>
          )}

          {/* Invalid / expired link */}
          {stage === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--red-dim)", border: "1px solid rgba(212,88,80,0.25)" }}
              >
                <AlertCircle className="w-6 h-6" style={{ color: "var(--red)" }} />
              </div>
              <div>
                <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)", fontWeight: 400 }}>
                  Link inválido ou expirado
                </h2>
                <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Este link de recuperação já foi usado ou expirou.
                </p>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="btn btn-gold mt-2"
              >
                Solicitar novo link
              </button>
            </div>
          )}

          {/* New password form */}
          {stage === "form" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.3)" }}
                >
                  <KeyRound className="w-4 h-4" style={{ color: "var(--gold)" }} />
                </div>
                <div>
                  <h2 className="font-display text-xl" style={{ color: "var(--text)", fontWeight: 400 }}>
                    Nova senha
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    Escolha uma senha forte com pelo menos 8 caracteres
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                    Nova senha
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                    Confirmar senha
                  </label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
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
                  disabled={loading}
                  className="btn btn-gold w-full justify-center mt-1"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {stage === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--green-dim)", border: "1px solid rgba(30,122,68,0.25)" }}
              >
                <CheckCircle2 className="w-6 h-6" style={{ color: "var(--green)" }} />
              </div>
              <div>
                <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)", fontWeight: 400 }}>
                  Senha atualizada!
                </h2>
                <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Redirecionando...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
