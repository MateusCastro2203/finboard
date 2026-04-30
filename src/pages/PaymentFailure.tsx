import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

const STATUS_MESSAGES: Record<string, string> = {
  rejected: "O pagamento foi recusado pelo banco ou operadora do cartão.",
  cc_rejected_insufficient_amount: "Saldo insuficiente no cartão.",
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_bad_filled_security_code: "Código de segurança incorreto.",
  cc_rejected_call_for_authorize: "O banco solicitou que você autorize o pagamento por telefone.",
  cc_rejected_card_disabled: "Cartão desativado. Entre em contato com seu banco.",
  cc_rejected_duplicated_payment: "Pagamento duplicado detectado.",
};

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const status = params.get("status") ?? params.get("collection_status") ?? "rejected";
  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  const message = STATUS_MESSAGES[status] ?? "Algo deu errado no pagamento. Não se preocupe — nenhuma cobrança foi efetuada.";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,88,80,0.05) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="text-center" style={{ maxWidth: 420 }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--red-dim)", border: "1px solid rgba(212,88,80,0.25)" }}
        >
          <XCircle className="w-8 h-8" style={{ color: "var(--red)" }} />
        </div>
        <h1
          className="font-display text-3xl mb-3"
          style={{ color: "var(--text)", fontWeight: 400 }}
        >
          Pagamento não concluído
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
          {message}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/checkout")}
            className="btn btn-gold"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => navigate("/suporte")}
            className="btn btn-ghost"
          >
            Falar com suporte
          </button>
        </div>

        {paymentId && (
          <p className="text-xs mt-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            ID do pagamento: <span style={{ color: "var(--text-2)" }}>{paymentId}</span>
          </p>
        )}
      </div>
    </div>
  );
}
