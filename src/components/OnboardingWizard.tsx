import { useState } from "react";
import { ArrowRight, Building2, FileUp } from "lucide-react";

interface Props {
  onCreateCompany: (name: string) => Promise<void>;
  onImport: () => void;
  onSkip: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: "0.9rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function OnboardingWizard({ onCreateCompany, onImport, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { setError("Informe o nome da empresa."); return; }
    setCreating(true);
    setError(null);
    await onCreateCompany(companyName.trim());
    setCreating(false);
    setStep(1);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full rounded-md"
        style={{ maxWidth: 440, background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Progress bar */}
        <div className="flex gap-1.5 px-8 pt-8 mb-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? "var(--gold)" : "var(--border)" }}
            />
          ))}
        </div>

        <div className="px-8 pb-8">
          {step === 0 ? (
            <>
              {/* Step 0: company name */}
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center mb-5"
                style={{ background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.2)" }}
              >
                <Building2 className="w-6 h-6" style={{ color: "var(--gold)" }} />
              </div>

              <h2
                className="font-display text-2xl mb-2"
                style={{ color: "var(--text)", fontWeight: 400 }}
              >
                Como se chama sua empresa?
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Vamos configurar seu painel. Comece informando o nome da sua empresa.
              </p>

              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setError(null); }}
                  placeholder="Ex: Distribuidora ABC LTDA"
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
                {error && (
                  <p className="text-xs" style={{ color: "var(--red)", fontFamily: "'Outfit', sans-serif" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={creating || !companyName.trim()}
                  className="btn btn-gold w-full justify-center mt-1"
                  style={{ opacity: (creating || !companyName.trim()) ? 0.5 : 1 }}
                >
                  {creating ? "Criando..." : "Continuar"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Step 1: import guidance */}
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center mb-5"
                style={{ background: "var(--gold-dim)", border: "1px solid rgba(184,129,30,0.2)" }}
              >
                <FileUp className="w-6 h-6" style={{ color: "var(--gold)" }} />
              </div>

              <h2
                className="font-display text-2xl mb-2"
                style={{ color: "var(--text)", fontWeight: 400 }}
              >
                Agora importe seus dados
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Peça ao seu contador o DRE em CSV ou preencha manualmente mês a mês.
                Leva menos de 5 minutos e seus gráficos aparecem na hora.
              </p>

              <div className="flex flex-col gap-2">
                <button onClick={onImport} className="btn btn-gold w-full justify-center">
                  Importar dados agora
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onSkip}
                  className="text-sm text-center py-2 transition-opacity hover:opacity-60"
                  style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
                >
                  Fazer depois
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
