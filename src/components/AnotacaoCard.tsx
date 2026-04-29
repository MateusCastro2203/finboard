import { useState, useEffect } from "react";
import { MessageSquare, Save } from "lucide-react";
import { formatPeriodo } from "../lib/utils";

interface Props {
  periodo: string;
  nota: string;
  onSave: (texto: string) => Promise<void>;
}

export default function AnotacaoCard({ periodo, nota, onSave }: Props) {
  const [texto, setTexto]   = useState(nota);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { setTexto(nota); }, [nota, periodo]);

  async function handleSave() {
    setSaving(true);
    await onSave(texto);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const unchanged = texto === nota;

  return (
    <div
      className="rounded-md no-print"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 20 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4" style={{ color: "var(--text-3)" }} />
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          Anotação — {formatPeriodo(periodo)}
        </p>
      </div>

      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Ex: Receita menor por férias coletivas. Margem pressionada pelo reajuste de fornecedor em Março."
        rows={3}
        style={{
          width: "100%",
          background: "var(--bg-card-2)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "10px 12px",
          fontSize: "0.875rem",
          color: "var(--text)",
          fontFamily: "'Outfit', sans-serif",
          outline: "none",
          resize: "vertical",
          transition: "border-color 0.15s",
          lineHeight: 1.6,
        }}
        onFocus={e  => { e.currentTarget.style.borderColor = "var(--gold)"; }}
        onBlur={e   => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Contexto que os números não mostram — visível apenas para você
        </p>
        <button
          onClick={handleSave}
          disabled={saving || unchanged}
          className="btn btn-outline-gold text-xs"
          style={{ padding: "6px 12px", opacity: (saving || unchanged) ? 0.45 : 1 }}
        >
          <Save className="w-3 h-3" />
          {saved ? "Salvo ✓" : saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
