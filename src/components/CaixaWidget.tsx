import { useNavigate } from "react-router-dom";
import { Wallet, ArrowRight } from "lucide-react";
import { formatBRL } from "../lib/utils";
import type { FluxoCaixa } from "../types";

export default function CaixaWidget({ fluxoData }: { fluxoData: FluxoCaixa[] }) {
  const navigate = useNavigate();
  const mesAtual = new Date().toISOString().slice(0, 7);

  const doMes    = fluxoData.filter(l => l.data.startsWith(mesAtual) && l.realizado);
  const entradas = doMes.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const saidas   = doMes.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
  const saldo    = entradas - saidas;

  if (doMes.length === 0) return null;

  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <button
      onClick={() => navigate("/caixa")}
      className="w-full flex items-center justify-between px-4 py-3 rounded-md mb-4 text-left transition-opacity hover:opacity-75 no-print"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
        <div>
          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Caixa — {mes}
          </p>
          <p
            className="text-sm font-semibold mt-0.5"
            style={{ color: saldo >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'Outfit', sans-serif" }}
          >
            {formatBRL(saldo)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.75rem" }}>
        <span>{doMes.length} lançamentos</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}
