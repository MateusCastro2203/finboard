import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY   = Deno.env.get("RESEND_API_KEY")  ?? "";
const ADMIN_EMAIL      = Deno.env.get("ADMIN_EMAIL")     ?? "mateuscastro@developercorp.com";
const FROM_EMAIL       = Deno.env.get("FROM_EMAIL")      ?? "suporte@finboard.com.br";
const APP_URL          = (Deno.env.get("APP_URL")        ?? "https://finboard.com.br").replace(/\/$/, "");
const productionOrigin = (Deno.env.get("APP_URL")        ?? "").replace(/\/$/, "");

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allowed = isLocalhost || origin === productionOrigin ? origin : productionOrigin || origin;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend: ${body}`);
  }
  return res.json();
}

function adminEmailHtml(user: { name: string; email: string; created_at: string }) {
  const adminUrl = `${APP_URL}/admin`;
  const date = new Date(user.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px;border-bottom:2px solid #b8811e;">
            <span style="font-size:22px;font-weight:400;color:#c8912a;letter-spacing:0.06em;font-family:Georgia,serif;">FinBoard</span>
            <span style="display:inline-block;margin-left:10px;font-size:11px;padding:2px 8px;background:rgba(200,145,42,0.2);color:#c8912a;border-radius:4px;vertical-align:middle;">Novo usuário</span>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:#f0fdf4;padding:14px 32px;border-bottom:1px solid #bbf7d0;">
            <p style="margin:0;font-size:13px;color:#166534;font-weight:500;">
              🎉 Nova conta criada no FinBoard
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <!-- User meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fa;border-radius:6px;border:1px solid #e4e4e7;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="4">
                    <tr>
                      <td style="font-size:11px;color:#71717a;width:90px;padding:4px 0;">Nome</td>
                      <td style="font-size:13px;color:#18181b;font-weight:500;padding:4px 0;">${user.name}</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#71717a;padding:4px 0;">E-mail</td>
                      <td style="font-size:13px;color:#18181b;padding:4px 0;">${user.email}</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#71717a;padding:4px 0;">Data</td>
                      <td style="font-size:13px;color:#18181b;padding:4px 0;">${date}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#c8912a;border-radius:5px;">
                  <a href="${adminUrl}" style="display:inline-block;padding:11px 22px;color:#0a0a0a;font-size:13px;font-weight:600;text-decoration:none;">
                    Abrir painel admin →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#f9f9fa;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">FinBoard · Notificação automática de cadastro · Não responda este e-mail</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeEmailHtml(user: { name: string }) {
  const firstName = user.name.split(" ")[0];
  const loginUrl = `${APP_URL}/auth`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px;border-bottom:2px solid #b8811e;">
            <span style="font-size:22px;font-weight:400;color:#c8912a;letter-spacing:0.06em;font-family:Georgia,serif;">FinBoard</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 28px;">
            <p style="margin:0 0 6px;font-size:24px;color:#18181b;font-weight:400;font-family:Georgia,serif;">Bem-vindo, ${firstName}!</p>
            <p style="margin:16px 0 0;font-size:14px;color:#52525b;line-height:1.7;">
              Sua conta no <strong style="color:#18181b;">FinBoard</strong> foi criada com sucesso.
              Confirme seu e-mail e acesse o painel para começar a acompanhar o DRE, o fluxo de caixa e as margens da sua empresa.
            </p>
          </td>
        </tr>

        <!-- Features -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;border:1px solid #e4e4e7;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:13px;color:#18181b;font-weight:500;">📊 DRE automatizado</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Resultados financeiros consolidados por período</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:13px;color:#18181b;font-weight:500;">💵 Fluxo de caixa</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Entradas e saídas com visão por categorias</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#18181b;font-weight:500;">📈 Análise de margens</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#71717a;">EBITDA, margem bruta e líquida em tempo real</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#c8912a;border-radius:5px;">
                  <a href="${loginUrl}" style="display:inline-block;padding:12px 28px;color:#0a0a0a;font-size:13px;font-weight:600;text-decoration:none;">
                    Acessar o FinBoard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#f9f9fa;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">FinBoard · Dúvidas? Acesse finboard.com.br/suporte · Não responda este e-mail</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurado");

    const { name, email } = await req.json();
    if (!email) throw new Error("email obrigatório");

    const displayName = name?.trim() || email.split("@")[0];
    const created_at = new Date().toISOString();

    await Promise.all([
      sendEmail(
        ADMIN_EMAIL,
        `[FinBoard] Nova conta: ${displayName} (${email})`,
        adminEmailHtml({ name: displayName, email, created_at }),
      ),
      sendEmail(
        email,
        "Bem-vindo ao FinBoard!",
        welcomeEmailHtml({ name: displayName }),
      ),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
