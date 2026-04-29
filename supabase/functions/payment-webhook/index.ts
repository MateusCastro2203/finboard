import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyMPSignature(
  dataId: string,
  xRequestId: string | null,
  xSignature: string | null,
  secret: string,
): Promise<boolean> {
  if (!xSignature) return false;

  const parts: Record<string, string> = {};
  for (const chunk of xSignature.split(",")) {
    const eq = chunk.indexOf("=");
    if (eq > 0) parts[chunk.slice(0, eq).trim()] = chunk.slice(eq + 1).trim();
  }
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
    const mpWebhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");

    const url = new URL(req.url);

    // Extrair topic e id — MP usa dois formatos diferentes:
    // Formato antigo (IPN): ?topic=payment&id=PAYMENT_ID
    // Formato novo (Webhooks): ?type=payment&data.id=PAYMENT_ID  (ou body JSON)
    let topic = url.searchParams.get("topic")
      ?? url.searchParams.get("type")
      ?? url.searchParams.get("action");

    let id = url.searchParams.get("id")
      ?? url.searchParams.get("data.id");

    // Formato novo: MP pode enviar o id no corpo JSON
    if (!id && req.method === "POST") {
      try {
        const body = await req.clone().json();
        id = body?.data?.id ? String(body.data.id) : null;
        topic = topic ?? body?.type ?? body?.action ?? null;
      } catch { /* corpo não é JSON, ignora */ }
    }

    console.log("Webhook recebido — topic:", topic, "| id:", id);

    // Aceita todos os formatos de notificação de pagamento do MP
    const isPaymentTopic = !topic
      || topic === "payment"
      || topic === "payment.created"
      || topic === "payment.updated"
      || topic === "merchant_order";

    if (!isPaymentTopic) {
      console.log("Topic ignorado:", topic);
      return new Response("ok", { status: 200 });
    }

    if (!id) return new Response("bad request: missing id", { status: 400 });

    // Verify Mercado Pago webhook signature when secret is configured
    if (mpWebhookSecret) {
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");
      const valid = await verifyMPSignature(id, xRequestId, xSignature, mpWebhookSecret);
      if (!valid) {
        console.warn("Webhook signature verification failed");
        return new Response("unauthorized", { status: 401 });
      }
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${mpAccessToken}` },
    });

    if (!mpResponse.ok) throw new Error("Falha ao buscar pagamento no MP");

    const payment = await mpResponse.json();
    const userId = payment.external_reference;
    const status = payment.status;

    if (!userId) return new Response("bad request", { status: 400 });

    await supabase.from("purchases").upsert({
      user_id: userId,
      mp_payment_id: String(payment.id),
      mp_preference_id: payment.preference_id ?? null,
      status,
      amount: payment.transaction_amount,
    }, { onConflict: "user_id" });

    if (status === "approved") {
      await supabase
        .from("profiles")
        .update({ has_access: true, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("internal error", { status: 500 });
  }
});
