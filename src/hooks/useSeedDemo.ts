import { useCallback } from "react";
import { supabase } from "../lib/supabase";

const DEMO_COMPANY_NAME = "Empresa Demo — Distribuidora";

export function useSeedDemo() {
  const seedDemo = useCallback(async (userId: string): Promise<string | null> => {
    // Cria empresa demo
    const { data: company, error } = await supabase
      .from("companies")
      .insert({ user_id: userId, name: DEMO_COMPANY_NAME, segmento: "Distribuição" })
      .select()
      .single();

    if (error || !company) return null;

    // Gera 12 meses de DRE
    const now = new Date();
    const rows: object[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const growth = 1 + (Math.random() * 0.06 - 0.01);
      const base = 650000 * Math.pow(1.02, 11 - i) * growth;

      const rb  = Math.round(base);
      const ded = Math.round(rb * 0.12);
      const rl  = rb - ded;

      rows.push(
        { company_id: company.id, periodo, categoria: "receita_bruta",             valor: rb },
        { company_id: company.id, periodo, categoria: "deducoes",                  valor: ded },
        { company_id: company.id, periodo, categoria: "cmv",                       valor: Math.round(rl * 0.41) },
        { company_id: company.id, periodo, categoria: "despesas_comerciais",        valor: Math.round(rl * 0.06) },
        { company_id: company.id, periodo, categoria: "despesas_administrativas",   valor: Math.round(rl * 0.08) },
        { company_id: company.id, periodo, categoria: "despesas_pessoal",           valor: Math.round(rl * 0.13) },
        { company_id: company.id, periodo, categoria: "outras_despesas_op",         valor: Math.round(rl * 0.02) },
        { company_id: company.id, periodo, categoria: "depreciacao",                valor: Math.round(rl * 0.012) },
        { company_id: company.id, periodo, categoria: "resultado_financeiro",       valor: -Math.round(rl * 0.016) },
        { company_id: company.id, periodo, categoria: "ir_csll",                   valor: Math.round(rl * 0.022) },
      );

      // Fluxo de caixa
      const entradas = [
        { data: `${periodo.slice(0, 7)}-05`, tipo: "entrada", categoria: "operacional_recebimento", descricao: "Recebimentos de clientes",    valor: Math.round(rb * 0.92) },
        { data: `${periodo.slice(0, 7)}-20`, tipo: "entrada", categoria: "operacional_recebimento", descricao: "Recebimentos em atraso",       valor: Math.round(rb * 0.05) },
      ];
      const saidas = [
        { data: `${periodo.slice(0, 7)}-10`, tipo: "saida",   categoria: "operacional_pagamento",   descricao: "Pagamento de fornecedores",   valor: Math.round(rl * 0.41) },
        { data: `${periodo.slice(0, 7)}-15`, tipo: "saida",   categoria: "operacional_pagamento",   descricao: "Folha de pagamento",          valor: Math.round(rl * 0.13) },
        { data: `${periodo.slice(0, 7)}-20`, tipo: "saida",   categoria: "operacional_pagamento",   descricao: "Despesas operacionais",       valor: Math.round(rl * 0.16) },
        { data: `${periodo.slice(0, 7)}-28`, tipo: "saida",   categoria: "operacional_pagamento",   descricao: "Impostos e tributos",         valor: ded },
      ];

      for (const e of [...entradas, ...saidas]) {
        rows.push({ company_id: company.id, ...e, realizado: true });
      }
    }

    // Insere DRE
    const dreRows = rows.filter((r: any) => "categoria" in r && !r.tipo);
    const fluxoRows = rows.filter((r: any) => r.tipo);

    await supabase.from("dre_lancamentos").insert(dreRows);
    await supabase.from("fluxo_caixa").insert(fluxoRows);

    return company.id;
  }, []);

  return { seedDemo };
}
