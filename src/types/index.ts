export type DreCategoria =
  | "receita_bruta"
  | "deducoes"
  | "cmv"
  | "despesas_comerciais"
  | "despesas_administrativas"
  | "despesas_pessoal"
  | "outras_despesas_op"
  | "depreciacao"
  | "resultado_financeiro"
  | "ir_csll";

export type FluxoCategoria =
  | "operacional_recebimento"
  | "operacional_pagamento"
  | "investimento"
  | "financiamento_entrada"
  | "financiamento_saida";

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  has_access: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  cnpj: string | null;
  segmento: string | null;
  moeda: string;
  created_at: string;
}

export interface DreLancamento {
  id: string;
  company_id: string;
  periodo: string;
  categoria: DreCategoria;
  descricao: string | null;
  valor: number;
}

export interface FluxoCaixa {
  id: string;
  company_id: string;
  data: string;
  tipo: "entrada" | "saida";
  categoria: FluxoCategoria;
  descricao: string;
  valor: number;
  realizado: boolean;
}

export interface DreCalculado {
  periodo: string;
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  cmv: number;
  lucro_bruto: number;
  despesas_comerciais: number;
  despesas_administrativas: number;
  despesas_pessoal: number;
  outras_despesas_op: number;
  ebitda: number;
  depreciacao: number;
  ebit: number;
  resultado_financeiro: number;
  lair: number;
  ir_csll: number;
  lucro_liquido: number;
  margem_bruta: number;
  margem_ebitda: number;
  margem_liquida: number;
}

export interface FluxoCalculado {
  periodo: string;
  saldo_inicial: number;
  entradas_operacionais: number;
  saidas_operacionais: number;
  fco: number;
  investimentos: number;
  financiamentos: number;
  variacao_caixa: number;
  saldo_final: number;
}
