import type { DreCalculado, FluxoCaixa, Company } from "../../../types";
import type { ExportData } from "../useExportData";

export interface TemplatePDFProps {
  dreData: DreCalculado[];
  fluxoData: FluxoCaixa[];
  company: Company;
  exportData: ExportData;
}

export const A4_WIDTH = 794;

export const BASE: React.CSSProperties = {
  width: A4_WIDTH,
  minHeight: 1123,
  background: "#fff",
  color: "#111",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 12,
  boxSizing: "border-box",
  padding: "48px 56px",
  position: "relative",
};

export const GOLD   = "#B8811E";
export const GREEN  = "#1E7A44";
export const RED    = "#B03028";
export const BLUE   = "#3A6EC8";
export const LIGHT  = "#F4F4F4";
export const BORDER = "#D0D0D0";
export const TEXT   = "#111111";
export const TEXT2  = "#444444";
export const TEXT3  = "#777777";

export function formatBRLPrint(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(v);
}

export function formatPctPrint(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function delta(cur: number, pre: number | undefined | null): number | null {
  if (!pre) return null;
  return ((cur - pre) / Math.abs(pre)) * 100;
}
