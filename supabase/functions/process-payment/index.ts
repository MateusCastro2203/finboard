import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  (Deno.env.get("APP_URL") ?? "http://localhost:5173").replace(/\/$/, ""),
  "http://localhost:5173",
  "http://localhost:4173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido");

    // Verificar se já tem acesso
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_access")
      .eq("id", user.id)
      .single();

    if (profile?.has_access) {
      return new Response(
        JSON.stringify({ already_paid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Receber formData do Payment Brick
    const formData = await req.json();
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;

    // Montar payload de pagamento para a API do MP
    const paymentPayload = {
      ...formData,
      transaction_amount: 0.01, // TEMPORÁRIO - voltar para 98.60
      description: "FinBoard - Kit de KPIs Financeiros para PME",
      external_reference: user.id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`,
      payer: {
        ...formData.payer,
        email: formData.payer?.email ?? user.email,
      },
    };

    // Criar pagamento diretamente via API do MP
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      throw new Error(`Mercado Pago error: ${err}`);
    }

    const payment = await mpResponse.json();

    // Salvar purchase pendente
    await supabase.from("purchases").upsert({
      user_id: user.id,
      mp_payment_id: String(payment.id),
      mp_preference_id: payment.preference_id ?? null,
      status: payment.status,
      amount: payment.transaction_amount,
    }, { onConflict: "user_id" });

    // Se já aprovado (ex: cartão instantâneo), liberar acesso na hora
    if (payment.status === "approved") {
      await supabase
        .from("profiles")
        .update({ has_access: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify(payment),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
