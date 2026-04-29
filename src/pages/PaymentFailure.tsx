import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentFailure() {
  const navigate = useNavigate();
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
          Algo deu errado no pagamento. Não se preocupe — nenhuma cobrança foi efetuada.
        </p>
        <button
          onClick={() => navigate("/checkout")}
          className="btn btn-gold mx-auto"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
