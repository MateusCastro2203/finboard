import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { CheckCircle2, Shield } from "lucide-react";

export default function Checkout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && profile?.has_access) navigate("/dashboard");
  }, [user, profile, loading, navigate]);

  async function handlePay() {
    setCreating(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar pagamento");
      if (data.already_paid) { navigate("/dashboard"); return; }

      window.location.href = data.init_point;
    } catch (err: any) {
      setError(err.message);
      setCreating(false);
    }
  }

  if (loading) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,42,0.06) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
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
          <h1
            className="font-display text-2xl mb-1"
            style={{ color: "var(--text)", fontWeight: 400 }}
          >
            Finalizar compra
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Acesso vitalício ao FinBoard —{" "}
            <span style={{ textDecoration: "line-through", opacity: 0.5 }}>R$ 197</span>{" "}
            <strong style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}>R$ 98,60</strong>
          </p>

          {/* Feature list */}
          <div
            className="rounded-md p-4 mb-5 flex flex-col gap-2.5"
            style={{ background: "var(--bg-card-2)", border: "1px solid var(--border-soft)" }}
          >
            {[
              "DRE Gerencial completa",
              "Análise de Margem (Bruta, EBITDA, Líquida)",
              "Fluxo de Caixa realizado e projetado",
              "Painel Executivo para boardroom",
              "Acesso vitalício · Sem mensalidade",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--green)" }} />
                {item}
              </div>
            ))}
          </div>

          {/* Price */}
          <div
            className="flex items-center justify-between rounded-md p-4 mb-5"
            style={{ background: "var(--gold-dim)", border: "1px solid rgba(200,145,42,0.2)" }}
          >
            <span className="font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Total</span>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className="font-mono-data text-xs"
                style={{ textDecoration: "line-through", color: "var(--text-3)" }}
              >
                R$ 197,00
              </span>
              <span
                className="font-mono-data"
                style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--gold)" }}
              >
                R$ 98,60
              </span>
            </div>
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded mb-4"
              style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handlePay}
            disabled={creating}
            className="btn btn-gold w-full justify-center"
            style={{ fontSize: "1rem", padding: "14px 24px", opacity: creating ? 0.6 : 1 }}
          >
            {creating ? "Redirecionando..." : "Pagar com Mercado Pago"}
          </button>

          <p
            className="text-center text-xs mt-3 flex items-center justify-center gap-1"
            style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
          >
            <Shield className="w-3 h-3" />
            PIX, Boleto ou Cartão · 7 dias de garantia
          </p>
        </div>
      </div>
    </div>
  );
}
