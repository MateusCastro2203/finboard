import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface Meta {
  periodo: string;
  receita_liquida_meta: number | null;
  margem_ebitda_meta: number | null;
  lucro_liquido_meta: number | null;
}

export function useMetas(companyId: string | undefined) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMetas() {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("metas")
      .select("periodo, receita_liquida_meta, margem_ebitda_meta, lucro_liquido_meta")
      .eq("company_id", companyId)
      .order("periodo");
    setMetas(data ?? []);
    setLoading(false);
  }

  async function saveMeta(meta: Meta) {
    if (!companyId) return;
    await supabase.from("metas").upsert(
      { company_id: companyId, ...meta },
      { onConflict: "company_id,periodo" }
    );
    await loadMetas();
  }

  useEffect(() => { loadMetas(); }, [companyId]);

  return { metas, loading, saveMeta };
}
