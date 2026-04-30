import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const productionOrigin = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allowed = isLocalhost || origin === productionOrigin ? origin : productionOrigin || origin;
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido");

    const { data: callerProfile } = await supabase
      .from("profiles").select("is_admin").eq("id", user.id).single();
    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, target_user_id } = body;

    if (!target_user_id) throw new Error("target_user_id obrigatório");

    if (action === "grant_access") {
      await supabase.from("profiles")
        .update({ has_access: true, updated_at: new Date().toISOString() })
        .eq("id", target_user_id);

      await supabase.from("purchases").upsert({
        user_id: target_user_id,
        status: "approved",
        amount: 0.01,
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ ok: true, action: "grant_access" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke_access") {
      await supabase.from("profiles")
        .update({ has_access: false, updated_at: new Date().toISOString() })
        .eq("id", target_user_id);

      return new Response(JSON.stringify({ ok: true, action: "revoke_access" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
