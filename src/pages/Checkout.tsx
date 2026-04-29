import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { CheckCircle2, Shield, Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function loadMPScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const brickControllerRef = useRef<any>(null);

  const [brickReady, setBrickReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  // Redireciona se já tem acesso
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && profile?.has_access) navigate("/dashboard");
  }, [user, profile, authLoading, navigate]);

  // Inicia o Brick assim que o container estiver no DOM
  useEffect(() => {
    if (authLoading || !user || !MP_PUBLIC_KEY) return;

    let pollInterval: ReturnType<typeof setInterval>;
    let destroyed = false;

    async function initBrick() {
      try {
        await loadMPScript();
        if (destroyed) return;

        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();

        const controller = await bricksBuilder.create(
          "payment",
          "mp-payment-brick",
          {
            initialization: {
              amount: 0.01, // TEMPORÁRIO - voltar para 98.60
              preferenceId: undefined,
            },
            customization: {
              paymentMethods: {
                bankTransfer: "all",   // PIX
                creditCard: "all",
                debitCard: "all",
                ticket: "all",         // Boleto
                mercadoPago: "wallet_purchase",
              },
              visual: {
                style: {
                  theme: "dark",
                  customVariables: {
                    baseColor: "#c8911a",
                    outlinePrimaryColor: "#c8911a",
                    buttonTextColor: "#0a0a0a",
                  },
                },
              },
            },
            callbacks: {
              onReady: () => {
                if (!destroyed) setBrickReady(true);
              },
              onError: (error: any) => {
                console.error("Brick error:", error);
                if (!destroyed) setBrickError("Erro ao carregar o pagamento. Tente recarregar a página.");
              },
              onSubmit: async ({ formData }: { formData: any }) => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("Sessão expirada");

                const res = await fetch(`${SUPABASE_URL}/functions/v1/process-payment`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Erro ao processar pagamento");
                if (data.already_paid) { navigate("/dashboard"); return; }

                // Cartão aprovado instantaneamente → redireciona na hora
                if (data.status === "approved") {
                  setPaid(true);
                  setTimeout(() => navigate("/dashboard"), 1500);
                  return;
                }

                // PIX / boleto → começa polling em background
                // O Brick cuida de mostrar o QR. Aqui só iniciamos o poll.
                pollInterval = setInterval(async () => {
                  const { data: { session: s } } = await supabase.auth.getSession();
                  if (!s) return;
                  const { data: p } = await supabase
                    .from("profiles")
                    .select("has_access")
                    .eq("id", s.user.id)
                    .single();
                  if (p?.has_access) {
                    clearInterval(pollInterval);
                    setPaid(true);
                    setTimeout(() => navigate("/dashboard"), 1200);
                  }
                }, 2000);

                return data;
              },
            },
          }
        );

        if (!destroyed) brickControllerRef.current = controller;
      } catch (err: any) {
        if (!destroyed) setBrickError(err.message);
      }
    }

    initBrick();

    return () => {
      destroyed = true;
      clearInterval(pollInterval);
      brickControllerRef.current?.unmount?.();
    };
  }, [authLoading, user, navigate]);

  if (authLoading) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,42,0.06) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div className="w-full" style={{ maxWidth: 520 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="font-display text-2xl tracking-wide"
            style={{ color: "var(--gold)", fontWeight: 400, letterSpacing: "0.06em" }}
          >
            FinBoard
          </span>
        </div>

        {paid ? (
          /* Tela de sucesso */
          <div className="text-center p-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--green-dim)", border: "1px solid rgba(61,184,112,0.25)" }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--green)" }} />
            </div>
            <h2 className="font-display text-2xl mb-2" style={{ color: "var(--text)", fontWeight: 400 }}>
              Pagamento confirmado!
            </h2>
            <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Redirecionando para o painel...
            </p>
          </div>
        ) : (
          <div
            className="p-7 rounded-md"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {/* Header do produto */}
            <h1
              className="font-display text-2xl mb-1"
              style={{ color: "var(--text)", fontWeight: 400 }}
            >
              Finalizar compra
            </h1>
            <p className="text-sm mb-5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Acesso vitalício ao FinBoard —{" "}
              <span style={{ textDecoration: "line-through", opacity: 0.5 }}>R$ 197</span>{" "}
              <strong style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}>R$ 98,60</strong>
            </p>

            {/* Feature list */}
            <div
              className="rounded-md p-4 mb-5 flex flex-col gap-2"
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

            {/* Divider */}
            <div className="border-t mb-5" style={{ borderColor: "var(--border)" }} />

            {/* Brick container */}
            {brickError ? (
              <div
                className="p-4 rounded text-sm text-center"
                style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}
              >
                {brickError}
                <button
                  onClick={() => window.location.reload()}
                  className="block mx-auto mt-2 text-xs underline"
                  style={{ color: "var(--text-3)" }}
                >
                  Recarregar página
                </button>
              </div>
            ) : (
              <>
                {!brickReady && (
                  <div className="flex items-center justify-center gap-2 py-10" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--gold)" }} />
                    <span className="text-sm">Carregando métodos de pagamento...</span>
                  </div>
                )}
                <div
                  id="mp-payment-brick"
                  ref={brickContainerRef}
                  style={{ minHeight: brickReady ? undefined : 0 }}
                />
              </>
            )}

            <p
              className="text-center text-xs mt-4 flex items-center justify-center gap-1"
              style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
            >
              <Shield className="w-3 h-3" />
              PIX, Boleto ou Cartão · 7 dias de garantia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
