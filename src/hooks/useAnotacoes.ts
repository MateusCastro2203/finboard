import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAnotacoes(companyId: string | undefined) {
  const [anotacoes, setAnotacoes] = useState<Record<string, string>>({});

  async function load() {
    if (!companyId) return;
    const { data } = await supabase
      .from("anotacoes")
      .select("periodo, texto")
      .eq("company_id", companyId);
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.periodo] = row.texto;
    setAnotacoes(map);
  }

  async function salvar(periodo: string, texto: string) {
    if (!companyId) return;
    await supabase.from("anotacoes").upsert(
      { company_id: companyId, periodo, texto },
      { onConflict: "company_id,periodo" }
    );
    setAnotacoes(prev => ({ ...prev, [periodo]: texto }));
  }

  useEffect(() => { load(); }, [companyId]);

  return {
    getAnotacao: (periodo: string) => anotacoes[periodo] ?? "",
    salvar,
  };
}
