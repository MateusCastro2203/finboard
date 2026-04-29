import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [polling, setPolling] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  const paymentType = params.get("payment_type");
  const isBoleto = paymentType === "ticket" || paymentType === "boleto";

  // Polling: assim que webhook liberar o acesso, redireciona automático
  useEffect(() => {
    let attempts = 0;
    const MAX = 150; // até ~5 minutos
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      attempts++;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setPolling(false); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_access")
          .eq("id", session.user.id)
          .single();

        if (profile?.has_access) {
          setConfirmed(true);
          setPolling(false);
          setTimeout(() => navigate("/dashboard"), 1500);
          return;
        }
      } catch { /* ignora erros de rede */ }

      if (attempts < MAX) {
        timer = setTimeout(check, 2000);
      } else {
        setPolling(false);
      }
    }

    check();
    return () => clearTimeout(timer);
  }, [navigate]);

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center" style={{ maxWidth: 420 }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--green-dim)", border: "1px solid rgba(61,184,112,0.25)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "var(--green)" }} />
          </div>
          <h1 className="font-display text-3xl mb-2" style={{ color: "var(--text)", fontWeight: 400 }}>
            Pagamento confirmado!
          </h1>
          <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Redirecionando para o painel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,42,0.05) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="text-center" style={{ maxWidth: 460 }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(200,145,42,0.1)", border: "1px solid rgba(200,145,42,0.25)" }}
        >
          <Clock className="w-8 h-8" style={{ color: "var(--gold)" }} />
        </div>

        <h1 className="font-display text-3xl mb-3" style={{ color: "var(--text)", fontWeight: 400 }}>
          Pagamento pendente
        </h1>

        <p className="text-sm mb-2" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
          {isBoleto
            ? "Após o boleto ser compensado (até 2 dias úteis), seu acesso será liberado automaticamente."
            : "Seu pagamento está sendo processado. Assim que confirmado, você será redirecionado automaticamente."}
        </p>

        {polling && (
          <div className="flex items-center justify-center gap-2 mt-4 mb-2"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.8rem" }}>
            <span
              className="w-3.5 h-3.5 rounded-full inline-block"
              style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)", animation: "spin 0.8s linear infinite" }}
            />
            Verificando pagamento...
          </div>
        )}

        {paymentId && (
          <p className="text-xs mt-3" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            ID do pagamento: <span style={{ color: "var(--text-2)" }}>{paymentId}</span>
          </p>
        )}

        <div
          className="rounded-md p-4 mt-6 mb-6 text-left"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
            O que acontece agora?
          </p>
          <ul className="text-xs space-y-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            <li>→ O Mercado Pago nos notifica quando o pagamento for confirmado</li>
            <li>→ Seu acesso é liberado automaticamente</li>
            <li>→ Esta página redireciona sozinha — não precisa fazer nada</li>
          </ul>
        </div>

        {!polling && (
          <button
            onClick={() => navigate("/checkout")}
            className="btn btn-gold mx-auto"
            style={{ fontSize: "0.9rem" }}
          >
            Verificar status ou tentar outro método
          </button>
        )}
      </div>
    </div>
  );
}
