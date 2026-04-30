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

    // Pagamento não encontrado = notificação de teste ou ID inválido → ignora
    if (mpResponse.status === 404) {
      console.log("Pagamento não encontrado (provavelmente teste):", id);
      return new Response("ok", { status: 200 });
    }

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      throw new Error(`MP API error ${mpResponse.status}: ${errText}`);
    }

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

      // Send payment receipt email
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const appUrl    = Deno.env.get("APP_URL") ?? "https://finboard.app.br";
      if (resendKey) {
        try {
          const { data: { user: buyer } } = await supabase.auth.admin.getUserById(userId);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", userId)
            .limit(1);
          const fullName = profiles?.[0]?.full_name ?? "";
          const greeting = fullName ? `Olá, ${fullName}!` : "Olá!";

          const paidAt = new Date().toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric",
          });
          const amount = new Intl.NumberFormat("pt-BR", {
            style: "currency", currency: "BRL",
          }).format(payment.transaction_amount ?? 98.60);

          const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pagamento confirmado — FinBoard</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:26px;font-weight:400;color:#c8912a;letter-spacing:0.08em;font-family:Georgia,'Times New Roman',serif;">FinBoard</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:10px;border:1px solid #e4e4e7;overflow:hidden;">

          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#0a0a0a;padding:28px 36px;border-bottom:2px solid #b8811e;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:14px;vertical-align:middle;">
                    <div style="width:40px;height:40px;background:rgba(200,145,42,0.15);border:1px solid rgba(200,145,42,0.35);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                      <img src="https://api.iconify.design/lucide/check-circle.svg?color=%23c8912a&width=20&height=20" width="20" height="20" alt="" style="display:block;" />
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;color:#ffffff;font-weight:500;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.3;">Pagamento confirmado</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;font-family:'Helvetica Neue',Arial,sans-serif;">Acesso vitalício ativado</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 36px 28px;">

              <p style="margin:0 0 16px;font-size:15px;color:#18181b;line-height:1.7;font-family:'Helvetica Neue',Arial,sans-serif;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.7;font-family:'Helvetica Neue',Arial,sans-serif;">
                Seu pagamento foi aprovado e seu acesso ao <strong style="color:#18181b;">FinBoard</strong> está ativo. Você tem acesso vitalício a todos os recursos da plataforma.
              </p>

              <!-- Receipt box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
                <tr><td style="background:#f9f9fa;padding:14px 20px;border-bottom:1px solid #e4e4e7;">
                  <p style="margin:0;font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Arial,sans-serif;">Recibo de pagamento</p>
                </td></tr>
                <tr><td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#52525b;font-family:'Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Produto</td>
                      <td align="right" style="font-size:13px;color:#18181b;font-weight:500;font-family:'Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">FinBoard — Acesso Vitalício</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#52525b;font-family:'Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Data</td>
                      <td align="right" style="font-size:13px;color:#18181b;font-family:'Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">${paidAt}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#52525b;font-family:'Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">ID do pagamento</td>
                      <td align="right" style="font-size:12px;color:#71717a;font-family:'Courier New',monospace;padding-bottom:8px;">${payment.id}</td>
                    </tr>
                    <tr>
                      <td style="border-top:1px solid #f0f0f0;padding-top:10px;font-size:14px;font-weight:600;color:#18181b;font-family:'Helvetica Neue',Arial,sans-serif;">Total</td>
                      <td align="right" style="border-top:1px solid #f0f0f0;padding-top:10px;font-size:16px;font-weight:600;color:#c8912a;font-family:'Helvetica Neue',Arial,sans-serif;">${amount}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="background:#c8912a;border-radius:6px;">
                  <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 28px;color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:0.01em;">
                    Acessar meu painel →
                  </a>
                </td></tr>
              </table>

              <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;font-family:'Helvetica Neue',Arial,sans-serif;">
                Dúvidas? Responda este e-mail ou acesse <a href="${appUrl}/suporte" style="color:#c8912a;text-decoration:none;">finboard.app.br/suporte</a>.
              </p>

            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:24px 0 0;">
          <p style="margin:0;font-size:11px;color:#a1a1aa;font-family:'Helvetica Neue',Arial,sans-serif;">
            FinBoard · <a href="${appUrl}" style="color:#a1a1aa;text-decoration:none;">finboard.app.br</a> · Suporte em português
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

          if (buyer?.email) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "FinBoard <suporte@finboard.app.br>",
                to: [buyer.email],
                subject: "Pagamento confirmado — Acesso FinBoard ativado",
                html,
              }),
            });
          }
        } catch (emailErr) {
          console.error("Receipt email error:", emailErr);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("internal error", { status: 500 });
  }
});
