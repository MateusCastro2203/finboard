import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 30%, var(--gold-dim) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="text-center max-w-sm">
        <span
          className="font-display block mb-6"
          style={{ fontSize: "7rem", lineHeight: 1, fontWeight: 300, color: "var(--border)", letterSpacing: "-0.02em" }}
        >
          404
        </span>

        <h1
          className="font-display mb-3"
          style={{ fontSize: "1.75rem", fontWeight: 400, color: "var(--text)", lineHeight: 1.2 }}
        >
          Página não encontrada
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          O endereço que você acessou não existe ou foi removido.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn btn-outline-gold text-sm"
          >
            Ir para o início
          </button>
        </div>

        <p
          className="font-display mt-12 text-base tracking-wide"
          style={{ color: "var(--gold)", letterSpacing: "0.06em" }}
        >
          FinBoard
        </p>
      </div>
    </div>
  );
}
