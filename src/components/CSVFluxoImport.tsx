import { useRef, useState } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatBRL } from "../lib/utils";

const FLUXO_COLS = [
  { key: "operacional_recebimento", tipo: "entrada" as const, label: "Recebimentos de clientes" },
  { key: "operacional_pagamento",   tipo: "saida"  as const, label: "Pagamentos operacionais" },
  { key: "investimento",            tipo: "saida"  as const, label: "Investimentos (saídas)" },
  { key: "financiamento_entrada",   tipo: "entrada" as const, label: "Entradas de financiamento" },
  { key: "financiamento_saida",     tipo: "saida"  as const, label: "Saídas de financiamento" },
] as const;

interface ParsedRow {
  periodo: string;
  [key: string]: string | number;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Arquivo CSV vazio ou inválido.");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  if (!headers.includes("periodo")) throw new Error("Coluna 'periodo' não encontrada.");
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: ParsedRow = { periodo: "" };
    headers.forEach((h, i) => {
      if (h === "periodo") {
        const raw = vals[i] ?? "";
        row.periodo = raw.length === 7 ? `${raw}-01` : raw;
      } else {
        row[h] = parseFloat(vals[i] ?? "0") || 0;
      }
    });
    return row;
  });
}

function downloadTemplate() {
  const header = ["periodo", ...FLUXO_COLS.map((c) => c.key)].join(",");
  const ex1 = ["2024-01", 100000, 75000, 15000, 0, 5000].join(",");
  const ex2 = ["2024-02", 105000, 78000, 0, 20000, 5000].join(",");
  const blob = new Blob([header + "\n" + ex1 + "\n" + ex2], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "finboard_fluxo_modelo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  companyId: string;
  onImported: () => void;
}

export default function CSVFluxoImport({ companyId, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<ParsedRow[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setImported(false);
    if (file.size > 1 * 1024 * 1024) { setError("Arquivo muito grande. Máximo: 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target?.result as string);
        if (rows.length === 0) throw new Error("Nenhuma linha de dados encontrada.");
        if (rows.some((r) => !r.periodo || r.periodo.length < 10))
          throw new Error("Formato de período inválido. Use YYYY-MM ou YYYY-MM-DD.");
        setPreview(rows);
      } catch (err: any) { setError(err.message); }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      for (const row of preview) {
        const ym = row.periodo.slice(0, 7);
        // Delete existing records for this month
        await supabase
          .from("fluxo_caixa")
          .delete()
          .eq("company_id", companyId)
          .gte("data", `${ym}-01`)
          .lte("data", `${ym}-31`);

        const rows = FLUXO_COLS
          .filter((col) => Number(row[col.key] ?? 0) !== 0)
          .map((col) => ({
            company_id: companyId,
            data: `${ym}-01`,
            tipo: col.tipo,
            categoria: col.key,
            descricao: col.label,
            valor: Number(row[col.key]),
            realizado: true,
          }));

        if (rows.length > 0) {
          const { error } = await supabase.from("fluxo_caixa").insert(rows);
          if (error) throw error;
        }
      }
      setImported(true);
      setPreview(null);
      setTimeout(() => onImported(), 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  if (imported) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: "var(--green)" }} />
        <p className="font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
          Fluxo de caixa importado com sucesso!
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Redirecionando para o painel...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Instructions */}
      <div
        className="p-4 rounded-md text-sm"
        style={{ background: "var(--gold-dim)", border: "1px solid rgba(200,145,42,0.2)", color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
      >
        <p className="font-medium mb-2" style={{ color: "var(--text)" }}>Colunas do CSV de Fluxo de Caixa:</p>
        <div className="flex flex-col gap-1">
          {FLUXO_COLS.map((c) => (
            <div key={c.key} className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  background: c.tipo === "entrada" ? "var(--green-dim)" : "var(--red-dim)",
                  color: c.tipo === "entrada" ? "var(--green)" : "var(--red)",
                }}
              >
                {c.tipo}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--text-3)" }}>{c.key}</span>
              <span className="text-xs" style={{ color: "var(--text-2)" }}>— {c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download template */}
      <button
        onClick={downloadTemplate}
        className="w-full flex items-center gap-3 p-4 rounded-md text-left transition-colors"
        style={{ border: "1px dashed var(--border)", background: "transparent" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.background = "var(--gold-dim)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Download className="w-5 h-5 flex-shrink-0" style={{ color: "var(--gold)" }} />
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Baixar modelo CSV — Fluxo de Caixa</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            finboard_fluxo_modelo.csv — inclui 2 meses de exemplo
          </p>
        </div>
      </button>

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="p-5 sm:p-8 rounded-md text-center cursor-pointer transition-colors"
        style={{ border: "1px dashed var(--border)", background: "transparent" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.background = "var(--gold-dim)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Upload className="w-7 h-7 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <p className="font-medium text-sm mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
          Clique para fazer upload do CSV de Fluxo de Caixa
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>Apenas arquivos .csv</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-md text-sm"
          style={{ background: "var(--red-dim)", border: "1px solid rgba(212,88,80,0.25)", color: "var(--red)", fontFamily: "'Outfit', sans-serif" }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Erro ao ler o arquivo</p>
            <p style={{ color: "var(--text-2)" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
              Pré-visualização — {preview.length} {preview.length === 1 ? "mês" : "meses"}
            </p>
            <button onClick={() => setPreview(null)} style={{ color: "var(--text-3)" }} className="hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-md" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full" style={{ fontSize: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
                  {["Período", "Recebimentos", "Pagamentos Op.", "Investimento", "Saldo estimado"].map((h, i) => (
                    <th key={h} className={i === 0 ? "text-left px-4 py-2" : "text-right px-3 py-2"}
                      style={{ color: "var(--text-3)", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const entradas = Number(row.operacional_recebimento ?? 0) + Number(row.financiamento_entrada ?? 0);
                  const saidas   = Number(row.operacional_pagamento ?? 0) + Number(row.investimento ?? 0) + Number(row.financiamento_saida ?? 0);
                  const saldo    = entradas - saidas;
                  return (
                    <tr key={row.periodo} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td className="px-4 py-2 font-medium" style={{ color: "var(--text)" }}>{row.periodo.slice(0, 7)}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--green)" }}>{formatBRL(Number(row.operacional_recebimento ?? 0))}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--red)" }}>{formatBRL(Number(row.operacional_pagamento ?? 0))}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--text-2)" }}>{formatBRL(Number(row.investimento ?? 0))}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: saldo >= 0 ? "var(--green)" : "var(--red)" }}>{formatBRL(saldo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="btn btn-gold w-full justify-center"
            style={{ opacity: importing ? 0.6 : 1 }}
          >
            {importing ? (
              <>
                <span className="w-4 h-4 rounded-full" style={{ border: "2px solid rgba(10,10,12,0.3)", borderTopColor: "var(--bg)", animation: "spin 0.8s linear infinite" }} />
                Importando...
              </>
            ) : (
              <><CheckCircle2 className="w-4 h-4" />Confirmar importação</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
