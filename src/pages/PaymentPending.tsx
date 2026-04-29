import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  const paymentType = params.get("payment_type");

  const isBoleto = paymentType === "ticket" || paymentType === "boleto";

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

        <h1
          className="font-display text-3xl mb-3"
          style={{ color: "var(--text)", fontWeight: 400 }}
        >
          Pagamento pendente
        </h1>

        <p className="text-sm mb-2" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
          {isBoleto
            ? "Seu boleto foi gerado. Após o pagamento ser compensado (até 2 dias úteis), seu acesso será liberado automaticamente."
            : "Seu pagamento está sendo processado. Assim que for confirmado, seu acesso será liberado automaticamente."}
        </p>

        {paymentId && (
          <p className="text-xs mt-2 mb-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            ID do pagamento: <span style={{ color: "var(--text-2)" }}>{paymentId}</span>
          </p>
        )}

        {!paymentId && <div className="mb-6" />}

        <div
          className="rounded-md p-4 mb-8 text-left"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
            O que acontece agora?
          </p>
          <ul className="text-xs space-y-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            <li>→ O Mercado Pago irá nos notificar quando o pagamento for confirmado</li>
            <li>→ Seu acesso será liberado automaticamente</li>
            <li>→ Você receberá um e-mail de confirmação</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/checkout")}
            className="btn btn-gold mx-auto"
            style={{ fontSize: "0.9rem" }}
          >
            Verificar status do pagamento
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-xs"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
