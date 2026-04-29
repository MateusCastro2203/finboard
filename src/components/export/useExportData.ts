import { useMemo } from "react";
import { formatPeriodo } from "../../lib/utils";
import type { DreCalculado, FluxoCaixa, Company } from "../../types";

export interface MonthlyFluxo {
  periodo: string;
  periodoRaw: string;
  entradas: number;
  saidas: number;
  fco: number;
  saldo_acumulado: number;
}

export interface ExportYTD {
  receita_liquida: number;
  lucro_bruto: number;
  ebitda: number;
  lucro_liquido: number;
  margem_bruta: number;
  margem_ebitda: number;
  margem_liquida: number;
}

export interface ExportData {
  last: DreCalculado | null;
  prev: DreCalculado | null;
  ytd: ExportYTD;
  monthly: MonthlyFluxo[];
  periodRange: string;
  generatedAt: string;
  totalEntradas: number;
  totalSaidas: number;
  geracao: number;
}

export function useExportData(
  dreData: DreCalculado[],
  fluxoData: FluxoCaixa[],
  _company: Company,
): ExportData {
  return useMemo(() => {
    const last = dreData[dreData.length - 1] ?? null;
    const prev = dreData.length >= 2 ? dreData[dreData.length - 2] : null;

    // YTD totals
    const ytdRL  = dreData.reduce((s, d) => s + d.receita_liquida, 0);
    const ytdLB  = dreData.reduce((s, d) => s + d.lucro_bruto, 0);
    const ytdEB  = dreData.reduce((s, d) => s + d.ebitda, 0);
    const ytdLL  = dreData.reduce((s, d) => s + d.lucro_liquido, 0);
    const ytd: ExportYTD = {
      receita_liquida: ytdRL,
      lucro_bruto:     ytdLB,
      ebitda:          ytdEB,
      lucro_liquido:   ytdLL,
      margem_bruta:    ytdRL > 0 ? ytdLB / ytdRL : 0,
      margem_ebitda:   ytdRL > 0 ? ytdEB / ytdRL : 0,
      margem_liquida:  ytdRL > 0 ? ytdLL / ytdRL : 0,
    };

    // Period range label
    const first = dreData[0];
    const periodRange = first && last
      ? `${formatPeriodo(first.periodo)} – ${formatPeriodo(last.periodo)}`
      : "—";

    // Monthly cash flow grouping
    const grouped = new Map<string, { entradas: number; saidas: number }>();
    for (const e of fluxoData) {
      const key = e.data.slice(0, 7);
      if (!grouped.has(key)) grouped.set(key, { entradas: 0, saidas: 0 });
      const g = grouped.get(key)!;
      if (e.tipo === "entrada") g.entradas += e.valor;
      else g.saidas += e.valor;
    }
    let saldo = 0;
    const monthly: MonthlyFluxo[] = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([raw, { entradas, saidas }]) => {
        const fco = entradas - saidas;
        saldo += fco;
        return { periodo: formatPeriodo(raw), periodoRaw: raw, entradas, saidas, fco, saldo_acumulado: saldo };
      });

    const totalEntradas = fluxoData.filter(e => e.tipo === "entrada").reduce((s, e) => s + e.valor, 0);
    const totalSaidas   = fluxoData.filter(e => e.tipo === "saida").reduce((s, e) => s + e.valor, 0);
    const geracao = totalEntradas - totalSaidas;

    const generatedAt = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    return { last, prev, ytd, monthly, periodRange, generatedAt, totalEntradas, totalSaidas, geracao };
  }, [dreData, fluxoData, _company]);
}
