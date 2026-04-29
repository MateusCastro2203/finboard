import { useRef, useState } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatBRL } from "../lib/utils";

const CATEGORIAS = [
  "receita_bruta", "deducoes", "cmv", "despesas_comerciais",
  "despesas_administrativas", "despesas_pessoal", "outras_despesas_op",
  "depreciacao", "resultado_financeiro", "ir_csll",
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
    const values = line.split(",").map((v) => v.trim());
    const row: ParsedRow = { periodo: "" };
    headers.forEach((h, i) => {
      if (h === "periodo") {
        const raw = values[i] ?? "";
        row.periodo = raw.length === 7 ? `${raw}-01` : raw;
      } else {
        row[h] = parseFloat(values[i] ?? "0") || 0;
      }
    });
    return row;
  });
}

function downloadTemplate() {
  const header = ["periodo", ...CATEGORIAS].join(",");
  const example  = ["2024-01", 850000, 110500, 323300, 59500, 76500, 102000, 17000, 12750, -15300, 21250].join(",");
  const example2 = ["2024-02", 870000, 113100, 330600, 60900, 78300, 104400, 17400, 13050, -15660, 21750].join(",");
  const blob = new Blob([header + "\n" + example + "\n" + example2], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "finboard_modelo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  companyId: string;
  onImported: () => void;
}

export default function CSVImport({ companyId, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setImported(false);
    if (file.size > 1 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho máximo: 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target?.result as string);
        if (rows.length === 0) throw new Error("Nenhuma linha de dados encontrada.");
        if (rows.some((r) => !r.periodo || r.periodo.length < 10)) {
          throw new Error("Formato de período inválido. Use YYYY-MM ou YYYY-MM-DD.");
        }
        setPreview(rows);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError(null);

    try {
      const rows: object[] = [];
      for (const row of preview) {
        for (const cat of CATEGORIAS) {
          const val = Number(row[cat] ?? 0);
          if (val === 0) continue;
          rows.push({ company_id: companyId, periodo: row.periodo, categoria: cat, valor: val });
        }
      }

      const { error } = await supabase
        .from("dre_lancamentos")
        .upsert(rows, { onConflict: "company_id,periodo,categoria" });

      if (error) throw error;

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
        <p
          className="font-medium"
          style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
        >
          Dados importados com sucesso!
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
        style={{
          background: "var(--gold-dim)",
          border: "1px solid rgba(200,145,42,0.2)",
          color: "var(--text-2)",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <p className="font-medium mb-2" style={{ color: "var(--text)" }}>Como funciona a importação:</p>
        <ol className="flex flex-col gap-1 list-decimal list-inside" style={{ color: "var(--text-2)" }}>
          <li>Baixe o modelo CSV abaixo</li>
          <li>Preencha com os dados da sua empresa (ou peça para o seu contador)</li>
          <li>Faça upload do arquivo preenchido</li>
          <li>Confirme a importação — seus dados aparecem instantaneamente</li>
        </ol>
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
          <p className="font-medium text-sm" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>Baixar modelo CSV</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            finboard_modelo.csv — inclui 2 meses de exemplo
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
          Clique para fazer upload do CSV preenchido
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Apenas arquivos .csv
        </p>
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
            <p
              className="font-medium text-sm"
              style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
            >
              Pré-visualização — {preview.length} {preview.length === 1 ? "mês" : "meses"}
            </p>
            <button
              onClick={() => setPreview(null)}
              style={{ color: "var(--text-3)" }}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="overflow-x-auto rounded-md"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="w-full" style={{ fontSize: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
                  {["Período", "Receita Bruta", "CMV", "Total Despesas", "IR/CSLL"].map((h, i) => (
                    <th
                      key={h}
                      className={i === 0 ? "text-left px-4 py-2" : "text-right px-3 py-2"}
                      style={{ color: "var(--text-3)", fontWeight: 500 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const totalDesp = (Number(row.despesas_comerciais) + Number(row.despesas_administrativas)
                    + Number(row.despesas_pessoal) + Number(row.outras_despesas_op));
                  return (
                    <tr key={row.periodo} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td className="px-4 py-2 font-medium" style={{ color: "var(--text)" }}>{row.periodo.slice(0, 7)}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--text-2)" }}>{formatBRL(Number(row.receita_bruta))}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--text-2)" }}>{formatBRL(Number(row.cmv))}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--text-2)" }}>{formatBRL(totalDesp)}</td>
                      <td className="text-right px-3 py-2 font-mono-data" style={{ color: "var(--text-2)" }}>{formatBRL(Number(row.ir_csll))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Todos os cálculos (Lucro Bruto, EBITDA, Margens) serão feitos automaticamente após a importação.
          </p>

          <button
            onClick={handleImport}
            disabled={importing}
            className="btn btn-gold w-full justify-center"
            style={{ opacity: importing ? 0.6 : 1 }}
          >
            {importing ? (
              <>
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ border: "2px solid rgba(10,10,12,0.3)", borderTopColor: "var(--bg)", animation: "spin 0.8s linear infinite" }}
                />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar importação
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
