import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useFinancialData } from "../hooks/useFinancialData";
import CSVImport from "../components/CSVImport";
import CSVFluxoImport from "../components/CSVFluxoImport";
import OFXImport from "../components/OFXImport";
import { ArrowLeft, Save, Building2, Upload, PenLine, TrendingUp, Copy, Lightbulb } from "lucide-react";
import { calcularAliquotaEfetivaMedia, formatBRL, maskMoney, parseMoney } from "../lib/utils";

const DRE_FIELDS = [
  { key: "receita_bruta",             label: "Receita Bruta",                          hint: "Total faturado antes de descontos e impostos" },
  { key: "deducoes",                  label: "Impostos sobre vendas + Devoluções",     hint: "Ex: ICMS, PIS, COFINS, devoluções de clientes" },
  { key: "cmv",                       label: "Custo do produto ou serviço (CMV/CPV)",  hint: "O que você gasta para entregar o que vende" },
  { key: "despesas_comerciais",       label: "Gastos com vendas",                      hint: "Comissões, marketing, frete de venda" },
  { key: "despesas_administrativas",  label: "Gastos administrativos",                 hint: "Aluguel, contador, sistemas, telefone" },
  { key: "despesas_pessoal",          label: "Folha de pagamento",                     hint: "Salários, encargos, benefícios de todos os funcionários" },
  { key: "outras_despesas_op",        label: "Outras despesas",                        hint: "Despesas que não se encaixam nos itens anteriores" },
  { key: "depreciacao",               label: "Depreciação de equipamentos",            hint: "Desgaste de máquinas, veículos, móveis — pergunte ao contador" },
  { key: "resultado_financeiro",      label: "Resultado financeiro",                   hint: "Juros recebidos menos juros pagos. Use valor negativo (ex: -1.500,00) se paga mais juros do que recebe" },
  { key: "ir_csll",                   label: "Imposto de Renda + CSLL",               hint: "IR e Contribuição Social sobre o Lucro — pergunte ao contador" },
] as const;

// Grupos de campos DRE para separação visual por seção
const DRE_GRUPOS = [
  { titulo: "Receitas",               fields: ["receita_bruta", "deducoes"] as const },
  { titulo: "Custos",                 fields: ["cmv"] as const },
  { titulo: "Despesas operacionais",  fields: ["despesas_comerciais", "despesas_administrativas", "despesas_pessoal", "outras_despesas_op"] as const },
  { titulo: "Resultado",              fields: ["depreciacao", "resultado_financeiro", "ir_csll"] as const },
] as const;

const FLUXO_FIELDS = [
  { key: "operacional_recebimento", tipo: "entrada" as const, label: "Recebimentos de clientes",          hint: "Total que entrou no caixa vindo de clientes" },
  { key: "operacional_pagamento",   tipo: "saida"  as const, label: "Pagamentos operacionais",            hint: "Fornecedores, pessoal, despesas — tudo que saiu para manter a operação" },
  { key: "investimento",            tipo: "saida"  as const, label: "Investimentos (saídas)",              hint: "Compra de equipamentos, máquinas, imóveis, expansão" },
  { key: "financiamento_entrada",   tipo: "entrada" as const, label: "Entradas de financiamento",         hint: "Novos empréstimos ou aporte de capital recebido" },
  { key: "financiamento_saida",     tipo: "saida"  as const, label: "Saídas de financiamento",            hint: "Pagamento de parcelas de empréstimos ou distribuição de lucros" },
] as const;

// Índice de campos DRE para lookup rápido a partir da key
const DRE_FIELDS_MAP = Object.fromEntries(DRE_FIELDS.map((f) => [f.key, f])) as Record<
  (typeof DRE_FIELDS)[number]["key"],
  (typeof DRE_FIELDS)[number]
>;

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

/**
 * Formata um número como string no formato pt-BR com 2 casas decimais.
 * Usado para exibir valores carregados do banco nos inputs.
 */
function formatValueForInput(value: number): string {
  if (value === 0) return "";
  return Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Aplica máscara de dinheiro preservando sinal negativo.
 * Utilizado exclusivamente no campo resultado_financeiro que aceita valores negativos.
 */
function maskMoneyWithSign(raw: string): string {
  const isNegative = raw.startsWith("-");
  const masked = maskMoney(raw);
  if (!masked) return isNegative ? "-" : "";
  return isNegative ? `-${masked}` : masked;
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
  const { company, dreData, reload } = useFinancialData(user?.id);
  const navigate = useNavigate();
  // "manual" é o padrão — maioria dos usuários chega querendo digitar manualmente
  const [tab, setTab] = useState<"csv" | "manual" | "fluxo">("manual");
  const [csvType, setCsvType] = useState<"dre" | "fluxo" | "ofx">("dre");
  const [periodo, setPeriodo] = useState(monthsRange(12)[11].value);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fluxoValues, setFluxoValues] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copyingPrev, setCopyingPrev] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const months = monthsRange(12);

  function prevMonth(p: string): string {
    const d = new Date(p);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }

  async function copyFromPrevMonth() {
    if (!company) return;
    setCopyingPrev(true);
    const prev = prevMonth(periodo);
    await loadPeriodoData(company.id, prev);
    await loadFluxoData(company.id, prev);
    setCopyingPrev(false);
  }

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
    for (const row of data ?? []) {
      const prev = parseFloat(vals[row.categoria] ?? "0");
      const total = prev + row.valor;
      vals[row.categoria] = total < 0
        // Resultado financeiro pode ser negativo — preserva sinal
        ? `-${formatValueForInput(total)}`
        : formatValueForInput(total);
    }
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
      const total = parseFloat(vals[row.categoria]) + row.valor;
      vals[row.categoria] = formatValueForInput(total);
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
          valor: parseMoney(values[f.key]),
        }));

      if (rows.length === 0) { setError("Preencha pelo menos um campo."); setSaving(false); return; }

      const { error: delErr } = await supabase
        .from("dre_lancamentos")
        .delete()
        .eq("company_id", coId)
        .eq("periodo", periodo);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase.from("dre_lancamentos").insert(rows);
      if (insErr) throw insErr;
      await reload();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar dados.");
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
          valor: parseMoney(fluxoValues[f.key]),
          realizado: true,
        }));

      if (rows.length === 0) { setError("Preencha pelo menos um campo."); setSaving(false); return; }

      const { error: insErr } = await supabase.from("fluxo_caixa").insert(rows);
      if (insErr) throw insErr;

      await reload();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar fluxo de caixa.");
    } finally {
      setSaving(false);
    }
  }

  // Contador de progresso: quantos dos 10 campos DRE estão preenchidos
  const dreFieldsTotal = DRE_FIELDS.length;
  const dreFieldsPreenchidos = DRE_FIELDS.filter(
    (f) => values[f.key] !== undefined && values[f.key] !== "" && values[f.key] !== "-"
  ).length;

  // Contador de progresso para fluxo de caixa
  const fluxoFieldsTotal = FLUXO_FIELDS.length;
  const fluxoFieldsPreenchidos = FLUXO_FIELDS.filter(
    (f) => fluxoValues[f.key] !== undefined && fluxoValues[f.key] !== ""
  ).length;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
              className="font-display text-xl sm:text-2xl"
              style={{ color: "var(--text)", fontWeight: 400 }}
            >
              Inserir dados da empresa
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Preencha manualmente ou importe pelo CSV mês a mês
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
          className="flex rounded p-0.5 mb-5 overflow-x-auto"
          style={{ background: "var(--bg-card)" }}
        >
          {([
            { id: "manual", icon: <PenLine className="w-4 h-4" />,    label: "DRE",          labelFull: "DRE manual",     badge: null },
            { id: "fluxo",  icon: <TrendingUp className="w-4 h-4" />, label: "Fluxo",        labelFull: "Fluxo de Caixa", badge: null },
            { id: "csv",    icon: <Upload className="w-4 h-4" />,     label: "CSV",          labelFull: "Importar CSV",   badge: null },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: tab === t.id ? "var(--bg-card-2)" : "transparent",
                color: tab === t.id ? "var(--text)" : "var(--text-3)",
                border: tab === t.id ? "1px solid var(--border)" : "1px solid transparent",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.labelFull}</span>
              <span className="sm:hidden">{t.label}</span>
              {t.badge && <span className="hidden sm:inline text-xs font-normal" style={{ color: "var(--green)" }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* CSV tab */}
        {tab === "csv" && (
          <div
            className="p-4 sm:p-6 rounded-md"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {company ? (
              <>
                {/* CSV sub-type toggle */}
                <div className="flex rounded p-0.5 mb-5" style={{ background: "var(--bg-card-2)" }}>
                  {([
                    { id: "dre",   label: "DRE (Resultado)"   },
                    { id: "fluxo", label: "Fluxo de Caixa"    },
                    { id: "ofx",   label: "Extrato OFX"       },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCsvType(t.id)}
                      className="flex-1 py-2 rounded text-sm font-medium transition-all"
                      style={{
                        background: csvType === t.id ? "var(--bg-card)" : "transparent",
                        color: csvType === t.id ? "var(--text)" : "var(--text-3)",
                        border: csvType === t.id ? "1px solid var(--border)" : "1px solid transparent",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {csvType === "dre" && (
                  <CSVImport companyId={company.id} onImported={async () => { await reload(); navigate("/dashboard"); }} />
                )}
                {csvType === "fluxo" && (
                  <CSVFluxoImport companyId={company.id} onImported={async () => { await reload(); navigate("/dashboard"); }} />
                )}
                {csvType === "ofx" && (
                  <OFXImport companyId={company.id} onImported={async () => { await reload(); navigate("/dashboard"); }} />
                )}
              </>
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
            className="p-4 sm:p-6 rounded-md mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="mb-6">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Mês de referência
              </label>
              <div className="flex gap-2">
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
                {company && (
                  <button
                    onClick={copyFromPrevMonth}
                    disabled={copyingPrev}
                    title="Copiar dados do mês anterior"
                    className="flex items-center gap-1.5 px-3 rounded flex-shrink-0 text-xs transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--bg-card-2)",
                      color: "var(--text-2)",
                      fontFamily: "'Outfit', sans-serif",
                      opacity: copyingPrev ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copiar mês anterior</span>
                    <span className="sm:hidden">Copiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cabeçalho + barra de progresso */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className="text-sm font-medium"
                  style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
                >
                  Valores do mês (em R$)
                </h2>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
                >
                  {dreFieldsPreenchidos} de {dreFieldsTotal} campos preenchidos
                </span>
              </div>
              {/* Barra de progresso */}
              <div
                style={{
                  height: 3,
                  background: "var(--bg-card-2)",
                  borderRadius: 9999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(dreFieldsPreenchidos / dreFieldsTotal) * 100}%`,
                    background: "var(--gold)",
                    borderRadius: 9999,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Não sabe algum valor? Deixe em branco — você pode completar depois.
              </p>
            </div>

            {/* Campos DRE agrupados por seção */}
            <div className="flex flex-col gap-0">
              {DRE_GRUPOS.map((grupo, grupoIdx) => (
                <div key={grupo.titulo}>
                  {/* Separador entre grupos (não aparece antes do primeiro) */}
                  {grupoIdx > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "var(--border)",
                        margin: "20px 0 16px",
                      }}
                    />
                  )}

                  {/* Cabeçalho do grupo */}
                  <h3
                    style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-3)",
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 500,
                      marginBottom: 12,
                    }}
                  >
                    {grupo.titulo}
                  </h3>

                  {/* Campos do grupo */}
                  <div className="flex flex-col gap-5">
                    {grupo.fields.map((fieldKey) => {
                      const field = DRE_FIELDS_MAP[fieldKey];
                      const periodoSelecionado = periodo.slice(0, 7);
                      const historico = dreData.filter((p) => p.periodo < periodoSelecionado);
                      const aliquota = field.key === "ir_csll"
                        ? calcularAliquotaEfetivaMedia(historico)
                        : null;
                      const rbAtual = parseMoney(values["receita_bruta"] ?? "0");
                      const sugestaoValor = aliquota && rbAtual > 0 ? aliquota * rbAtual : null;
                      const isResultadoFinanceiro = field.key === "resultado_financeiro";

                      return (
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
                            onChange={(e) => {
                              const raw = e.target.value;
                              const masked = isResultadoFinanceiro
                                ? maskMoneyWithSign(raw)
                                : maskMoney(raw);
                              setValues((prev) => ({ ...prev, [field.key]: masked }));
                            }}
                            placeholder={isResultadoFinanceiro ? "0,00 ou -1.500,00" : "0,00"}
                            prefix="R$"
                          />
                          {sugestaoValor && (
                            <div
                              className="flex items-center justify-between mt-1.5 px-2.5 py-1.5 rounded"
                              style={{ background: "var(--gold-dim)", border: "1px solid rgba(200,145,42,0.18)" }}
                            >
                              <div className="flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3 flex-shrink-0" style={{ color: "var(--gold)" }} />
                                <span className="text-xs" style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}>
                                  Sugestão pelo histórico:{" "}
                                  <strong style={{ color: "var(--text)" }}>{formatBRL(sugestaoValor)}</strong>
                                  <span style={{ color: "var(--text-3)" }}> ({(aliquota! * 100).toFixed(1)}% da rec. bruta)</span>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setValues((prev) => ({
                                    ...prev,
                                    ir_csll: maskMoney(sugestaoValor.toFixed(2)),
                                  }))
                                }
                                className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                                style={{
                                  background: "rgba(200,145,42,0.15)",
                                  color: "var(--gold)",
                                  border: "1px solid rgba(200,145,42,0.3)",
                                  fontFamily: "'Outfit', sans-serif",
                                }}
                              >
                                Usar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                Dados salvos com sucesso.
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
            className="p-4 sm:p-6 rounded-md mb-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="mb-6">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
              >
                Mês de referência
              </label>
              <div className="flex gap-2">
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
                {company && (
                  <button
                    onClick={copyFromPrevMonth}
                    disabled={copyingPrev}
                    title="Copiar dados do mês anterior"
                    className="flex items-center gap-1.5 px-3 rounded flex-shrink-0 text-xs transition-colors"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--bg-card-2)",
                      color: "var(--text-2)",
                      fontFamily: "'Outfit', sans-serif",
                      opacity: copyingPrev ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copiar mês anterior</span>
                    <span className="sm:hidden">Copiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cabeçalho + barra de progresso */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className="text-sm font-medium"
                  style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}
                >
                  Movimentações do mês (em R$)
                </h2>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
                >
                  {fluxoFieldsPreenchidos} de {fluxoFieldsTotal} campos preenchidos
                </span>
              </div>
              {/* Barra de progresso */}
              <div
                style={{
                  height: 3,
                  background: "var(--bg-card-2)",
                  borderRadius: 9999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(fluxoFieldsPreenchidos / fluxoFieldsTotal) * 100}%`,
                    background: "var(--gold)",
                    borderRadius: 9999,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Informe os totais mensais por categoria. Não sabe algum? Deixe em branco.
              </p>
            </div>

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
                    type="text"
                    value={fluxoValues[field.key] ?? ""}
                    onChange={(e) => {
                      const masked = maskMoney(e.target.value);
                      setFluxoValues((prev) => ({ ...prev, [field.key]: masked }));
                    }}
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
                Fluxo de caixa salvo com sucesso.
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
