import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatBRL } from "../lib/utils";
import type { FluxoCategoria } from "../types";

interface OFXTransaction {
  data: string;
  valor: number;
  tipo: "entrada" | "saida";
  descricao: string;
  categoria: FluxoCategoria;
}

const CATEGORIA_LABELS: Record<FluxoCategoria, string> = {
  operacional_recebimento: "Recebimento Operacional",
  operacional_pagamento:   "Pagamento Operacional",
  investimento:            "Investimento",
  financiamento_entrada:   "Financiamento (entrada)",
  financiamento_saida:     "Financiamento (saída)",
};

function inferirCategoria(memo: string, valor: number): FluxoCategoria {
  const m = memo.toLowerCase();
  if (m.includes("salario") || m.includes("folha") || m.includes("pgto func") || m.includes("rescisao")) return "operacional_pagamento";
  if (m.includes("fornec") || m.includes("nf ") || m.includes("nota fiscal")) return "operacional_pagamento";
  if (m.includes("emprestimo") || m.includes("financ") || m.includes("ccb") || m.includes("cdc")) return valor > 0 ? "financiamento_entrada" : "financiamento_saida";
  if (m.includes("aplicacao") || m.includes("invest") || m.includes("ativo fixo") || m.includes("imobilizado")) return "investimento";
  if (m.includes("resgate")) return "financiamento_entrada";
  return valor >= 0 ? "operacional_recebimento" : "operacional_pagamento";
}

function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  // Support both XML-style OFX (<TAG>value</TAG>) and SGML-style (TAG:value\n)
  const xmlBlocks = content.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) ?? [];
  const sgmlBlocks = content.match(/STMTTRN\b([\s\S]*?)END:STMTTRN/gi) ?? [];
  const blocks = [...xmlBlocks, ...sgmlBlocks];

  for (const block of blocks) {
    const getXml = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\n\r]+)`, "i"));
      return m?.[1]?.trim() ?? "";
    };
    const getSgml = (tag: string) => {
      const m = block.match(new RegExp(`^${tag}:?\\s*(.+)`, "im"));
      return m?.[1]?.trim() ?? "";
    };
    const get = (tag: string) => getXml(tag) || getSgml(tag);

    const dtPosted = get("DTPOSTED");
    const trnAmt   = get("TRNAMT");
    const memo     = get("MEMO") || get("NAME") || get("FITID");

    if (!dtPosted || !trnAmt) continue;

    const rawDate = dtPosted.slice(0, 8);
    if (rawDate.length < 8) continue;
    const data = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const valor = parseFloat(trnAmt.replace(",", "."));
    if (isNaN(valor)) continue;

    transactions.push({
      data,
      valor:     Math.abs(valor),
      tipo:      valor >= 0 ? "entrada" : "saida",
      descricao: memo || "Sem descrição",
      categoria: inferirCategoria(memo, valor),
    });
  }

  return transactions;
}

interface Props {
  companyId: string;
  onImported: () => void;
}

export default function OFXImport({ companyId, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<OFXTransaction[] | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported,  setImported]  = useState(false);

  function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setImported(false);
    if (file.size > 5 * 1024 * 1024) { setError("Arquivo muito grande. Máximo: 5 MB."); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const txns = parseOFX(content);
        if (txns.length === 0) throw new Error("Nenhuma transação encontrada. Verifique se o arquivo é um extrato OFX válido.");
        setPreview(txns);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file, "latin1");
  }

  function updateCategoria(idx: number, cat: FluxoCategoria) {
    setPreview(prev => prev ? prev.map((t, i) => i === idx ? { ...t, categoria: cat } : t) : prev);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      const rows = preview.map(t => ({
        company_id: companyId,
        data:       t.data,
        tipo:       t.tipo,
        categoria:  t.categoria,
        descricao:  t.descricao.slice(0, 255),
        valor:      t.valor,
        realizado:  true,
      }));

      const { error } = await supabase.from("fluxo_caixa").insert(rows);
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
        <p className="font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
          Extrato importado com sucesso!
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Redirecionando para o painel...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 rounded-md text-sm" style={{ background: "var(--gold-dim)", border: "1px solid rgba(200,145,42,0.2)", color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
        <p className="font-medium mb-2" style={{ color: "var(--text)" }}>Importação de extrato OFX bancário:</p>
        <ol className="flex flex-col gap-1 list-decimal list-inside" style={{ color: "var(--text-2)" }}>
          <li>Exporte o extrato da sua conta bancária no formato OFX (disponível em todos os bancos)</li>
          <li>Faça upload do arquivo abaixo</li>
          <li>Revise e ajuste as categorias se necessário</li>
          <li>Confirme a importação para o Fluxo de Caixa</li>
        </ol>
      </div>

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
          Clique para fazer upload do extrato OFX
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Arquivos .ofx exportados pelo seu banco
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.OFX"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-md text-sm" style={{ background: "var(--red-dim)", border: "1px solid rgba(212,88,80,0.25)", color: "var(--red)", fontFamily: "'Outfit', sans-serif" }}>
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
              {preview.length} transações encontradas — revise as categorias
            </p>
            <button onClick={() => setPreview(null)} style={{ color: "var(--text-3)" }} className="hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-md" style={{ border: "1px solid var(--border)", maxHeight: 360, overflowY: "auto" }}>
            <table className="w-full" style={{ fontSize: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr style={{ background: "var(--bg-card-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Data", "Descrição", "Valor", "Tipo", "Categoria"].map((h, i) => (
                    <th key={h} className={i === 0 || i === 1 ? "text-left px-3 py-2" : "text-right px-3 py-2"} style={{ color: "var(--text-3)", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td className="px-3 py-1.5 font-mono-data" style={{ color: "var(--text-2)", whiteSpace: "nowrap" }}>{t.data.slice(0, 10)}</td>
                    <td className="px-3 py-1.5" style={{ color: "var(--text-2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.descricao}>{t.descricao}</td>
                    <td className="text-right px-3 py-1.5 font-mono-data" style={{ color: t.tipo === "entrada" ? "var(--green)" : "var(--red)", whiteSpace: "nowrap" }}>
                      {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                    </td>
                    <td className="text-right px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: t.tipo === "entrada" ? "var(--green-dim)" : "var(--red-dim)", color: t.tipo === "entrada" ? "var(--green)" : "var(--red)" }}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={t.categoria}
                        onChange={(e) => updateCategoria(idx, e.target.value as FluxoCategoria)}
                        style={{ fontSize: "0.72rem", padding: "2px 4px", borderRadius: 3, border: "1px solid var(--border)", background: "var(--bg-card-2)", color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
                      >
                        {(Object.entries(CATEGORIA_LABELS) as [FluxoCategoria, string][]).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
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
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar importação ({preview.length} transações)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
