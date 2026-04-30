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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Autenticar usuário pelo JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido");

    // Verificar is_admin diretamente no banco (source of truth)
    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar todos os usuários (auth.admin)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    if (usersError) throw usersError;

    // Buscar todos os profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (profilesError) throw profilesError;

    // Buscar todas as compras
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });
    if (purchasesError) throw purchasesError;

    // Montar estatísticas
    const approvedPurchases = purchases.filter((p) => p.status === "approved");
    const totalRevenue = approvedPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const usersWithAccess = profiles.filter((p) => p.has_access).length;
    const conversionRate = users.length > 0
      ? ((usersWithAccess / users.length) * 100).toFixed(1)
      : "0.0";

    // Receita por mês (últimos 6 meses)
    const revenueByMonth: Record<string, number> = {};
    approvedPurchases.forEach((p) => {
      const month = p.created_at.slice(0, 7); // "2024-01"
      revenueByMonth[month] = (revenueByMonth[month] ?? 0) + Number(p.amount);
    });

    // Enriquecer usuários com profile + purchase
    const enrichedUsers = users
      .map((u) => {
        const profile = profiles.find((p) => p.id === u.id);
        const purchase = purchases.find((p) => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          full_name: profile?.full_name ?? "",
          company_name: profile?.company_name ?? "",
          has_access: profile?.has_access ?? false,
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at ?? null,
          purchase: purchase
            ? {
                status: purchase.status,
                amount: Number(purchase.amount),
                mp_payment_id: purchase.mp_payment_id ?? null,
                mp_preference_id: purchase.mp_preference_id ?? null,
                created_at: purchase.created_at,
                updated_at: purchase.updated_at,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const stats = {
      total_users: users.length,
      users_with_access: usersWithAccess,
      conversion_rate: conversionRate,
      total_revenue: totalRevenue,
      approved_count: approvedPurchases.length,
      pending_count: purchases.filter((p) => p.status === "pending").length,
      rejected_count: purchases.filter((p) => p.status === "rejected").length,
      refunded_count: purchases.filter((p) => p.status === "refunded").length,
    };

    return new Response(
      JSON.stringify({ stats, revenue_by_month: revenueByMonth, users: enrichedUsers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
