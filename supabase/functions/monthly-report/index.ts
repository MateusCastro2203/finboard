import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function delta(cur: number, pre: number) {
  if (!pre) return "";
  const p = ((cur - pre) / Math.abs(pre)) * 100;
  return p >= 0 ? `▲ ${p.toFixed(1)}%` : `▼ ${Math.abs(p).toFixed(1)}%`;
}
function deltaColor(cur: number, pre: number) {
  if (!pre) return "#7A7672";
  return cur >= pre ? "#3DB870" : "#D45850";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl    = Deno.env.get("APP_URL") ?? "https://finboard.com.br";

    // Busca todos os usuários com acesso e com relatório mensal ativo
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("has_access", true)
      .neq("email_reports", false);

    let sent = 0;

    for (const profile of profiles ?? []) {
      // Busca email do usuário
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      // Busca empresa
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .eq("user_id", profile.id)
        .limit(1);
      const company = companies?.[0];
      if (!company) continue;

      // Busca últimos 2 meses de DRE
      const { data: lancamentos } = await supabase
        .from("dre_lancamentos")
        .select("periodo, categoria, valor")
        .eq("company_id", company.id)
        .order("periodo", { ascending: false })
        .limit(200);

      if (!lancamentos?.length) continue;

      // Agrupa por período
      const byPeriodo = new Map<string, Record<string, number>>();
      for (const l of lancamentos) {
        const key = l.periodo.slice(0, 7);
        if (!byPeriodo.has(key)) byPeriodo.set(key, {});
        const e = byPeriodo.get(key)!;
        e[l.categoria] = (e[l.categoria] ?? 0) + Math.abs(l.valor);
      }

      const periodos = Array.from(byPeriodo.keys()).sort().slice(-2);
      if (periodos.length < 1) continue;

      const calc = (v: Record<string, number>) => {
        const rl  = (v.receita_bruta ?? 0) - (v.deducoes ?? 0);
        const lb  = rl - (v.cmv ?? 0);
        const ebt = lb - (v.despesas_comerciais ?? 0) - (v.despesas_administrativas ?? 0)
                      - (v.despesas_pessoal ?? 0) - (v.outras_despesas_op ?? 0);
        const ll  = ebt - (v.depreciacao ?? 0) + (v.resultado_financeiro ?? 0) - (v.ir_csll ?? 0);
        return { rl, lb, ebt, ll, mb: rl > 0 ? lb / rl : 0, me: rl > 0 ? ebt / rl : 0, ml: rl > 0 ? ll / rl : 0 };
      };

      const last = calc(byPeriodo.get(periodos[periodos.length - 1])!);
      const prev = periodos.length > 1 ? calc(byPeriodo.get(periodos[periodos.length - 2])!) : null;

      const periodoLabel = (() => {
        const [y, m] = periodos[periodos.length - 1].split("-");
        const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
        return `${months[parseInt(m) - 1]}/${y}`;
      })();

      const kpis = [
        { label: "Receita Líquida",  val: fmt(last.rl),  d: prev ? delta(last.rl, prev.rl)   : "", dc: prev ? deltaColor(last.rl, prev.rl)   : "#7A7672" },
        { label: "EBITDA",           val: fmt(last.ebt), d: prev ? delta(last.ebt, prev.ebt) : "", dc: prev ? deltaColor(last.ebt, prev.ebt) : "#7A7672" },
        { label: "Margem EBITDA",    val: pct(last.me),  d: prev ? delta(last.me, prev.me)   : "", dc: prev ? deltaColor(last.me, prev.me)   : "#7A7672" },
        { label: "Lucro Líquido",    val: fmt(last.ll),  d: prev ? delta(last.ll, prev.ll)   : "", dc: prev ? deltaColor(last.ll, prev.ll)   : "#7A7672" },
      ];

      const kpiRows = kpis.map(k => `
        <td style="padding:16px;text-align:center;background:#16161A;border-radius:6px;">
          <div style="color:#7A7672;font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.08em;">${k.label}</div>
          <div style="color:#EDE8DF;font-size:20px;font-family:monospace;font-weight:400;">${k.val}</div>
          ${k.d ? `<div style="color:${k.dc};font-size:11px;margin-top:4px;">${k.d} vs mês ant.</div>` : ""}
        </td>
      `).join("<td style='width:8px'></td>");

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0C;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0C;padding:40px 20px;">
    <tr><td>
      <table width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;margin:0 auto;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:22px;color:#C8912A;letter-spacing:0.06em;">FinBoard</span>
          <span style="color:#42403C;font-size:14px;margin-left:12px;">Relatório Mensal · ${periodoLabel}</span>
        </td></tr>

        <!-- Company -->
        <tr><td style="padding-bottom:24px;border-bottom:1px solid #222227;">
          <p style="color:#EDE8DF;font-size:18px;margin:0 0 4px;">Olá, ${profile.full_name ?? ""}!</p>
          <p style="color:#7A7672;font-size:13px;margin:0;">Aqui está o resumo financeiro de <strong style="color:#EDE8DF;">${company.name}</strong> em ${periodoLabel}.</p>
        </td></tr>

        <!-- KPIs -->
        <tr><td style="padding:24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>${kpiRows}</tr>
          </table>
        </td></tr>

        <!-- Insights -->
        ${last.ebt < 0 ? `
        <tr><td style="background:#1a0a0a;border:1px solid rgba(212,88,80,0.3);border-radius:6px;padding:16px;margin-bottom:24px;">
          <p style="color:#D45850;font-size:13px;margin:0;">⚠️ EBITDA negativo em ${periodoLabel}. A operação está consumindo caixa. Revise custos com urgência.</p>
        </td></tr>
        ` : ""}
        ${prev && (prev.me - last.me) * 100 >= 2 ? `
        <tr><td style="background:#1a1200;border:1px solid rgba(200,145,42,0.2);border-radius:6px;padding:16px;margin-bottom:24px;">
          <p style="color:#C8912A;font-size:13px;margin:0;">📉 Margem EBITDA caiu ${((prev.me - last.me)*100).toFixed(1)} p.p. em relação ao mês anterior. Verifique quais despesas cresceram.</p>
        </td></tr>
        ` : ""}

        <!-- CTA -->
        <tr><td style="padding:24px 0;text-align:center;">
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#C8912A;color:#0A0A0C;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">
            Ver painel completo →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #222227;padding-top:24px;text-align:center;">
          <p style="color:#42403C;font-size:11px;margin:0;">FinBoard · Você recebe este e-mail todo dia 5 do mês.</p>
          <p style="color:#42403C;font-size:11px;margin:4px 0 0;">Para cancelar, acesse as configurações da sua conta.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "FinBoard <relatorio@finboard.app.br>",
          to: [user.email],
          subject: `FinBoard · Resumo de ${periodoLabel} — ${company.name}`,
          html,
        }),
      });

      sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
