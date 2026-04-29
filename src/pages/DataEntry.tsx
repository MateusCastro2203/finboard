import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useFinancialData } from "../hooks/useFinancialData";
import CSVImport from "../components/CSVImport";
import { ArrowLeft, Save, Building2, Upload, PenLine, TrendingUp } from "lucide-react";

const DRE_FIELDS = [
  { key: "receita_bruta",             label: "Receita Bruta",                          hint: "Total faturado antes de descontos e impostos" },
  { key: "deducoes",                  label: "Impostos sobre vendas + Devoluções",     hint: "Ex: ICMS, PIS, COFINS, devoluções de clientes" },
  { key: "cmv",                       label: "Custo do produto ou serviço (CMV/CPV)",  hint: "O que você gasta para entregar o que vende" },
  { key: "despesas_comerciais",       label: "Gastos com vendas",                      hint: "Comissões, marketing, frete de venda" },
  { key: "despesas_administrativas",  label: "Gastos administrativos",                 hint: "Aluguel, contador, sistemas, telefone" },
  { key: "despesas_pessoal",          label: "Folha de pagamento",                     hint: "Salários, encargos, benefícios de todos os funcionários" },
  { key: "outras_despesas_op",        label: "Outras despesas",                        hint: "Despesas que não se encaixam nos itens anteriores" },
  { key: "depreciacao",               label: "Depreciação de equipamentos",            hint: "Desgaste de máquinas, veículos, móveis — pergunte ao contador" },
  { key: "resultado_financeiro",      label: "Resultado financeiro",                   hint: "Juros recebidos menos juros pagos. Use número negativo se paga mais juros do que recebe" },
  { key: "ir_csll",                   label: "Imposto de Renda + CSLL",               hint: "IR e Contribuição Social sobre o Lucro — pergunte ao contador" },
] as const;

const FLUXO_FIELDS = [
  { key: "operacional_recebimento", tipo: "entrada" as const, label: "Recebimentos de clientes",          hint: "Total que entrou no caixa vindo de clientes" },
  { key: "operacional_pagamento",   tipo: "saida"  as const, label: "Pagamentos operacionais",            hint: "Fornecedores, pessoal, despesas — tudo que saiu para manter a operação" },
  { key: "investimento",            tipo: "saida"  as const, label: "Investimentos (saídas)",              hint: "Compra de equipamentos, máquinas, imóveis, expansão" },
  { key: "financiamento_entrada",   tipo: "entrada" as const, label: "Entradas de financiamento",         hint: "Novos empréstimos ou aporte de capital recebido" },
  { key: "financiamento_saida",     tipo: "saida"  as const, label: "Saídas de financiamento",            hint: "Pagamento de parcelas de empréstimos ou distribuição de lucros" },
] as const;

function monthsRange(n = 12) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    });
  }
  return months;
}

const inputCls: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-card-2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "9px 12px",
  fontSize: "0.875rem",
  color: "var(--text)",
  fontFamily: "'Outfit', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
};

function parseBRL(v: string): number {
  // Handles both "1500.00" and "1.500,00" formats
  const cleaned = v.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string }) {
  const { prefix, ...rest } = props;
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span
          style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-3)", fontSize: "0.875rem", fontFamily: "'Outfit', sans-serif",
            pointerEvents: "none",
          }}
        >
          {prefix}
        </span>
      )}
      <input
        inputMode="decimal"
        {...rest}
        style={{ ...inputCls, paddingLeft: prefix ? 34 : 12 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

export default function DataEntry() {
  const { user } = useAuth();
  const { company, reload } = useFinancialData(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"csv" | "manual" | "fluxo">("csv");
  const [periodo, setPeriodo] = useState(monthsRange(12)[11].value);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fluxoValues, setFluxoValues] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const months = monthsRange(12);

  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
      loadPeriodoData(company.id, periodo);
      loadFluxoData(company.id, periodo);
    }
  }, [company, periodo]);

  async function loadPeriodoData(companyId: string, p: string) {
    const { data } = await supabase
      .from("dre_lancamentos")
      .select("categoria, valor")
      .eq("company_id", companyId)
      .eq("periodo", p);
    const vals: Record<string, string> = {};
    for (const row of data ?? []) vals[row.categoria] = String(row.valor);
    setValues(vals);
  }

  async function loadFluxoData(companyId: string, p: string) {
    const ym = p.slice(0, 7);
    const { data } = await supabase
      .from("fluxo_caixa")
      .select("categoria, valor")
      .eq("company_id", companyId)
      .gte("data", `${ym}-01`)
      .lte("data", `${ym}-31`);
    const vals: Record<string, string> = {};
    for (const row of data ?? []) {
      if (!vals[row.categoria]) vals[row.categoria] = "0";
      vals[row.categoria] = String(parseFloat(vals[row.categoria]) + row.valor);
    }
    setFluxoValues(vals);
  }

  async function ensureCompany(): Promise<string | null> {
    if (company?.id) return company.id;
    if (!companyName.trim()) { setError("Informe o nome da sua empresa."); return null; }
    const { data: co, error: coErr } = await supabase
      .from("companies")
      .insert({ user_id: user!.id, name: companyName.trim() })
      .select()
      .single();
    if (coErr) { setError(coErr.message); return null; }
    return co.id;
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const coId = await ensureCompany();
      if (!coId) { setSaving(false); return; }

      const rows = DRE_FIELDS
        .filter((f) => values[f.key] !== undefined && values[f.key] !== "")
        .map((f) => ({
          company_id: coId,
          periodo,
          categoria: f.key,
          valor: parseBRL(values[f.key]),
        }));

      if (rows.length === 0) { setError("Preencha pelo menos um campo."); setSaving(false); return; }

      const { error: insErr } = await supabase
        .from("dre_lancamentos")
        .upsert(rows, { onConflict: "company_id,periodo,categoria" });

      if (insErr) throw insErr;
      await reload();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFluxo() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const coId = await ensureCompany();
      if (!coId) { setSaving(false); return; }

      const ym = periodo.slice(0, 7);

      await supabase
        .from("fluxo_caixa")
        .delete()
        .eq("company_id", coId)
        .gte("data", `${ym}-01`)
        .lte("data", `${ym}-31`);

      const rows = FLUXO_FIELDS
        .filter((f) => fluxoValues[f.key] !== undefined && fluxoValues[f.key] !== "")
        .map((f) => ({
          company_id: coId,
          data: `${ym}-01`,
          tipo: f.tipo,
          categoria: f.key,
          descricao: f.label,
          valor: parseBRL(fluxoValues[f.key]),
          realizado: true,
        }));

      if (rows.length === 0) { setError("Preencha pelo menos um campo."); setSaving(false); return; }

      const { error: insErr } = await supabase.from("fluxo_caixa").insert(rows);
      if (insErr) throw insErr;

      await reload();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="font-display text-2xl"
              style={{ color: "var(--text)", fontWeight: 400 }}
            >
              Inserir dados da empresa
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Importe pelo CSV ou preencha manualmente mês a mês
            </p>
          </div>
        </div>

        {/* Company name (only when none exists) */}
        {!company && (
          <div
            className="p-5 rounded-md mb-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <h2 className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                Nome da empresa
              </h2>
            </div>
            <DarkInput
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Empresa ABC LTDA"
            />
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex rounded p-0.5 mb-5"
          style={{ background: "var(--bg-card)" }}
        >
          {([
            { id: "csv",    icon: <Upload className="w-4 h-4" />,    label: "Importar CSV",         badge: "Recomendado" },
            { id: "manual", icon: <PenLine className="w-4 h-4" />,   label: "DRE manual",            badge: null },
            { id: "fluxo",  icon: <TrendingUp className="w-4 h-4" />, label: "Fluxo de Caixa",      badge: null },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? "var(--bg-card-2)" : "transparent",
                color: tab === t.id ? "var(--text)" : "var(--text-3)",
                border: tab === t.id ? "1px solid var(--border)" : "1px solid transparent",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {t.icon}
              {t.label}
              {t.badge && <span className="text-xs font-normal" style={{ color: "var(--green)" }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* CSV tab */}
        {tab === "csv" && (
          <div
            className="p-6 rounded-md"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {company ? (
              <CSVImport
                companyId={company.id}
                onImported={async () => {
                  await reload();
                  navigate("/dashboard");
                }}
              />
            ) : (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Preencha o nome da empresa acima antes de importar.
              </p>
            )}
          </div>
        )}

        {/* Manual tab */}
        {tab === "manual" && (
          <div
            className="p-6 rounded-md mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="mb-6">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Mês de referência
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                style={{ ...inputCls }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: "var(--bg-card)" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <h2
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
            >
              Valores do mês (em R$)
            </h2>
            <p className="text-xs mb-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Não sabe algum valor? Deixe em branco — você pode completar depois.
            </p>

            <div className="flex flex-col gap-5">
              {DRE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label
                    className="block text-sm font-medium mb-0.5"
                    style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
                  >
                    {field.label}
                  </label>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    {field.hint}
                  </p>
                  <DarkInput
                    type="text"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="0,00"
                    prefix="R$"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p
                className="text-xs px-4 py-3 rounded mt-5"
                style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs px-4 py-3 rounded mt-5"
                style={{ color: "var(--green)", background: "var(--green-dim)", fontFamily: "'Outfit', sans-serif" }}
              >
                ✓ Dados salvos com sucesso.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-gold flex-1 justify-center"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar mês"}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-ghost"
              >
                Ver painel
              </button>
            </div>
          </div>
        )}
        {/* Fluxo de Caixa tab */}
        {tab === "fluxo" && (
          <div
            className="p-6 rounded-md mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="mb-6">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Mês de referência
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                style={{ ...inputCls }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: "var(--bg-card)" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <h2
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
            >
              Movimentações do mês (em R$)
            </h2>
            <p className="text-xs mb-6" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Informe os totais mensais por categoria. Não sabe algum? Deixe em branco.
            </p>

            <div className="flex flex-col gap-5">
              {FLUXO_FIELDS.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <label
                      className="text-sm font-medium"
                      style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
                    >
                      {field.label}
                    </label>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: field.tipo === "entrada" ? "var(--green-dim)" : "var(--red-dim)",
                        color: field.tipo === "entrada" ? "var(--green)" : "var(--red)",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {field.tipo === "entrada" ? "entrada" : "saída"}
                    </span>
                  </div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                    {field.hint}
                  </p>
                  <DarkInput
                    type="number"
                    step="0.01"
                    value={fluxoValues[field.key] ?? ""}
                    onChange={(e) => setFluxoValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="0,00"
                    prefix="R$"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs px-4 py-3 rounded mt-5" style={{ color: "var(--red)", background: "var(--red-dim)", fontFamily: "'Outfit', sans-serif" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs px-4 py-3 rounded mt-5" style={{ color: "var(--green)", background: "var(--green-dim)", fontFamily: "'Outfit', sans-serif" }}>
                ✓ Fluxo de caixa salvo com sucesso.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveFluxo}
                disabled={saving}
                className="btn btn-gold flex-1 justify-center"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar mês"}
              </button>
              <button onClick={() => navigate("/dashboard")} className="btn btn-ghost">
                Ver painel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
