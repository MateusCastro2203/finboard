import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { calcularHealthScore } from "../lib/healthScore";
import type { DreCalculado } from "../types";

const colorMap = {
  green:  { text: "var(--green)",  bg: "rgba(61,184,112,0.08)",  border: "rgba(61,184,112,0.2)",  track: "rgba(61,184,112,0.15)" },
  gold:   { text: "var(--gold)",   bg: "rgba(200,145,42,0.07)",  border: "rgba(200,145,42,0.2)",  track: "rgba(200,145,42,0.15)" },
  orange: { text: "#e07b39",       bg: "rgba(224,123,57,0.07)",  border: "rgba(224,123,57,0.2)",  track: "rgba(224,123,57,0.15)" },
  red:    { text: "var(--red)",    bg: "rgba(212,88,80,0.07)",   border: "rgba(212,88,80,0.2)",   track: "rgba(212,88,80,0.15)" },
};

function ScoreRing({ score, color }: { score: number; color: keyof typeof colorMap }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const c = colorMap[color];

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke={c.track} strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={c.text}
        strokeWidth="6"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="36" y="39" textAnchor="middle" fontSize="15" fontWeight="600" fill={c.text} fontFamily="'Outfit', sans-serif">
        {score}
      </text>
    </svg>
  );
}

export default function HealthScore({ data }: { data: DreCalculado[] }) {
  const hs = calcularHealthScore(data);
  if (!hs) return null;

  const c = colorMap[hs.color];

  return (
    <div
      className="rounded-md p-4 mb-5 no-print"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-4">
        <ScoreRing score={hs.score} color={hs.color} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}
            >
              Score de Saúde — {hs.label}
            </span>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 mt-2">
            {hs.pillars.map(p => (
              <div key={p.name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    {p.name}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                    {p.score}/{p.max}
                  </span>
                </div>
                <div className="h-1 rounded-full" style={{ background: c.track }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${(p.score / p.max) * 100}%`,
                      background: c.text,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {hs.insights.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: c.border }}>
          {hs.insights.map((insight, i) => {
            const isPositive = insight.includes("subiu") || insight.includes("cresceu") || insight.includes("alta");
            const isNegative = insight.includes("caiu") || insight.includes("queda") || insight.includes("negativo") || insight.includes("prejuízo") || insight.includes("Revise");
            const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
            const iconColor = isPositive ? "var(--green)" : isNegative ? c.text : "var(--text-3)";

            return (
              <div key={i} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
                <p
                  className="text-xs"
                  style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif", lineHeight: "1.4" }}
                >
                  {insight}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {data.length < 2 && (
        <div className="mt-2 flex items-center gap-1.5">
          <Info className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-3)" }} />
          <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            Insira dados de 2+ meses para ver tendências e frases automáticas.
          </p>
        </div>
      )}
    </div>
  );
}
