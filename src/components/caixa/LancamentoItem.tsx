import { Trash2, Pencil, Circle, CheckCircle2 } from "lucide-react";
import type { FluxoCaixa } from "../../types";
import { formatBRL } from "../../lib/utils";

const CATEGORIA_LABEL: Record<string, string> = {
  operacional_recebimento: "Recebimento",
  operacional_pagamento:   "Pagamento",
  investimento:            "Investimento",
  financiamento_entrada:   "Financiamento +",
  financiamento_saida:     "Financiamento −",
};

interface Props {
  lancamento: FluxoCaixa;
  onEdit: (l: FluxoCaixa) => void;
  onDelete: (id: string) => void;
  onToggleRealizado: (id: string, realizado: boolean) => void;
}

export default function LancamentoItem({ lancamento, onEdit, onDelete, onToggleRealizado }: Props) {
  const isEntrada  = lancamento.tipo === "entrada";
  const realizado  = lancamento.realizado;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        opacity: realizado ? 1 : 0.7,
      }}
    >
      {/* Toggle realizado */}
      <button
        onClick={() => onToggleRealizado(lancamento.id, realizado)}
        className="flex-shrink-0 transition-opacity hover:opacity-60"
        title={realizado ? "Marcar como previsto" : "Marcar como realizado"}
        style={{ color: realizado ? "var(--gold)" : "var(--text-3)" }}
      >
        {realizado
          ? <CheckCircle2 className="w-4 h-4" />
          : <Circle className="w-4 h-4" />
        }
      </button>

      {/* Indicador de tipo */}
      <div
        className="w-1.5 h-8 rounded-full flex-shrink-0"
        style={{ background: isEntrada ? "var(--green)" : "var(--red)" }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
          {lancamento.descricao || CATEGORIA_LABEL[lancamento.categoria]}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          {CATEGORIA_LABEL[lancamento.categoria]}
          {!realizado && <span style={{ marginLeft: 4 }}>· previsto</span>}
        </p>
      </div>

      {/* Valor */}
      <span
        className="text-sm font-medium flex-shrink-0"
        style={{ color: isEntrada ? "var(--green)" : "var(--red)", fontFamily: "'Outfit', sans-serif" }}
      >
        {isEntrada ? "+" : "−"}{formatBRL(lancamento.valor)}
      </span>

      {/* Editar */}
      <button
        onClick={() => onEdit(lancamento)}
        className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-60"
        style={{ color: "var(--text-3)" }}
        title="Editar lançamento"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {/* Excluir */}
      <button
        onClick={() => onDelete(lancamento.id)}
        className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-60"
        style={{ color: "var(--text-3)" }}
        title="Excluir lançamento"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
