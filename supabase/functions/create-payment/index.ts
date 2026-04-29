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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Autenticar o usuário pelo JWT
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

    const appUrl = (Deno.env.get("APP_URL") ?? "http://localhost:5173").replace(/\/$/, "");
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;

    // Criar preferência no Mercado Pago
    const preferencePayload = {
      items: [{
        id: "finboard-kit-kpis",
        title: "FinBoard - Kit de KPIs Financeiros para PME",
        description: "DRE Gerencial, Análise de Margem, Fluxo de Caixa e Painel Executivo",
        quantity: 1,
        unit_price: 0.01, // TEMPORÁRIO - voltar para 98.60 após teste
        currency_id: "BRL",
      }],
      back_urls: {
        success: `${appUrl}/payment-success`,
        failure: `${appUrl}/payment-failure`,
        pending: `${appUrl}/payment-pending`,
      },
      ...(appUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
      external_reference: user.id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`,
      statement_descriptor: "FINBOARD",
      expires: false,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": user.id,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      throw new Error(`Mercado Pago error: ${err}`);
    }

    const preference = await mpResponse.json();

    // Registrar purchase pendente
    await supabase.from("purchases").upsert({
      user_id: user.id,
      mp_preference_id: preference.id,
      status: "pending",
      amount: 0.01, // TEMPORÁRIO - voltar para 98.60 após teste
    }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
