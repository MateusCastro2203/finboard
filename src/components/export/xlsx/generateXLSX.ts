/**
 * generateXLSX.ts — FinBoard Professional Excel Export
 *
 * Pré-requisito: npm install exceljs
 *
 * Por que ExcelJS em vez de SheetJS (xlsx)?
 *   SheetJS Community Edition não suporta estilos de célula (cores, negrito,
 *   bordas, alinhamento) — esses recursos exigem a versão paga. ExcelJS é
 *   open-source, tem suporte completo a cell styles e funciona em browsers
 *   via Buffer → Blob → download.
 *
 * Sheets geradas (ordem = aba ativa ao abrir):
 *   1. Dashboard      — KPI cards executivos + tabela YTD
 *   2. Resumo         — Empresa, indicadores e fluxo resumidos
 *   3. DRE Gerencial  — 16 linhas × todos os meses + YTD + margens
 *   4. Margens        — Evolução mensal + Média / Melhor / Pior
 *   5. Fluxo de Caixa — Movimentação mensal + linha de totais
 *
 * Estratégia de gráficos — ver bloco de comentário no final do arquivo.
 */

import type { Workbook, Worksheet, Cell, Row as XRow, Fill, Font } from "exceljs";
import type { DreCalculado, FluxoCaixa, Company } from "../../../types";
import type { MonthlyFluxo } from "../useExportData";
import { DRE_ROWS, type DreRowKey } from "../../../lib/dreRows";

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Paleta ARGB (Alpha + RGB, 8 hex chars)
// ═══════════════════════════════════════════════════════════════

const C = {
  white:         "FFFFFFFF",
  black:         "FF0A0A0C",

  // Header principal (azul carvão)
  hdrBg:         "FF1A1A2E",
  hdrFg:         "FFFFFFFF",

  // Brand gold
  goldBg:        "FFB8811E",
  goldBgLight:   "FFFDF3E3",
  goldFg:        "FFFFFFFF",
  goldText:      "FF9A6D15",
  goldAccent:    "FFD4A853",

  // Positivo / verde
  greenBg:       "FF1E7A44",
  greenBgLight:  "FFEDF9F0",
  greenFg:       "FFFFFFFF",
  greenText:     "FF1E7A44",

  // Negativo / vermelho
  redBg:         "FFB03028",
  redBgLight:    "FFFDF2F2",
  redFg:         "FFFFFFFF",
  redText:       "FFB03028",

  // Azul (EBITDA / margens / caixa)
  blueBg:        "FF3A6EC8",
  blueBgLight:   "FFEBF5FB",
  blueFg:        "FFFFFFFF",
  blueText:      "FF3A6EC8",

  // Subtotais DRE
  subtotalGold:  "FFFDF0DC",
  subtotalGreen: "FFEAFAF1",
  subtotalBlue:  "FFEBF5FB",

  // Neutros
  zebraOdd:      "FFF8F9FA",
  zebraEven:     "FFFFFFFF",
  border:        "FFD8D4CC",
  borderLight:   "FFEEECEA",
  mutedBg:       "FFEEECEC",
  mutedText:     "FF777777",
  dimText:       "FF444444",
} as const;

const F = "Calibri"; // fonte padrão

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type HeaderVariant = "primary" | "gold" | "green" | "blue" | "red" | "muted";
type ValueFormat   = "currency" | "percent";

// Chaves numéricas da DRE (exclui campos de metadata)
type DreNumericKey = DreRowKey | "margem_bruta" | "margem_ebitda" | "margem_liquida";

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function fmtPer(p: string): string {
  const [y, m] = p.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}

function formatCNPJ(v: string): string {
  const d = v.replace(/\D/g, "");
  if (d.length !== 14) return v;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

/** Soma acumulada (YTD) de uma chave numérica da DRE. */
function ytd(data: DreCalculado[], key: DreNumericKey): number {
  return data.reduce((s, d) => s + d[key], 0);
}

/** Delta percentual entre current e previous (null se não aplicável). */
function delta(cur: number, pre: number | undefined): number | null {
  if (pre === undefined || pre === 0) return null;
  return (cur - pre) / Math.abs(pre);
}

// ═══════════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Aplica estilo de cabeçalho a uma célula.
 * Cada variante tem fundo e texto específicos do design system.
 */
function applyHeaderStyle(cell: Cell, variant: HeaderVariant = "primary"): void {
  const MAP: Record<HeaderVariant, [bg: string, fg: string]> = {
    primary: [C.hdrBg,   C.hdrFg  ],
    gold:    [C.goldBg,  C.goldFg ],
    green:   [C.greenBg, C.greenFg],
    blue:    [C.blueBg,  C.blueFg ],
    red:     [C.redBg,   C.redFg  ],
    muted:   [C.mutedBg, C.mutedText],
  };
  const [bg, fg] = MAP[variant];
  cell.fill      = solid(bg);
  cell.font      = { name: F, bold: true, size: 10, color: { argb: fg } } as Font;
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cell.border    = { bottom: { style: "medium", color: { argb: C.goldAccent } } };
}

/**
 * Aplica formato de moeda (R$) e coloração condicional (verde/vermelho).
 * @param colorize false → texto neutro (útil em colunas com apenas valores)
 */
function applyCurrencyFormat(cell: Cell, value: number, colorize = true): void {
  cell.value     = value;
  cell.numFmt    = '"R$"\\ #,##0';
  cell.alignment = { horizontal: "right" };
  cell.font      = {
    name: F, size: 10,
    color: { argb: colorize ? (value >= 0 ? C.greenText : C.redText) : C.dimText },
  } as Font;
}

/**
 * Aplica formato percentual (0,0%) e coloração condicional.
 */
function applyPercentageFormat(cell: Cell, value: number, colorize = true): void {
  cell.value     = value;
  cell.numFmt    = "0.0%";
  cell.alignment = { horizontal: "right" };
  cell.font      = {
    name: F, size: 10,
    color: { argb: colorize ? (value >= 0 ? C.greenText : C.redText) : C.dimText },
  } as Font;
}

/**
 * Aplica zebra striping a todos os cells de uma linha até lastCol.
 * Não sobrescreve células com fill customizado (ex: subtotais).
 */
function applyZebraRow(row: XRow, isOdd: boolean, lastCol: number): void {
  const bg = isOdd ? C.zebraOdd : C.zebraEven;
  for (let c = 1; c <= lastCol; c++) {
    const cell = row.getCell(c);
    const existingFill = cell.fill as (Fill & { fgColor?: { argb?: string } }) | undefined;
    const hasCustomFill =
      existingFill?.type === "pattern" &&
      existingFill?.fgColor?.argb !== undefined &&
      existingFill.fgColor.argb !== C.white &&
      existingFill.fgColor.argb !== C.zebraEven;
    if (!hasCustomFill) {
      cell.fill = solid(bg);
    }
    cell.border = { bottom: { style: "hair", color: { argb: C.borderLight } } };
  }
}

/**
 * Estima e aplica largura de coluna baseada no comprimento do conteúdo.
 * ExcelJS não tem auto-size nativo — este helper percorre todas as células.
 */
function autoSizeColumns(ws: Worksheet, min = 8, max = 52): void {
  ws.columns.forEach((col) => {
    if (!col || typeof col.eachCell !== "function") return;
    let maxLen = min;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = cell.value != null ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 3, max);
  });
}

/**
 * Adiciona linha de título de seção (fundo muted, caixa alta).
 * Útil para separar blocos temáticos dentro de uma mesma sheet.
 */
function addSectionTitle(ws: Worksheet, text: string, lastCol: number): void {
  const row = ws.addRow([text.toUpperCase()]);
  if (lastCol > 1) ws.mergeCells(row.number, 1, row.number, lastCol);
  const cell = row.getCell(1);
  cell.fill      = solid(C.mutedBg);
  cell.font      = { name: F, bold: true, size: 9, color: { argb: C.mutedText } } as Font;
  cell.alignment = { horizontal: "left", indent: 1 };
  row.height     = 16;
}

/** Insere linha em branco. */
function addBlankRow(ws: Worksheet): void {
  ws.addRow([]);
}

/** Atalho para fill sólido (evita repetição de boilerplate). */
function solid(argb: string): Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } } as Fill;
}

// ═══════════════════════════════════════════════════════════════
// SHEET: Dashboard
// ═══════════════════════════════════════════════════════════════

function buildDashboard(
  wb: Workbook,
  dreData: DreCalculado[],
  company: Company,
  periodRange: string,
): void {
  const ws = wb.addWorksheet("Dashboard", {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: C.goldBg } },
  });

  // 7 colunas: [margem | card-esq ×3 | gap | card-dir ×3 | margem]
  ws.columns = [
    { width: 1.5 },
    { width: 21 }, { width: 21 }, { width: 21 },
    { width: 2 },
    { width: 21 }, { width: 21 }, { width: 21 },
    { width: 1.5 },
  ];

  const NC = 9;
  const last = dreData[dreData.length - 1];
  const prev = dreData[dreData.length - 2];
  const ytdRL = ytd(dreData, "receita_liquida");
  const ytdLB = ytd(dreData, "lucro_bruto");
  const ytdEB = ytd(dreData, "ebitda");
  const ytdLL = ytd(dreData, "lucro_liquido");

  // ── Título
  ws.mergeCells(1, 1, 1, NC);
  const titleCell = ws.getCell("A1");
  titleCell.value     = `FinBoard  ·  Painel Executivo  ·  ${company.name}`;
  titleCell.fill      = solid(C.hdrBg);
  titleCell.font      = { name: F, bold: true, size: 14, color: { argb: C.goldAccent } } as Font;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 40;

  // ── Subtítulo
  ws.mergeCells(2, 1, 2, NC);
  const sub = ws.getCell("A2");
  sub.value     = `Período: ${periodRange}  ·  Gerado em ${new Date().toLocaleDateString("pt-BR")}`;
  sub.fill      = solid(C.goldBgLight);
  sub.font      = { name: F, size: 9, italic: true, color: { argb: C.goldText } } as Font;
  sub.alignment = { horizontal: "center" };
  ws.getRow(2).height = 18;

  addBlankRow(ws);

  // Helper inline: renderiza um par de KPI cards lado a lado (3 rows por par)
  function addCardPair(
    leftTitle:  string, leftValue:  number, leftFmt:  ValueFormat, leftDelta:  number | null, leftVariant:  "gold" | "green" | "blue",
    rightTitle: string, rightValue: number, rightFmt: ValueFormat, rightDelta: number | null, rightVariant: "gold" | "green" | "blue",
  ): void {
    const colorMap = {
      gold:  { accent: C.goldBg,  light: C.goldBgLight,  text: C.goldText  },
      green: { accent: C.greenBg, light: C.greenBgLight, text: C.greenText },
      blue:  { accent: C.blueBg,  light: C.blueBgLight,  text: C.blueText  },
    } as const;

    // Linha 1: títulos
    const r1 = ws.addRow([]);
    ws.mergeCells(r1.number, 2, r1.number, 4);
    ws.mergeCells(r1.number, 6, r1.number, 8);

    function styleCardTitle(col: number, title: string, variant: "gold" | "green" | "blue") {
      const cell = r1.getCell(col);
      cell.value     = title.toUpperCase();
      cell.fill      = solid(colorMap[variant].accent);
      cell.font      = { name: F, bold: true, size: 9, color: { argb: C.white } } as Font;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    styleCardTitle(2, leftTitle, leftVariant);
    styleCardTitle(6, rightTitle, rightVariant);
    r1.height = 20;

    // Linha 2: valores
    const r2 = ws.addRow([]);
    ws.mergeCells(r2.number, 2, r2.number, 4);
    ws.mergeCells(r2.number, 6, r2.number, 8);

    function styleCardValue(col: number, value: number, fmt: ValueFormat, variant: "gold" | "green" | "blue") {
      const cell = r2.getCell(col);
      cell.value     = value;
      cell.numFmt    = fmt === "currency" ? '"R$"\\ #,##0' : "0.0%";
      cell.fill      = solid(colorMap[variant].light);
      cell.font      = { name: F, bold: false, size: 18, color: { argb: colorMap[variant].text } } as Font;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    styleCardValue(2, leftValue,  leftFmt,  leftVariant);
    styleCardValue(6, rightValue, rightFmt, rightVariant);
    r2.height = 32;

    // Linha 3: deltas
    const r3 = ws.addRow([]);
    ws.mergeCells(r3.number, 2, r3.number, 4);
    ws.mergeCells(r3.number, 6, r3.number, 8);

    function styleCardDelta(col: number, d: number | null, variant: "gold" | "green" | "blue") {
      const cell = r3.getCell(col);
      cell.fill = solid(colorMap[variant].light);
      if (d !== null) {
        const sign = d >= 0 ? "▲" : "▼";
        cell.value = `${sign} ${Math.abs(d * 100).toFixed(1)}%  vs mês anterior`;
        cell.font  = { name: F, size: 8.5, color: { argb: d >= 0 ? C.greenText : C.redText } } as Font;
      } else {
        cell.value = "—";
        cell.font  = { name: F, size: 8.5, color: { argb: C.mutedText } } as Font;
      }
      cell.alignment = { horizontal: "center" };
    }
    styleCardDelta(2, leftDelta,  leftVariant);
    styleCardDelta(6, rightDelta, rightVariant);
    r3.height = 18;

    addBlankRow(ws);
  }

  if (last) {
    addCardPair(
      "Receita Líquida", last.receita_liquida, "currency",
      delta(last.receita_liquida, prev?.receita_liquida), "gold",
      "EBITDA", last.ebitda, "currency",
      delta(last.ebitda, prev?.ebitda), "green",
    );
    addCardPair(
      "Lucro Líquido", last.lucro_liquido, "currency",
      delta(last.lucro_liquido, prev?.lucro_liquido), "blue",
      "Margem EBITDA", last.margem_ebitda, "percent",
      null, "green",
    );
  }

  // ── Tabela YTD
  addSectionTitle(ws, "Indicadores Acumulados (YTD) — Período completo", NC);

  const hRow = ws.addRow(["Indicador", null, null, null, null, "Último Período", null, "Acumulado YTD", null]);
  ws.mergeCells(hRow.number, 1, hRow.number, 5);
  ws.mergeCells(hRow.number, 6, hRow.number, 7);
  ws.mergeCells(hRow.number, 8, hRow.number, 9);
  applyHeaderStyle(ws.getCell(hRow.number, 1), "primary");
  applyHeaderStyle(ws.getCell(hRow.number, 6), "gold");
  applyHeaderStyle(ws.getCell(hRow.number, 8), "gold");
  hRow.height = 22;

  const ytdRows: Array<{ label: string; lastV: number; ytdV: number; fmt: ValueFormat }> = last ? [
    { label: "Receita Líquida",  lastV: last.receita_liquida, ytdV: ytdRL, fmt: "currency" },
    { label: "Lucro Bruto",      lastV: last.lucro_bruto,     ytdV: ytdLB, fmt: "currency" },
    { label: "EBITDA",           lastV: last.ebitda,          ytdV: ytdEB, fmt: "currency" },
    { label: "Lucro Líquido",    lastV: last.lucro_liquido,   ytdV: ytdLL, fmt: "currency" },
    { label: "Margem Bruta",     lastV: last.margem_bruta,    ytdV: ytdRL > 0 ? ytdLB / ytdRL : 0, fmt: "percent" },
    { label: "Margem EBITDA",    lastV: last.margem_ebitda,   ytdV: ytdRL > 0 ? ytdEB / ytdRL : 0, fmt: "percent" },
    { label: "Margem Líquida",   lastV: last.margem_liquida,  ytdV: ytdRL > 0 ? ytdLL / ytdRL : 0, fmt: "percent" },
  ] : [];

  ytdRows.forEach((r, i) => {
    const dr = ws.addRow([]);
    ws.mergeCells(dr.number, 1, dr.number, 5);
    ws.mergeCells(dr.number, 6, dr.number, 7);
    ws.mergeCells(dr.number, 8, dr.number, 9);

    const label = dr.getCell(1);
    label.value     = r.label;
    label.fill      = solid(i % 2 === 0 ? C.zebraOdd : C.zebraEven);
    label.font      = { name: F, size: 10, color: { argb: C.dimText } } as Font;
    label.alignment = { horizontal: "left", indent: 1 };

    const applyVal = (col: number, v: number) => {
      const cell = dr.getCell(col);
      cell.fill = solid(i % 2 === 0 ? C.zebraOdd : C.zebraEven);
      if (r.fmt === "currency") applyCurrencyFormat(cell, v, false);
      else applyPercentageFormat(cell, v);
    };
    applyVal(6, r.lastV);
    applyVal(8, r.ytdV);
    dr.height = 20;
  });

  // Footer
  addBlankRow(ws);
  const ft = ws.addRow([`FinBoard  ·  ${company.name}  ·  Documento Confidencial — Uso Interno`]);
  ws.mergeCells(ft.number, 1, ft.number, NC);
  ft.getCell(1).font      = { name: F, size: 8, italic: true, color: { argb: C.mutedText } } as Font;
  ft.getCell(1).alignment = { horizontal: "center" };
}

// ═══════════════════════════════════════════════════════════════
// SHEET: Resumo
// ═══════════════════════════════════════════════════════════════

function buildResumo(
  wb: Workbook,
  dreData: DreCalculado[],
  company: Company,
  totalE: number,
  totalS: number,
  periodRange: string,
): void {
  const ws = wb.addWorksheet("Resumo", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { tabColor: { argb: C.goldBg } },
  });

  ws.columns = [{ width: 30 }, { width: 22 }, { width: 22 }];

  const last  = dreData[dreData.length - 1];
  const ytdRL = ytd(dreData, "receita_liquida");
  const ytdLB = ytd(dreData, "lucro_bruto");
  const ytdEB = ytd(dreData, "ebitda");
  const ytdLL = ytd(dreData, "lucro_liquido");

  // ── Título
  ws.mergeCells("A1:C1");
  const title = ws.getCell("A1");
  title.value     = "FinBoard — Resumo Executivo";
  title.fill      = solid(C.hdrBg);
  title.font      = { name: F, bold: true, size: 13, color: { argb: C.goldAccent } } as Font;
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  // ── Info da empresa
  addBlankRow(ws);
  ([
    ["Empresa",   company.name],
    ["CNPJ",      company.cnpj ? formatCNPJ(company.cnpj) : "—"],
    ["Segmento",  company.segmento ?? "—"],
    ["Período",   periodRange],
    ["Gerado em", new Date().toLocaleDateString("pt-BR")],
  ] as [string, string][]).forEach(([label, value]) => {
    const r = ws.addRow([label, value]);
    r.getCell(1).font = { name: F, bold: true, size: 10, color: { argb: C.dimText } } as Font;
    r.getCell(2).font = { name: F, size: 10, color: { argb: C.black } } as Font;
    r.height = 18;
  });

  // ── KPIs monetários
  addBlankRow(ws);
  addSectionTitle(ws, "Indicadores Financeiros", 3);

  const kpiHeader = ws.addRow(["Indicador", "Último Período", "YTD (Acumulado)"]);
  kpiHeader.height = 22;
  for (let c = 1; c <= 3; c++) applyHeaderStyle(ws.getCell(kpiHeader.number, c), "primary");

  ([
    { label: "Receita Líquida",  lv: last?.receita_liquida ?? 0, ytdV: ytdRL },
    { label: "Lucro Bruto",      lv: last?.lucro_bruto     ?? 0, ytdV: ytdLB },
    { label: "EBITDA",           lv: last?.ebitda          ?? 0, ytdV: ytdEB },
    { label: "Lucro Líquido",    lv: last?.lucro_liquido   ?? 0, ytdV: ytdLL },
  ]).forEach(({ label, lv, ytdV }, i) => {
    const r = ws.addRow([label]);
    r.height = 22;
    applyZebraRow(r, i % 2 === 0, 3);
    r.getCell(1).font = { name: F, size: 10, color: { argb: C.dimText } } as Font;
    applyCurrencyFormat(r.getCell(2), lv, false);
    applyCurrencyFormat(r.getCell(3), ytdV, false);
  });

  // ── Margens
  addBlankRow(ws);
  addSectionTitle(ws, "Margens", 3);

  const mgHeader = ws.addRow(["Margem", "Último Período", "YTD"]);
  mgHeader.height = 22;
  for (let c = 1; c <= 3; c++) applyHeaderStyle(ws.getCell(mgHeader.number, c), "gold");

  ([
    { label: "Margem Bruta",   lv: last?.margem_bruta   ?? 0, ytdV: ytdRL > 0 ? ytdLB / ytdRL : 0 },
    { label: "Margem EBITDA",  lv: last?.margem_ebitda  ?? 0, ytdV: ytdRL > 0 ? ytdEB / ytdRL : 0 },
    { label: "Margem Líquida", lv: last?.margem_liquida ?? 0, ytdV: ytdRL > 0 ? ytdLL / ytdRL : 0 },
  ]).forEach(({ label, lv, ytdV }, i) => {
    const r = ws.addRow([label]);
    r.height = 22;
    applyZebraRow(r, i % 2 === 0, 3);
    r.getCell(1).font = { name: F, size: 10, color: { argb: C.dimText } } as Font;
    applyPercentageFormat(r.getCell(2), lv);
    applyPercentageFormat(r.getCell(3), ytdV);
  });

  // ── Fluxo de caixa resumo
  addBlankRow(ws);
  addSectionTitle(ws, "Fluxo de Caixa — Período Completo", 3);

  const fcHeader = ws.addRow(["Item", "Valor", null]);
  ws.mergeCells(fcHeader.number, 2, fcHeader.number, 3);
  fcHeader.height = 22;
  for (let c = 1; c <= 3; c++) applyHeaderStyle(ws.getCell(fcHeader.number, c), "green");

  ([
    { label: "Total Entradas",   value: totalE,          color: C.greenText },
    { label: "Total Saídas",     value: totalS,          color: C.redText   },
    { label: "Geração de Caixa", value: totalE - totalS, color: totalE >= totalS ? C.greenText : C.redText, bold: true },
  ]).forEach(({ label, value, color, bold }, i) => {
    const r = ws.addRow([label]);
    ws.mergeCells(r.number, 2, r.number, 3);
    r.height = 22;
    applyZebraRow(r, i % 2 === 0, 3);
    r.getCell(1).font = { name: F, size: 10, bold: bold ?? false, color: { argb: C.dimText } } as Font;
    const vc = r.getCell(2);
    vc.value     = value;
    vc.numFmt    = '"R$"\\ #,##0';
    vc.font      = { name: F, size: 10, bold: bold ?? false, color: { argb: color } } as Font;
    vc.alignment = { horizontal: "right" };
  });
}

// ═══════════════════════════════════════════════════════════════
// SHEET: DRE Gerencial
// ═══════════════════════════════════════════════════════════════

function buildDRE(wb: Workbook, dreData: DreCalculado[]): void {
  const ws = wb.addWorksheet("DRE Gerencial", {
    // Congelar coluna A (labels) e linha 1 (cabeçalho) simultaneamente
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
    properties: { tabColor: { argb: C.goldBg } },
  });

  const ytdRL = ytd(dreData, "receita_liquida");
  const ytdLB = ytd(dreData, "lucro_bruto");
  const ytdEB = ytd(dreData, "ebitda");
  const ytdLL = ytd(dreData, "lucro_liquido");
  const TOTAL = 1 + dreData.length + 1; // label + meses + YTD

  ws.columns = [
    { width: 36 },
    ...dreData.map(() => ({ width: 14 })),
    { width: 16 },  // YTD
  ];

  // ── Header
  const hRow = ws.addRow(["Linha DRE", ...dreData.map(d => fmtPer(d.periodo)), "YTD"]);
  hRow.height = 24;
  for (let c = 1; c < TOTAL; c++) applyHeaderStyle(ws.getCell(hRow.number, c), "primary");
  applyHeaderStyle(ws.getCell(hRow.number, TOTAL), "gold"); // YTD em gold

  // Estilos de subtotal por tipo
  const SUBTOTAL: Record<string, { bg: string; text: string }> = {
    gold:  { bg: C.subtotalGold,  text: C.goldText  },
    green: { bg: C.subtotalGreen, text: C.greenText },
    blue:  { bg: C.subtotalBlue,  text: C.blueText  },
  };

  // ── Linhas DRE
  DRE_ROWS.forEach((row, i) => {
    // DreRowKey é garantidamente keyof DreCalculado (campos numéricos)
    const vals  = dreData.map(d => d[row.key as DreRowKey]);
    const ytdV  = vals.reduce((s, v) => s + v, 0);
    const eRow  = ws.addRow([row.label, ...vals, ytdV]);
    eRow.height = row.bold ? 22 : 20;

    const st = row.subtotal as string | false;

    if (st && SUBTOTAL[st]) {
      const { bg, text } = SUBTOTAL[st];
      for (let c = 1; c <= TOTAL; c++) {
        const cell = eRow.getCell(c);
        cell.fill = solid(bg);
        const v   = cell.value as number;
        cell.font = {
          name: F, bold: true, size: 10,
          color: { argb: c === 1 ? text : v < 0 ? C.redText : text },
        } as Font;
        if (c > 1) { cell.numFmt = '"R$"\\ #,##0'; cell.alignment = { horizontal: "right" }; }
      }
    } else {
      applyZebraRow(eRow, i % 2 === 0, TOTAL);
      eRow.getCell(1).font = { name: F, size: 10, bold: row.bold, color: { argb: C.dimText } } as Font;
      for (let c = 2; c <= TOTAL; c++) {
        const cell = eRow.getCell(c);
        const v    = cell.value as number;
        cell.numFmt    = '"R$"\\ #,##0';
        cell.font      = { name: F, size: 10, bold: row.bold, color: { argb: v < 0 ? C.redText : C.dimText } } as Font;
        cell.alignment = { horizontal: "right" };
      }
    }

    // Indenta linhas que não são subtotais
    eRow.getCell(1).alignment = { horizontal: "left", indent: st ? 0 : 1 };
    // Coluna YTD sempre em negrito
    (eRow.getCell(TOTAL).font as Font).bold = true;
  });

  // ── Margens
  addBlankRow(ws);
  addSectionTitle(ws, "Margens", TOTAL);

  ([
    { label: "Margem Bruta",   vals: dreData.map(d => d.margem_bruta),   ytdV: ytdRL > 0 ? ytdLB / ytdRL : 0, text: C.goldText,  bg: C.subtotalGold  },
    { label: "Margem EBITDA",  vals: dreData.map(d => d.margem_ebitda),  ytdV: ytdRL > 0 ? ytdEB / ytdRL : 0, text: C.greenText, bg: C.subtotalGreen },
    { label: "Margem Líquida", vals: dreData.map(d => d.margem_liquida), ytdV: ytdRL > 0 ? ytdLL / ytdRL : 0, text: C.blueText,  bg: C.subtotalBlue  },
  ]).forEach((m, i) => {
    const mRow = ws.addRow([m.label, ...m.vals, m.ytdV]);
    mRow.height = 22;
    applyZebraRow(mRow, i % 2 === 0, TOTAL);
    mRow.getCell(1).font = { name: F, bold: true, size: 10, color: { argb: m.text } } as Font;
    mRow.getCell(1).alignment = { horizontal: "left" };
    for (let c = 2; c <= TOTAL; c++) {
      applyPercentageFormat(mRow.getCell(c), mRow.getCell(c).value as number);
    }
    (mRow.getCell(TOTAL).font as Font).bold = true;
  });

  // Instrução de gráfico — dados para chart manual
  addBlankRow(ws);
  addSectionTitle(ws,
    "↓ GRÁFICO SUGERIDO — selecione linha 'Receita Líquida' + linha 'EBITDA' e insira gráfico de linhas",
    TOTAL);
}

// ═══════════════════════════════════════════════════════════════
// SHEET: Margens
// ═══════════════════════════════════════════════════════════════

function buildMargens(wb: Workbook, dreData: DreCalculado[]): void {
  const ws = wb.addWorksheet("Margens", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
    properties: { tabColor: { argb: C.greenBg } },
  });

  const TOTAL = 1 + dreData.length + 3; // label + meses + Média/Melhor/Pior

  ws.columns = [
    { width: 22 },
    ...dreData.map(() => ({ width: 12 })),
    { width: 12 }, { width: 12 }, { width: 12 }, // Média, Melhor, Pior
  ];

  // ── Header
  const hRow = ws.addRow([
    "Margem", ...dreData.map(d => fmtPer(d.periodo)), "Média", "Melhor", "Pior",
  ]);
  hRow.height = 24;
  for (let c = 1; c <= TOTAL - 3; c++) applyHeaderStyle(ws.getCell(hRow.number, c), "primary");
  applyHeaderStyle(ws.getCell(hRow.number, TOTAL - 2), "muted");
  applyHeaderStyle(ws.getCell(hRow.number, TOTAL - 1), "green");
  applyHeaderStyle(ws.getCell(hRow.number, TOTAL),     "red");

  const margemDefs = [
    { label: "Margem Bruta",   key: "margem_bruta"   as const, color: C.goldText  },
    { label: "Margem EBITDA",  key: "margem_ebitda"  as const, color: C.greenText },
    { label: "Margem Líquida", key: "margem_liquida" as const, color: C.blueText  },
  ];

  margemDefs.forEach((m, i) => {
    const vals  = dreData.map(d => d[m.key]);
    const avg   = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const best  = Math.max(...vals);
    const worst = Math.min(...vals);

    const mRow  = ws.addRow([m.label, ...vals, avg, best, worst]);
    mRow.height = 24;

    // Label colorido
    mRow.getCell(1).font      = { name: F, bold: true, size: 10, color: { argb: m.color } } as Font;
    mRow.getCell(1).alignment = { horizontal: "left" };
    applyZebraRow(mRow, i % 2 === 0, 1); // zebra só na col label

    // Células de meses — formatação condicional por valor
    for (let c = 2; c <= dreData.length + 1; c++) {
      const val        = mRow.getCell(c).value as number;
      const isNeg      = val < 0;
      const isAboveAvg = val > avg;
      const bg = isNeg ? C.redBgLight : isAboveAvg ? C.greenBgLight : i % 2 === 0 ? C.zebraOdd : C.zebraEven;
      const fg = isNeg ? C.redText : m.color;

      mRow.getCell(c).fill      = solid(bg);
      mRow.getCell(c).numFmt    = "0.0%";
      mRow.getCell(c).font      = { name: F, size: 10, color: { argb: fg } } as Font;
      mRow.getCell(c).alignment = { horizontal: "center" };
    }

    // Colunas de estatística
    const applyStatCell = (col: number, val: number, textArgb: string) => {
      mRow.getCell(col).numFmt    = "0.0%";
      mRow.getCell(col).font      = { name: F, bold: true, size: 10, color: { argb: textArgb } } as Font;
      mRow.getCell(col).alignment = { horizontal: "center" };
      mRow.getCell(col).fill      = solid(i % 2 === 0 ? C.zebraOdd : C.zebraEven);
    };
    applyStatCell(TOTAL - 2, avg,  C.dimText);
    applyStatCell(TOTAL - 1, best, C.greenText);
    applyStatCell(TOTAL,     worst,C.redText);
  });

  // Instrução de gráfico
  addBlankRow(ws);
  addSectionTitle(ws,
    "↓ GRÁFICO SUGERIDO — selecione as 3 linhas de dados e insira gráfico de linhas para comparativo de margens",
    TOTAL);
}

// ═══════════════════════════════════════════════════════════════
// SHEET: Fluxo de Caixa
// ═══════════════════════════════════════════════════════════════

function buildFluxo(
  wb: Workbook,
  monthly: MonthlyFluxo[],
  totalE: number,
  totalS: number,
): void {
  const ws = wb.addWorksheet("Fluxo de Caixa", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { tabColor: { argb: C.greenBg } },
  });

  ws.columns = [
    { width: 14 }, { width: 20 }, { width: 20 }, { width: 16 }, { width: 22 },
  ];

  // ── Header
  const hRow = ws.addRow(["Período", "Entradas Op.", "Saídas Op.", "FCO", "Saldo Acumulado"]);
  hRow.height = 24;
  applyHeaderStyle(ws.getCell(hRow.number, 1), "primary");
  applyHeaderStyle(ws.getCell(hRow.number, 2), "green");
  applyHeaderStyle(ws.getCell(hRow.number, 3), "red");
  applyHeaderStyle(ws.getCell(hRow.number, 4), "gold");
  applyHeaderStyle(ws.getCell(hRow.number, 5), "blue");

  // ── Linhas mensais
  monthly.forEach((m, i) => {
    const r = ws.addRow([m.periodo, m.entradas, m.saidas, m.fco, m.saldo_acumulado]);
    r.height = 20;
    applyZebraRow(r, i % 2 === 0, 5);

    r.getCell(1).font      = { name: F, size: 10, color: { argb: C.dimText } } as Font;
    r.getCell(1).alignment = { horizontal: "center" };

    const styleVal = (col: number, v: number, argb: string, bold = false) => {
      r.getCell(col).value     = v;
      r.getCell(col).numFmt    = '"R$"\\ #,##0';
      r.getCell(col).font      = { name: F, size: 10, bold, color: { argb } } as Font;
      r.getCell(col).alignment = { horizontal: "right" };
    };

    styleVal(2, m.entradas,         C.greenText);
    styleVal(3, m.saidas,           C.redText);
    styleVal(4, m.fco,              m.fco >= 0 ? C.greenText : C.redText, true);
    styleVal(5, m.saldo_acumulado,  m.saldo_acumulado >= 0 ? C.blueText : C.redText);
  });

  // ── Linha de totais
  addBlankRow(ws);
  const totalRow = ws.addRow(["TOTAL", totalE, totalS, totalE - totalS, null]);
  totalRow.height = 26;
  for (let c = 1; c <= 5; c++) {
    totalRow.getCell(c).fill   = solid(C.hdrBg);
    totalRow.getCell(c).border = { top: { style: "medium", color: { argb: C.goldAccent } } };
  }

  totalRow.getCell(1).font      = { name: F, bold: true, size: 10, color: { argb: C.white } } as Font;
  totalRow.getCell(1).alignment = { horizontal: "left", indent: 1 };

  ([
    [2, totalE,          C.greenText],
    [3, totalS,          C.redText  ],
    [4, totalE - totalS, totalE >= totalS ? C.greenText : C.redText],
  ] as [number, number, string][]).forEach(([c, v, color]) => {
    totalRow.getCell(c).value     = v;
    totalRow.getCell(c).numFmt    = '"R$"\\ #,##0';
    totalRow.getCell(c).font      = { name: F, bold: true, size: 10, color: { argb: color } } as Font;
    totalRow.getCell(c).alignment = { horizontal: "right" };
  });

  // Instrução de gráfico
  addBlankRow(ws);
  addSectionTitle(ws,
    "↓ GRÁFICO SUGERIDO — selecione a coluna 'Saldo Acumulado' e insira gráfico de área",
    5);
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function generateXLSX(
  dreData: DreCalculado[],
  fluxoData: FluxoCaixa[],
  company: Company,
  monthly: MonthlyFluxo[],
): Promise<void> {
  // Dynamic import para code-splitting — carrega ExcelJS só quando necessário
  const { Workbook } = await import("exceljs");
  const wb: Workbook = new Workbook();

  wb.creator        = "FinBoard";
  wb.lastModifiedBy = "FinBoard";
  wb.created        = new Date();
  wb.modified       = new Date();

  const periodRange = dreData.length
    ? `${fmtPer(dreData[0].periodo)} – ${fmtPer(dreData[dreData.length - 1].periodo)}`
    : "—";
  const totalE = fluxoData.filter(f => f.tipo === "entrada").reduce((s, f) => s + f.valor, 0);
  const totalS = fluxoData.filter(f => f.tipo === "saida" ).reduce((s, f) => s + f.valor, 0);

  // Ordem das sheets = ordem das abas; Dashboard = ativa ao abrir
  buildDashboard(wb, dreData, company, periodRange);
  buildResumo(wb, dreData, company, totalE, totalS, periodRange);
  buildDRE(wb, dreData);
  buildMargens(wb, dreData);
  buildFluxo(wb, monthly, totalE, totalS);

  // auto-size após todas as sheets serem populadas
  wb.worksheets.forEach(ws => autoSizeColumns(ws));

  // Download via Blob (browser-safe — não usa fs.writeFile)
  const buffer   = await wb.xlsx.writeBuffer();
  const blob     = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement("a"), {
    href:     url,
    download: `FinBoard_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/*
 * ═══════════════════════════════════════════════════════════════
 * ESTRATÉGIA DE GRÁFICOS
 * ═══════════════════════════════════════════════════════════════
 *
 * Por que não há gráficos embutidos no .xlsx gerado?
 *
 *   ExcelJS suporta a API de gráficos mas ela é experimental em
 *   contextos browser (sem Node.js). Gráficos em .xlsx são objetos
 *   DrawingML/ChartML que exigem referências a múltiplos arquivos
 *   internos do pacote OOXML — a serialização em browser é instável.
 *
 * O que está disponível agora:
 *   ✓ Cada sheet tem uma linha de instrução indicando o range ideal
 *   ✓ Os dados estão estruturados em tabelas prontas para chart manual
 *   ✓ O usuário seleciona o range → Insert → Chart no Excel/Sheets
 *
 * Para gráficos 100% automáticos, 3 caminhos:
 *
 *   1. SERVER-SIDE via Supabase Edge Function (mais robusto)
 *      Mova generateXLSX para uma Edge Function em Node.js.
 *      ExcelJS no Node tem suporte estável a gráficos:
 *        const chart = wb.addChart({ type: 'line', ... });
 *        ws.addChart(chart, 'B2:K20');
 *
 *   2. IMAGEM PNG do gráfico (funciona em browser)
 *      Exporte o gráfico como PNG via Chart.js ou Recharts canvas,
 *      depois insira no Excel:
 *        const imageId = wb.addImage({ base64: pngBase64, extension: 'png' });
 *        ws.addImage(imageId, 'B2:K18');
 *      Funciona em browser mas o "gráfico" será uma imagem estática.
 *
 *   3. XLSX-POPULATE (alternativa para templates)
 *      Crie um .xlsx template com gráficos no Excel,
 *      depois use xlsx-populate para substituir os dados.
 *      O gráfico atualiza automaticamente ao abrir o arquivo.
 *
 * Gráficos mapeados por sheet:
 *   Dashboard      → Barras agrupadas: Receita / EBITDA / Lucro Líquido
 *   DRE Gerencial  → Linha dupla: Receita Líquida + EBITDA × meses
 *   Margens        → Linhas múltiplas: Bruta / EBITDA / Líquida × meses
 *   Fluxo de Caixa → Área: Saldo Acumulado ao longo do período
 * ═══════════════════════════════════════════════════════════════
 */
