import type { DreCalculado } from "../types";
import { formatPercent, formatBRL } from "./utils";

export interface HealthScore {
  score: number;
  label: "Saudável" | "Atenção" | "Risco" | "Crítico";
  color: "green" | "gold" | "orange" | "red";
  pillars: { name: string; score: number; max: number }[];
  insights: string[];
}

function pillarRentabilidade(margem: number): number {
  if (margem >= 0.15) return 25;
  if (margem >= 0.08) return 18;
  if (margem >= 0.03) return 10;
  if (margem >= 0)    return 4;
  return 0;
}

function pillarEficiencia(margem: number): number {
  if (margem >= 0.20) return 25;
  if (margem >= 0.10) return 18;
  if (margem >= 0.05) return 10;
  if (margem >= 0)    return 4;
  return 0;
}

function pillarCrescimento(data: DreCalculado[]): number {
  if (data.length < 2) return 12; // neutro sem histórico
  const ultimos = data.slice(-3);
  if (ultimos.length === 1) return 12;

  const tendencias = ultimos.slice(1).map((d, i) =>
    d.receita_liquida >= ultimos[i].receita_liquida * 0.95
  );
  const crescendo = tendencias.every(Boolean);
  const caindoSeguido = tendencias.every(v => !v);

  if (crescendo) return 25;
  if (caindoSeguido) return 3;
  return 12;
}

function pillarResultado(lucro: number): number {
  if (lucro > 0)  return 25;
  if (lucro === 0) return 10;
  return 0;
}

function gerarInsights(data: DreCalculado[]): string[] {
  if (data.length === 0) return [];
  const insights: string[] = [];
  const last = data[data.length - 1];
  const prev = data.length >= 2 ? data[data.length - 2] : null;

  // Margem líquida
  if (prev && last.receita_liquida > 0 && prev.receita_liquida > 0) {
    const delta = (last.margem_liquida - prev.margem_liquida) * 100;
    if (Math.abs(delta) >= 2) {
      insights.push(
        delta > 0
          ? `Margem líquida subiu ${delta.toFixed(1)} p.p. em relação ao mês anterior — de ${formatPercent(prev.margem_liquida)} para ${formatPercent(last.margem_liquida)}.`
          : `Margem líquida caiu ${Math.abs(delta).toFixed(1)} p.p. em relação ao mês anterior — de ${formatPercent(prev.margem_liquida)} para ${formatPercent(last.margem_liquida)}.`
      );
    }
  }

  // Tendência de margem EBITDA em 3 meses consecutivos
  if (data.length >= 3 && !insights.some(i => i.includes("margem"))) {
    const [a, b, c] = data.slice(-3);
    if (a.margem_ebitda > b.margem_ebitda && b.margem_ebitda > c.margem_ebitda) {
      const queda = (a.margem_ebitda - c.margem_ebitda) * 100;
      insights.push(
        `Margem EBITDA em queda pelo 3º mês consecutivo (−${queda.toFixed(1)} p.p. no período). Revise custos operacionais.`
      );
    } else if (a.margem_ebitda < b.margem_ebitda && b.margem_ebitda < c.margem_ebitda) {
      insights.push(
        `Margem EBITDA em alta pelo 3º mês consecutivo — tendência positiva de eficiência operacional.`
      );
    }
  }

  // Receita
  if (prev && prev.receita_liquida > 0) {
    const varReceita = (last.receita_liquida - prev.receita_liquida) / prev.receita_liquida * 100;
    if (varReceita <= -10) {
      insights.push(
        `Receita líquida caiu ${Math.abs(varReceita).toFixed(1)}% no último mês (${formatBRL(last.receita_liquida)} vs ${formatBRL(prev.receita_liquida)}).`
      );
    } else if (varReceita >= 10) {
      insights.push(
        `Receita líquida cresceu ${varReceita.toFixed(1)}% no último mês (${formatBRL(last.receita_liquida)} vs ${formatBRL(prev.receita_liquida)}).`
      );
    }
  }

  // CMV alto
  if (last.receita_liquida > 0) {
    const cmvPct = last.cmv / last.receita_liquida;
    if (cmvPct > 0.60) {
      insights.push(
        `CMV representa ${formatPercent(cmvPct)} da receita líquida — acima de 60%. Revise custos de produto ou precificação.`
      );
    }
  }

  // Resultado negativo
  if (last.lucro_liquido < 0) {
    insights.push(
      `Resultado líquido negativo no último mês: ${formatBRL(last.lucro_liquido)}. A empresa operou com prejuízo.`
    );
  }

  return insights.slice(0, 3);
}

export function calcularHealthScore(data: DreCalculado[]): HealthScore | null {
  if (data.length === 0) return null;
  const last = data[data.length - 1];

  const p1 = pillarRentabilidade(last.margem_liquida);
  const p2 = pillarEficiencia(last.margem_ebitda);
  const p3 = pillarCrescimento(data);
  const p4 = pillarResultado(last.lucro_liquido);
  const score = p1 + p2 + p3 + p4;

  let label: HealthScore["label"];
  let color: HealthScore["color"];
  if (score >= 75)      { label = "Saudável"; color = "green"; }
  else if (score >= 50) { label = "Atenção";  color = "gold"; }
  else if (score >= 25) { label = "Risco";    color = "orange"; }
  else                  { label = "Crítico";  color = "red"; }

  return {
    score,
    label,
    color,
    pillars: [
      { name: "Rentabilidade",  score: p1, max: 25 },
      { name: "Eficiência op.", score: p2, max: 25 },
      { name: "Crescimento",    score: p3, max: 25 },
      { name: "Resultado",      score: p4, max: 25 },
    ],
    insights: gerarInsights(data),
  };
}
