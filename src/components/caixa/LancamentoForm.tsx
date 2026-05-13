import { useState } from "react";
import { X } from "lucide-react";
import type { NovoLancamento } from "../../hooks/useCaixaDiario";
import type { FluxoCategoria, FluxoCaixa } from "../../types";
import { maskMoney, parseMoney } from "../../lib/utils";

const CATEGORIAS_ENTRADA: { value: FluxoCategoria; label: string }[] = [
  { value: "operacional_recebimento", label: "Recebimento operacional" },
  { value: "financiamento_entrada",   label: "Entrada de financiamento" },
];

const CATEGORIAS_SAIDA: { value: FluxoCategoria; label: string }[] = [
  { value: "operacional_pagamento", label: "Pagamento operacional" },
  { value: "investimento",          label: "Investimento" },
  { value: "financiamento_saida",   label: "Saída de financiamento" },
];

const hoje = () => new Date().toISOString().slice(0, 10);

const CATEGORIA_LABEL: Record<FluxoCategoria, string> = {
  operacional_recebimento: "Recebimento operacional",
  operacional_pagamento:   "Pagamento operacional",
  investimento:            "Investimento",
  financiamento_entrada:   "Entrada de financiamento",
  financiamento_saida:     "Saída de financiamento",
};

interface Props {
  initialValues?: FluxoCaixa;
  onSave: (novo: NovoLancamento, repeticoes?: number) => Promise<void>;
  onClose: () => void;
}

export default function LancamentoForm({ initialValues, onSave, onClose }: Props) {
  const editing = !!initialValues;
  const [tipo, setTipo]           = useState<"entrada" | "saida">(initialValues?.tipo ?? "entrada");
  const [valor, setValor]         = useState(
    initialValues
      ? (initialValues.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ""
  );
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? "");
  const [data, setData]           = useState(initialValues?.data ?? hoje());
  const [categoria, setCategoria] = useState<FluxoCategoria>(initialValues?.categoria ?? "operacional_recebimento");
  const [realizado, setRealizado]     = useState(initialValues?.realizado ?? true);
  const [recorrencia, setRecorrencia] = useState<"mensal" | "semanal" | null>(null);
  const [repeticoes, setRepeticoes]   = useState(12);
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState<string | null>(null);

  function handleTipo(t: "entrada" | "saida") {
    setTipo(t);
    setCategoria(t === "entrada" ? "operacional_recebimento" : "operacional_pagamento");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseMoney(valor);
    if (!v || v <= 0) { setErro("Informe um valor válido."); return; }
    setSalvando(true);
    setErro(null);
    try {
      const descFinal = descricao.trim() || CATEGORIA_LABEL[categoria];
      const recorrenciaFinal = editing ? (initialValues?.recorrencia ?? null) : recorrencia;
      await onSave(
        { tipo, valor: v, descricao: descFinal, data, categoria, realizado, recorrencia: recorrenciaFinal },
        recorrenciaFinal && !editing ? repeticoes : undefined,
      );
      onClose();
    } catch (err: any) {
      setErro(err?.message ?? "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const cats = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-xl sm:rounded-xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base" style={{ color: "var(--text)", fontWeight: 400 }}>
            {editing ? "Editar lançamento" : "Novo lançamento"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(["entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTipo(t)}
                className="py-2.5 rounded text-sm font-medium transition-all"
                style={{
                  background: tipo === t
                    ? t === "entrada" ? "rgba(61,184,112,0.15)" : "rgba(212,88,80,0.12)"
                    : "var(--bg-card-2)",
                  color: tipo === t
                    ? t === "entrada" ? "var(--green)" : "var(--red)"
                    : "var(--text-3)",
                  border: `1px solid ${tipo === t
                    ? t === "entrada" ? "rgba(61,184,112,0.3)" : "rgba(212,88,80,0.3)"
                    : "var(--border)"}`,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {t === "entrada" ? "↑ Entrada" : "↓ Saída"}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Valor (R$)
            </label>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(maskMoney(e.target.value))}
              required
              className="w-full px-3 py-2.5 rounded text-sm"
              style={{
                background: "var(--bg-card-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "'Outfit', sans-serif",
                outline: "none",
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Pagamento fornecedor João"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2.5 rounded text-sm"
              style={{
                background: "var(--bg-card-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "'Outfit', sans-serif",
                outline: "none",
              }}
            />
          </div>

          {/* Data + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded text-sm"
                style={{
                  background: "var(--bg-card-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontFamily: "'Outfit', sans-serif",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as FluxoCategoria)}
                className="w-full px-3 py-2.5 rounded text-sm"
                style={{
                  background: "var(--bg-card-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontFamily: "'Outfit', sans-serif",
                  outline: "none",
                }}
              >
                {cats.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Status
            </span>
            <div className="flex gap-1">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setRealizado(v)}
                  className="px-3 py-1 rounded text-xs transition-all"
                  style={{
                    background: realizado === v ? "var(--gold-dim)" : "var(--bg-card-2)",
                    color: realizado === v ? "var(--gold)" : "var(--text-3)",
                    border: `1px solid ${realizado === v ? "rgba(200,145,42,0.3)" : "var(--border)"}`,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {v ? "Realizado" : "Previsto"}
                </button>
              ))}
            </div>
          </div>

          {/* Recorrência — somente em criação */}
          {!editing && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Recorrência
                </span>
              </div>
              <div className="flex gap-1">
                {([
                  { value: null,      label: "Não"     },
                  { value: "mensal",  label: "Mensal"  },
                  { value: "semanal", label: "Semanal" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setRecorrencia(value);
                      setRepeticoes(value === "semanal" ? 8 : 12);
                    }}
                    className="px-3 py-1 rounded text-xs transition-all"
                    style={{
                      background: recorrencia === value ? "var(--gold-dim)" : "var(--bg-card-2)",
                      color:      recorrencia === value ? "var(--gold)"     : "var(--text-3)",
                      border:     `1px solid ${recorrencia === value ? "rgba(200,145,42,0.3)" : "var(--border)"}`,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {recorrencia && (
                <div className="mt-2">
                  <label className="block text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    Repetir por
                  </label>
                  <select
                    value={repeticoes}
                    onChange={(e) => setRepeticoes(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded text-sm"
                    style={{
                      background: "var(--bg-card-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontFamily: "'Outfit', sans-serif",
                      outline: "none",
                    }}
                  >
                    {(recorrencia === "mensal"
                      ? [3, 6, 12, 24]
                      : [4, 8, 12, 24]
                    ).map(n => (
                      <option key={n} value={n}>
                        {n} {recorrencia === "mensal" ? "meses" : "semanas"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {erro && (
            <p className="text-xs" style={{ color: "var(--red)", fontFamily: "'Outfit', sans-serif" }}>{erro}</p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 rounded text-sm font-medium transition-opacity"
            style={{
              background: "var(--gold)",
              color: "#0a0a0a",
              fontFamily: "'Outfit', sans-serif",
              opacity: salvando ? 0.6 : 1,
            }}
          >
            {salvando ? "Salvando..." : editing ? "Salvar alterações" : "Salvar lançamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
