import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFinancialData } from "../hooks/useFinancialData";
import { useCaixaDiario, type NovoLancamento } from "../hooks/useCaixaDiario";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import LancamentoForm from "../components/caixa/LancamentoForm";
import LancamentoItem from "../components/caixa/LancamentoItem";
import { formatBRL, formatPeriodo } from "../lib/utils";
import type { FluxoCaixa } from "../types";

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

function navegarMes(mes: string, delta: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcularSaldosPorDia(lancamentos: FluxoCaixa[], initialBalance = 0): Map<string, number> {
  const realizados = [...lancamentos]
    .filter(l => l.realizado)
    .sort((a, b) => a.data.localeCompare(b.data));
  const map = new Map<string, number>();
  let acumulado = initialBalance;
  for (const l of realizados) {
    acumulado += l.tipo === "entrada" ? l.valor : -l.valor;
    map.set(l.data, acumulado);
  }
  return map;
}

function agruparPorData(lancamentos: FluxoCaixa[]): { data: string; itens: FluxoCaixa[] }[] {
  const map = new Map<string, FluxoCaixa[]>();
  for (const l of lancamentos) {
    const lista = map.get(l.data) ?? [];
    lista.push(l);
    map.set(l.data, lista);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, itens]) => ({ data, itens }));
}

function formatDataDia(data: string): string {
  const [ano, mes, dia] = data.split("-");
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function CaixaDiario() {
  const { user } = useAuth();
  const { company } = useFinancialData(user?.id);
  const [filtroMes, setFiltroMes] = useState(mesAtual);
  const [filtro, setFiltro]       = useState<"todos" | "entrada" | "saida" | "previsto">("todos");
  const [showForm, setShowForm]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; grupo: string | null; data: string } | null>(null);

  const { lancamentos, loading, error, inserir, atualizar, excluir, excluirGrupoFuturo, reload } = useCaixaDiario(company?.id, filtroMes);
  const [editando, setEditando]   = useState<FluxoCaixa | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const toastRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();

  function showToast(msg: string, ok = true) {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ msg, ok });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  const entradas    = lancamentos.filter(l => l.tipo === "entrada" && l.realizado).reduce((s, l) => s + l.valor, 0);
  const saidas      = lancamentos.filter(l => l.tipo === "saida"   && l.realizado).reduce((s, l) => s + l.valor, 0);
  const saldo       = entradas - saidas;
  const saldoInicial  = company?.saldo_inicial ?? 0;
  const saldosPorDia  = calcularSaldosPorDia(lancamentos, saldoInicial);
  const posicaoTotal  = saldoInicial + saldo;

  const entradasPrevistas = lancamentos.filter(l => l.tipo === "entrada" && !l.realizado).reduce((s, l) => s + l.valor, 0);
  const saidasPrevistas   = lancamentos.filter(l => l.tipo === "saida"   && !l.realizado).reduce((s, l) => s + l.valor, 0);
  const temPrevistos      = lancamentos.some(l => !l.realizado);
  const saldoProjetado    = posicaoTotal + entradasPrevistas - saidasPrevistas;

  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtro === "todos")    return true;
    if (filtro === "previsto") return !l.realizado;
    return l.tipo === filtro && l.realizado;
  });
  const grupos = agruparPorData(lancamentosFiltrados);

  async function handleSave(dados: NovoLancamento, repeticoes?: number): Promise<void> {
    if (editando) {
      await atualizar(editando.id, dados);
      showToast("Lançamento atualizado");
    } else {
      await inserir(dados, repeticoes);
      const msg = repeticoes && repeticoes > 1 && dados.recorrencia
        ? `${repeticoes} lançamentos criados`
        : "Lançamento salvo";
      showToast(msg);
    }
  }

  function handleOpenEdit(l: FluxoCaixa) {
    setEditando(l);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditando(null);
  }

  async function handleToggleRealizado(id: string, realizado: boolean) {
    await atualizar(id, { realizado: !realizado });
    showToast(realizado ? "Marcado como previsto" : "Marcado como realizado");
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    await excluir(id);
    showToast("Lançamento excluído");
  }

  async function handleDeleteGrupo(grupo: string, data: string) {
    setConfirmDelete(null);
    await excluirGrupoFuturo(grupo, data);
    showToast("Lançamentos futuros excluídos");
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm px-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--red)" }} />
          <p className="text-sm mb-5" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>{error}</p>
          <button onClick={reload} className="btn btn-outline-gold text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-surface)" }}>
      <div className="hidden md:block">
        <Sidebar activeTab="caixa" onTabChange={(tab) => navigate(`/dashboard?tab=${tab}`)} />
      </div>

      <main className="flex-1 px-4 md:px-6 py-6 overflow-x-hidden pb-20 md:pb-6" style={{ minWidth: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--text)" }}>
              Caixa Diário
            </h1>
            {company && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                {company.name}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-gold text-xs"
            style={{ padding: "8px 16px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo lançamento
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Entradas", valor: entradas, color: "var(--green)" },
            { label: "Saídas",   valor: saidas,   color: "var(--red)"   },
            { label: saldoInicial !== 0 ? "Saldo do mês" : "Saldo", valor: saldo, color: saldo >= 0 ? "var(--green)" : "var(--red)" },
          ].map(({ label, valor, color }) => (
            <div
              key={label}
              className="rounded-md px-4 py-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                {label}
              </p>
              <p className="text-base font-semibold" style={{ color, fontFamily: "'Outfit', sans-serif" }}>
                {formatBRL(valor)}
              </p>
            </div>
          ))}
        </div>

        {/* Saldo projetado (realizado + previstos) */}
        {temPrevistos && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-md mb-3 text-sm"
            style={{
              background: saldoProjetado < 0 ? "rgba(212,88,80,0.08)" : "var(--bg-card)",
              border: `1px solid ${saldoProjetado < 0 ? "rgba(212,88,80,0.25)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center gap-2">
              {saldoProjetado < 0 && (
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--red)" }} />
              )}
              <span style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Projetado até fim do mês
              </span>
            </div>
            <span
              className="font-semibold"
              style={{ color: saldoProjetado >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'Outfit', sans-serif" }}
            >
              {formatBRL(saldoProjetado)}
            </span>
          </div>
        )}

        {/* Posição total quando há saldo inicial configurado */}
        {saldoInicial !== 0 && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-md mb-4 text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <span style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Posição total em caixa
            </span>
            <span
              className="font-semibold"
              style={{ color: posicaoTotal >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'Outfit', sans-serif" }}
            >
              {formatBRL(posicaoTotal)}
            </span>
          </div>
        )}

        {/* Navegação de mês */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setFiltroMes(m => navegarMes(m, -1))}
            className="p-1.5 rounded transition-opacity hover:opacity-60"
            style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
            {formatPeriodo(filtroMes + "-01")}
          </span>
          <button
            onClick={() => setFiltroMes(m => navegarMes(m, +1))}
            className="p-1.5 rounded transition-opacity hover:opacity-60"
            style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {filtroMes !== mesAtual() && (
            <button
              onClick={() => setFiltroMes(mesAtual())}
              className="text-xs ml-1"
              style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}
            >
              Hoje
            </button>
          )}
          <span className="ml-auto text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
            {lancamentosFiltrados.length} lançamentos
          </span>
        </div>

        {/* Filtro rápido */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {([
            { value: "todos",    label: "Todos"    },
            { value: "entrada",  label: "Entradas" },
            { value: "saida",    label: "Saídas"   },
            { value: "previsto", label: "Previstos" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltro(value)}
              className="px-3 py-1 rounded-full text-xs transition-all"
              style={{
                background: filtro === value ? "var(--gold-dim)" : "var(--bg-card)",
                color:      filtro === value ? "var(--gold)" : "var(--text-3)",
                border:     `1px solid ${filtro === value ? "rgba(200,145,42,0.3)" : "var(--border)"}`,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: filtro === value ? 500 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Nenhum lançamento neste mês
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs"
              style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}
            >
              + Adicionar o primeiro
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grupos.map(({ data, itens }) => {
              const saldoDia = saldosPorDia.get(data);
              return (
                <div key={data}>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif", fontSize: "0.65rem" }}
                    >
                      {formatDataDia(data)}
                    </p>
                    {saldoDia !== undefined && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: saldoDia >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'Outfit', sans-serif" }}
                      >
                        {formatBRL(saldoDia)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {itens.map((l) => (
                      <LancamentoItem
                        key={l.id}
                        lancamento={l}
                        onEdit={handleOpenEdit}
                        onToggleRealizado={handleToggleRealizado}
                        onDelete={(id) => {
                          const item = lancamentos.find(x => x.id === id);
                          setConfirmDelete({ id, grupo: item?.recorrencia_grupo ?? null, data: item?.data ?? "" });
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile nav */}
      <div className="md:hidden">
        <MobileNav activeTab="caixa" onTabChange={(tab) => navigate(`/dashboard?tab=${tab}`)} />
      </div>

      {/* Form modal */}
      {showForm && (
        <LancamentoForm
          initialValues={editando ?? undefined}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-xl p-5 max-w-xs w-full mx-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
              Excluir este lançamento?
            </p>
            {confirmDelete.grupo && (
              <p className="text-xs mb-4" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Este lançamento faz parte de uma série recorrente.
              </p>
            )}
            {!confirmDelete.grupo && <div className="mb-4" />}

            <div className="flex flex-col gap-2">
              {confirmDelete.grupo && (
                <button
                  onClick={() => handleDeleteGrupo(confirmDelete.grupo!, confirmDelete.data)}
                  className="w-full py-2 rounded text-sm text-left px-3"
                  style={{ background: "rgba(212,88,80,0.08)", color: "var(--red)", border: "1px solid rgba(212,88,80,0.2)", fontFamily: "'Outfit', sans-serif" }}
                >
                  Excluir este e todos os futuros
                </button>
              )}
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="w-full py-2 rounded text-sm text-left px-3"
                style={{ background: "rgba(212,88,80,0.15)", color: "var(--red)", border: "1px solid rgba(212,88,80,0.3)", fontFamily: "'Outfit', sans-serif" }}
              >
                {confirmDelete.grupo ? "Excluir só este" : "Excluir"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="w-full py-2 rounded text-sm"
                style={{ background: "var(--bg-card-2)", color: "var(--text-3)", border: "1px solid var(--border)", fontFamily: "'Outfit', sans-serif" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: toast.ok ? "rgba(61,184,112,0.15)" : "rgba(212,88,80,0.12)",
            border: `1px solid ${toast.ok ? "rgba(61,184,112,0.3)" : "rgba(212,88,80,0.3)"}`,
            color: toast.ok ? "var(--green)" : "var(--red)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
