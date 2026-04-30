import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL     = Deno.env.get("ADMIN_EMAIL")    ?? "mateuscastro@developercorp.com";
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL")     ?? "suporte@finboard.com.br";
const APP_URL         = (Deno.env.get("APP_URL")       ?? "https://finboard.com.br").replace(/\/$/, "");
const productionOrigin = (Deno.env.get("APP_URL")      ?? "").replace(/\/$/, "");

const SUBJECT_LABELS: Record<string, string> = {
  erro:       "Erro no sistema",
  duvida:     "Dúvida de uso",
  financeiro: "Questão financeira / pagamento",
  acesso:     "Problema de acesso / login",
  melhoria:   "Sugestão de melhoria",
  outro:      "Outro",
};

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

function adminEmailHtml(ticket: {
  id: string; name: string; email: string;
  subject: string; message: string; created_at: string;
}) {
  const subjectLabel = SUBJECT_LABELS[ticket.subject] ?? ticket.subject;
  const adminUrl = `${APP_URL}/admin`;
  const date = new Date(ticket.created_at).toLocaleString("pt-BR", {
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
            <span style="display:inline-block;margin-left:10px;font-size:11px;padding:2px 8px;background:rgba(200,145,42,0.2);color:#c8912a;border-radius:4px;vertical-align:middle;">SAC</span>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:#fef9ec;padding:14px 32px;border-bottom:1px solid #fde68a;">
            <p style="margin:0;font-size:13px;color:#92400e;font-weight:500;">
              📬 Novo chamado de suporte recebido
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <!-- Ticket meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9fa;border-radius:6px;border:1px solid #e4e4e7;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="4">
                    <tr>
                      <td style="font-size:11px;color:#71717a;width:90px;padding:4px 0;">De</td>
                      <td style="font-size:13px;color:#18181b;font-weight:500;padding:4px 0;">${ticket.name} &lt;${ticket.email}&gt;</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#71717a;padding:4px 0;">Assunto</td>
                      <td style="font-size:13px;color:#18181b;padding:4px 0;">${subjectLabel}</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#71717a;padding:4px 0;">Data</td>
                      <td style="font-size:13px;color:#18181b;padding:4px 0;">${date}</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#71717a;padding:4px 0;">ID</td>
                      <td style="font-size:11px;color:#a1a1aa;font-family:monospace;padding:4px 0;">${ticket.id}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Message -->
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Mensagem</p>
            <div style="background:#f9f9fa;border-left:3px solid #c8912a;border-radius:0 4px 4px 0;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#18181b;line-height:1.7;white-space:pre-wrap;">${ticket.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>

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
            <p style="margin:0;font-size:11px;color:#a1a1aa;">FinBoard · Notificação automática de SAC · Não responda este e-mail</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function userConfirmationHtml(ticket: {
  name: string; email: string; subject: string; message: string;
}) {
  const subjectLabel = SUBJECT_LABELS[ticket.subject] ?? ticket.subject;
  const firstName = ticket.name.split(" ")[0];

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
          <td style="padding:32px 32px 24px;">
            <p style="margin:0 0 6px;font-size:22px;color:#18181b;font-weight:400;font-family:Georgia,serif;">Olá, ${firstName} 👋</p>
            <p style="margin:16px 0 0;font-size:14px;color:#52525b;line-height:1.7;">
              Recebemos sua mensagem sobre <strong style="color:#18181b;">${subjectLabel}</strong> e entraremos em contato em breve.
            </p>
            <p style="margin:12px 0 0;font-size:14px;color:#52525b;line-height:1.7;">
              Respondemos em até <strong style="color:#18181b;">48h úteis</strong> neste mesmo endereço de e-mail.
            </p>
          </td>
        </tr>

        <!-- Message recap -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Sua mensagem</p>
            <div style="background:#f9f9fa;border-left:3px solid #e4e4e7;border-radius:0 4px 4px 0;padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#71717a;line-height:1.7;white-space:pre-wrap;">${ticket.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#f9f9fa;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">FinBoard · Suporte em português · Você recebeu este e-mail porque abriu um chamado.</p>
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

    const { ticket_id } = await req.json();
    if (!ticket_id) throw new Error("ticket_id obrigatório");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: ticket, error } = await supabase
      .from("sac_tickets")
      .select("id, name, email, subject, message, created_at")
      .eq("id", ticket_id)
      .single();

    if (error || !ticket) throw new Error("Ticket não encontrado");

    const subjectLabel = SUBJECT_LABELS[ticket.subject] ?? ticket.subject;

    await Promise.all([
      sendEmail(
        ADMIN_EMAIL,
        `[FinBoard SAC] Novo chamado: ${subjectLabel} — ${ticket.name}`,
        adminEmailHtml(ticket),
      ),
      sendEmail(
        ticket.email,
        "Recebemos sua mensagem — FinBoard Suporte",
        userConfirmationHtml(ticket),
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
