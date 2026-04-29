import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DreCalculado, DreLancamento } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                  "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

export function calcularDre(lancamentos: DreLancamento[]): DreCalculado[] {
  const byPeriodo = new Map<string, Partial<Record<string, number>>>();

  for (const l of lancamentos) {
    const key = l.periodo.slice(0, 7); // YYYY-MM
    if (!byPeriodo.has(key)) byPeriodo.set(key, {});
    const entry = byPeriodo.get(key)!;
    entry[l.categoria] = (entry[l.categoria] ?? 0) + Math.abs(l.valor);
  }

  return Array.from(byPeriodo.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, v]) => {
      const receita_bruta = v.receita_bruta ?? 0;
      const deducoes = v.deducoes ?? 0;
      const receita_liquida = receita_bruta - deducoes;
      const cmv = v.cmv ?? 0;
      const lucro_bruto = receita_liquida - cmv;
      const despesas_comerciais = v.despesas_comerciais ?? 0;
      const despesas_administrativas = v.despesas_administrativas ?? 0;
      const despesas_pessoal = v.despesas_pessoal ?? 0;
      const outras_despesas_op = v.outras_despesas_op ?? 0;
      const ebitda = lucro_bruto - despesas_comerciais - despesas_administrativas
                     - despesas_pessoal - outras_despesas_op;
      const depreciacao = v.depreciacao ?? 0;
      const ebit = ebitda - depreciacao;
      const resultado_financeiro = v.resultado_financeiro ?? 0;
      const lair = ebit + resultado_financeiro;
      const ir_csll = v.ir_csll ?? 0;
      const lucro_liquido = lair - ir_csll;

      return {
        periodo,
        receita_bruta,
        deducoes,
        receita_liquida,
        cmv,
        lucro_bruto,
        despesas_comerciais,
        despesas_administrativas,
        despesas_pessoal,
        outras_despesas_op,
        ebitda,
        depreciacao,
        ebit,
        resultado_financeiro,
        lair,
        ir_csll,
        lucro_liquido,
        margem_bruta: receita_liquida > 0 ? lucro_bruto / receita_liquida : 0,
        margem_ebitda: receita_liquida > 0 ? ebitda / receita_liquida : 0,
        margem_liquida: receita_liquida > 0 ? lucro_liquido / receita_liquida : 0,
      };
    });
}
