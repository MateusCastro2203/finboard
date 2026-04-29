import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { calcularDre } from "../lib/utils";
import type { Company, DreLancamento, FluxoCaixa, DreCalculado } from "../types";

export function useFinancialData(userId: string | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [dreData, setDreData] = useState<DreCalculado[]>([]);
  const [fluxoData, setFluxoData] = useState<FluxoCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: companies, error: coErr } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .limit(1);

      if (coErr) throw coErr;

      const co = companies?.[0] ?? null;
      setCompany(co);

      if (!co) { setLoading(false); return; }

      const { data: lancamentos, error: dreErr } = await supabase
        .from("dre_lancamentos")
        .select("*")
        .eq("company_id", co.id)
        .order("periodo", { ascending: true });

      if (dreErr) throw dreErr;
      setDreData(calcularDre((lancamentos ?? []) as DreLancamento[]));

      const { data: fluxo, error: fluxoErr } = await supabase
        .from("fluxo_caixa")
        .select("*")
        .eq("company_id", co.id)
        .order("data", { ascending: true });

      if (fluxoErr) throw fluxoErr;
      setFluxoData((fluxo ?? []) as FluxoCaixa[]);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao carregar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { company, dreData, fluxoData, loading, error, reload: load };
}
