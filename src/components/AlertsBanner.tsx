import { useState } from "react";
import { AlertTriangle, TrendingDown, X, CheckCircle } from "lucide-react";
import type { DreCalculado } from "../types";
import { formatPercent, formatBRL } from "../lib/utils";

interface Alert {
  id: string;
  level: "danger" | "warning" | "ok";
  message: string;
}

function computeAlerts(data: DreCalculado[]): Alert[] {
  if (data.length < 2) return [];
  const alerts: Alert[] = [];
  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  // EBITDA negativo
  if (last.ebitda < 0) {
    alerts.push({
      id: "ebitda-negativo",
      level: "danger",
      message: `EBITDA negativo no último mês (${formatBRL(last.ebitda)}) — a operação está consumindo caixa.`,
    });
  }

  // Queda de margem EBITDA > 2pp
  const quedaMargem = (prev.margem_ebitda - last.margem_ebitda) * 100;
  if (quedaMargem >= 2) {
    alerts.push({
      id: "queda-margem",
      level: quedaMargem >= 5 ? "danger" : "warning",
      message: `Margem EBITDA caiu ${quedaMargem.toFixed(1)} p.p. no último mês — de ${formatPercent(prev.margem_ebitda)} para ${formatPercent(last.margem_ebitda)}.`,
    });
  }

  // Queda de receita > 10%
  if (prev.receita_liquida > 0) {
    const quedaReceita = (prev.receita_liquida - last.receita_liquida) / prev.receita_liquida * 100;
    if (quedaReceita >= 10) {
      alerts.push({
        id: "queda-receita",
        level: "warning",
        message: `Receita líquida caiu ${quedaReceita.toFixed(1)}% em relação ao mês anterior.`,
      });
    }
  }

  // 3 meses consecutivos de queda de margem
  if (data.length >= 4 && !alerts.find(a => a.id === "queda-margem")) {
    const ultimos = data.slice(-3);
    if (ultimos[0].margem_ebitda > ultimos[1].margem_ebitda &&
        ultimos[1].margem_ebitda > ultimos[2].margem_ebitda) {
      alerts.push({
        id: "tendencia-queda",
        level: "warning",
        message: "Margem EBITDA em queda pelo 3º mês consecutivo. Revise custos e despesas.",
      });
    }
  }

  // Tudo ok
  if (alerts.length === 0) {
    alerts.push({
      id: "ok",
      level: "ok",
      message: `Indicadores estáveis. Margem EBITDA atual: ${formatPercent(last.margem_ebitda)}.`,
    });
  }

  return alerts;
}

export default function AlertsBanner({ data }: { data: DreCalculado[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const alerts = computeAlerts(data).filter(a => !dismissed.has(a.id));

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-5 no-print">
      {alerts.map(alert => {
        const isOk = alert.level === "ok";
        const isDanger = alert.level === "danger";
        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 px-4 py-3 rounded-md"
            style={{
              background: isOk
                ? "var(--green-dim)"
                : isDanger
                ? "var(--red-dim)"
                : "rgba(200,145,42,0.06)",
              border: `1px solid ${isOk
                ? "rgba(61,184,112,0.2)"
                : isDanger
                ? "rgba(212,88,80,0.25)"
                : "rgba(200,145,42,0.2)"}`,
            }}
          >
            {isOk
              ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--green)" }} />
              : isDanger
              ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--red)" }} />
              : <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
            }
            <p
              className="flex-1 text-sm"
              style={{
                color: isOk ? "var(--green)" : isDanger ? "var(--red)" : "var(--text-2)",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {alert.message}
            </p>
            <button
              onClick={() => setDismissed(s => new Set([...s, alert.id]))}
              className="flex-shrink-0 hover:opacity-60 transition-opacity"
              style={{ color: isOk ? "var(--green)" : isDanger ? "var(--red)" : "var(--text-3)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
