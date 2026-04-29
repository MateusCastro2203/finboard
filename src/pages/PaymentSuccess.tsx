import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const MAX = 15;

    async function checkAccess() {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setChecking(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("has_access")
        .eq("id", session.user.id)
        .single();

      if (profile?.has_access) {
        setReady(true);
        setChecking(false);
      } else if (attempts < MAX) {
        setTimeout(checkAccess, 2000);
      } else {
        setChecking(false);
      }
    }

    checkAccess();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(61,184,112,0.05) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="text-center" style={{ maxWidth: 420 }}>
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--green-dim)", border: "1px solid rgba(61,184,112,0.25)" }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: "var(--green)" }} />
        </div>

        <h1
          className="font-display text-3xl mb-3"
          style={{ color: "var(--text)", fontWeight: 400 }}
        >
          Pagamento confirmado!
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
          {checking
            ? "Liberando seu acesso... aguarde um instante."
            : "Seu acesso foi liberado. Clique abaixo para entrar no painel."}
        </p>

        {checking && (
          <div
            className="flex items-center justify-center gap-2 text-sm mb-6"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)", animation: "spin 0.8s linear infinite" }}
            />
            Verificando pagamento...
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          disabled={checking && !ready}
          className="btn btn-gold mx-auto"
          style={{ opacity: (checking && !ready) ? 0.5 : 1, fontSize: "0.9rem" }}
        >
          {ready ? "Acessar meu painel agora" : checking ? "Aguardando liberação..." : "Acessar o painel"}
        </button>

        {!checking && !ready && (
          <p
            className="text-xs mt-4"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            Se o acesso não abrir, aguarde 1 minuto e tente novamente.
          </p>
        )}
      </div>
    </div>
  );
}
