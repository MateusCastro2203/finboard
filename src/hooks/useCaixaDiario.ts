import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { FluxoCaixa } from "../types";

export type NovoLancamento = Omit<FluxoCaixa, "id" | "company_id" | "recorrencia_grupo">;

function gerarRecorrentes(
  base: NovoLancamento,
  companyId: string,
  repeticoes: number,
): Record<string, unknown>[] {
  const grupo = crypto.randomUUID();
  const [ano, mes, dia] = base.data.split("-").map(Number);

  return Array.from({ length: repeticoes }, (_, i) => {
    let data: string;
    if (base.recorrencia === "mensal") {
      const targetYear  = ano + Math.floor((mes - 1 + i) / 12);
      const targetMonth = ((mes - 1 + i) % 12) + 1;
      const lastDay     = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay   = Math.min(dia, lastDay);
      data = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
    } else {
      const d = new Date(ano, mes - 1, dia + i * 7);
      data = d.toISOString().slice(0, 10);
    }
    return {
      ...base,
      company_id: companyId,
      data,
      realizado: i === 0 ? base.realizado : false,
      recorrencia_grupo: grupo,
    };
  });
}

export function useCaixaDiario(companyId: string | undefined, filtroMes: string) {
  const [lancamentos, setLancamentos] = useState<FluxoCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [ano, mes] = filtroMes.split("-").map(Number);
      const inicio = `${filtroMes}-01`;
      const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

      const { data, error: err } = await supabase
        .from("fluxo_caixa")
        .select("*")
        .eq("company_id", companyId)
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false });

      if (err) throw err;
      setLancamentos((data ?? []) as FluxoCaixa[]);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao carregar lançamentos.");
    } finally {
      setLoading(false);
    }
  }, [companyId, filtroMes]);

  useEffect(() => { load(); }, [load]);

  async function inserir(novo: NovoLancamento, repeticoes = 1): Promise<void> {
    if (!companyId) return;

    if (novo.recorrencia && repeticoes > 1) {
      const registros = gerarRecorrentes(novo, companyId, repeticoes);
      const { error: err } = await supabase.from("fluxo_caixa").insert(registros);
      if (err) throw err;
    } else {
      const { error: err } = await supabase
        .from("fluxo_caixa")
        .insert({ ...novo, company_id: companyId, recorrencia_grupo: null });
      if (err) throw err;
    }
    await load();
  }

  async function atualizar(id: string, dados: Partial<NovoLancamento>): Promise<void> {
    const { error: err } = await supabase
      .from("fluxo_caixa")
      .update(dados)
      .eq("id", id);
    if (err) throw err;
    await load();
  }

  async function excluir(id: string): Promise<void> {
    const { error: err } = await supabase
      .from("fluxo_caixa")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await load();
  }

  async function excluirGrupoFuturo(grupo: string, dataReferencia: string): Promise<void> {
    if (!companyId) return;
    const { error: err } = await supabase
      .from("fluxo_caixa")
      .delete()
      .eq("company_id", companyId)
      .eq("recorrencia_grupo", grupo)
      .gte("data", dataReferencia);
    if (err) throw err;
    await load();
  }

  return { lancamentos, loading, error, inserir, atualizar, excluir, excluirGrupoFuturo, reload: load };
}
