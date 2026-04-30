import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

/* ─── Inline style shortcuts tied to CSS variables ─── */
const S = {
  bg:       { background: "var(--bg)" } as React.CSSProperties,
  surface:  { background: "var(--bg-surface)" } as React.CSSProperties,
  card:     { background: "var(--bg-card)", border: "1px solid var(--border)" } as React.CSSProperties,
  gold:     { color: "var(--gold)" } as React.CSSProperties,
  goldHi:   { color: "var(--gold-hi)" } as React.CSSProperties,
  text2:    { color: "var(--text-2)" } as React.CSSProperties,
  text3:    { color: "var(--text-3)" } as React.CSSProperties,
  green:    { color: "var(--green)" } as React.CSSProperties,
  red:      { color: "var(--red)" } as React.CSSProperties,
  border:   { borderColor: "var(--border)" } as React.CSSProperties,
  mono:     { fontFamily: "'DM Mono', monospace", fontFeatureSettings: '"tnum"' } as React.CSSProperties,
  display:  { fontFamily: "'Cormorant', Georgia, serif" } as React.CSSProperties,
};

function GoldRule({ width = 40 }: { width?: number }) {
  return (
    <span
      style={{
        display: "block",
        width,
        height: 1,
        background: "var(--gold)",
        marginBottom: "1.5rem",
      }}
    />
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive = true,
  delay = 0,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="anim-slide-up p-2.5 sm:p-4 rounded-md flex flex-col gap-1"
      style={{
        background: "var(--bg-card-2)",
        border: "1px solid var(--border-soft)",
        animationDelay: `${delay}s`,
      }}
    >
      <span className="text-xs font-body uppercase tracking-widest truncate" style={S.text3}>
        {label}
      </span>
      <span
        className="leading-none"
        style={{ ...S.mono, color: "var(--text)", fontWeight: 400, fontSize: "clamp(0.9rem, 4vw, 1.5rem)" }}
      >
        {value}
      </span>
      <span
        className="text-xs font-mono-data truncate"
        style={{ color: positive ? "var(--green)" : "var(--red)" }}
      >
        {positive ? "▲" : "▼"} {delta}
      </span>
    </div>
  );
}

/* ─── Mock chart bars ─── */
function MiniBarChart() {
  const bars = [55, 62, 58, 71, 68, 79, 84];
  const profits = [11, 13, 10, 16, 14, 19, 22];
  return (
    <div
      className="rounded-md p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)" }}
    >
      <div
        className="text-xs uppercase tracking-widest mb-3"
        style={{ ...S.text3, fontFamily: "'Outfit', sans-serif" }}
      >
        Resultado — 7 meses
      </div>
      <div className="flex items-end gap-1.5" style={{ height: 60 }}>
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
            <div
              className="w-full rounded-sm"
              style={{ height: `${(profits[i] / 84) * 60}px`, background: "var(--green)", opacity: 0.8 }}
            />
            <div
              className="w-full rounded-sm"
              style={{ height: `${(h / 84) * 60}px`, background: "var(--gold)", opacity: 0.35 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {[["var(--gold)", "Receita"], ["var(--green)", "Lucro"]].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5 text-xs" style={S.text2}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: c as string }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Full dashboard preview mockup ─── */
function DashboardMockup() {
  return (
    <div
      className="rounded-lg overflow-hidden anim-slide-up delay-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Mockup top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27C93F" }} />
        </div>
        <span className="text-xs" style={S.text3}>FinBoard · Resultado do Mês</span>
        <span className="text-xs font-mono-data" style={S.gold}>Nov/25</span>
      </div>

      <div className="flex" style={{ minHeight: 220 }}>
        {/* Mini sidebar — hidden on mobile */}
        <div
          className="hidden sm:flex flex-col gap-1 p-3"
          style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", width: 130 }}
        >
          <span
            className="font-display text-base mb-3 block"
            style={{ ...S.gold, letterSpacing: "0.04em" }}
          >
            FinBoard
          </span>
          {["Resultado", "Margem", "Caixa", "Resumo"].map((item, i) => (
            <div
              key={item}
              className="text-xs px-2 py-1.5 rounded"
              style={{
                color: i === 0 ? "var(--gold)" : "var(--text-3)",
                background: i === 0 ? "var(--gold-dim)" : "transparent",
                borderLeft: i === 0 ? "2px solid var(--gold)" : "2px solid transparent",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          <div className="grid grid-cols-2 gap-2">
            <KpiCard label="Receita Líquida"   value="R$ 127K"  delta="8,4% vs mês ant."  positive />
            <KpiCard label="Lucro do Mês"       value="R$ 19,3K" delta="12,1% vs mês ant." positive delay={0.07} />
            <KpiCard label="Margem Real"         value="15,2%"   delta="1,1 p.p."          positive delay={0.14} />
            <KpiCard label="Geração de Caixa"   value="R$ 23K"  delta="3,2% vs mês ant."  positive delay={0.21} />
          </div>
          <MiniBarChart />
        </div>
      </div>
    </div>
  );
}

/* ─── Section label ─── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs uppercase tracking-widest mb-4"
      style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
    >
      {children}
    </span>
  );
}

/* ─── Feature block ─── */
function Feature({
  number,
  question,
  desc,
  items,
  delay = 0,
}: {
  number: string;
  question: string;
  desc: string;
  items: string[];
  delay?: number;
}) {
  return (
    <div
      className="anim-slide-up p-6 flex flex-col gap-4 rounded-md"
      style={{ ...S.card, animationDelay: `${delay}s` }}
    >
      <span
        className="font-display text-5xl leading-none"
        style={{ color: "var(--border)", fontWeight: 300 }}
      >
        {number}
      </span>
      <h3
        className="font-display text-2xl leading-tight"
        style={{ color: "var(--text)", fontWeight: 400 }}
      >
        {question}
      </h3>
      <p className="text-sm leading-relaxed" style={S.text2}>
        {desc}
      </p>
      <ul className="flex flex-col gap-2 mt-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm" style={S.text2}>
            <Check size={13} style={{ ...S.gold, marginTop: 3, flexShrink: 0 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── PDF template mini-mockup card ─── */
function TemplateCard({
  name,
  desc,
  badge,
  accentColor,
  mockup,
}: {
  name: string;
  desc: string;
  badge: string;
  accentColor: string;
  mockup: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-md"
      style={{ ...S.card }}
    >
      {/* Mini document preview */}
      <div
        style={{
          width: "100%",
          height: 96,
          background: "#f9f8f6",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #e0ddd8",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accentColor }} />
        <div style={{ padding: "8px 8px 0", marginTop: 3 }}>{mockup}</div>
      </div>
      {/* Info */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}
          >
            {name}
          </span>
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
            style={{
              color: accentColor,
              background: "var(--bg-card-2)",
              border: `1px solid ${accentColor}30`,
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.04em",
            }}
          >
            {badge}
          </span>
        </div>
        <p
          className="text-xs mt-1.5 leading-relaxed"
          style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

/* Tiny reusable mockup lines */
function Row({ w1 = 3, w2 = 1, w3 = 1, shade = false }: { w1?: number; w2?: number; w3?: number; shade?: boolean }) {
  const bg = shade ? "#e8e6e0" : "#eeece8";
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
      <div style={{ flex: w1, height: 4, background: bg, borderRadius: 1 }} />
      <div style={{ flex: w2, height: 4, background: "#d8d6d0", borderRadius: 1 }} />
      <div style={{ flex: w3, height: 4, background: "#d8d6d0", borderRadius: 1 }} />
    </div>
  );
}

/* ─── Testimonial ─── */
function Testimonial({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-md" style={S.card}>
      <GoldRule width={28} />
      <p className="font-display text-lg leading-snug italic" style={{ color: "var(--text)", fontWeight: 300 }}>
        "{quote}"
      </p>
      <div>
        <p className="text-sm font-body" style={{ color: "var(--text)", fontWeight: 500 }}>{author}</p>
        <p className="text-xs mt-0.5" style={S.text3}>{role}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate("/auth");

  return (
    <div style={S.bg}>
      {/* ── PROMO BANNER ── */}
      <div
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm"
        style={{
          background: "var(--gold)",
          color: "var(--bg)",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 500,
        }}
      >
        <span>🎉 Oferta de lançamento — acesso vitalício por</span>
        <span style={{ textDecoration: "line-through", opacity: 0.65, fontWeight: 400 }}>R$ 197</span>
        <strong>R$ 98,60</strong>
        <span style={{ opacity: 0.75, fontWeight: 400 }}>· Apenas este mês</span>
        <button
          onClick={go}
          className="ml-2 px-3 py-1 rounded text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--bg)", color: "var(--gold)" }}
        >
          Garantir →
        </button>
      </div>

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          background: "rgba(10,10,12,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <span
          className="font-display text-xl tracking-wide"
          style={{ ...S.gold, fontWeight: 400, letterSpacing: "0.06em" }}
        >
          FinBoard
        </span>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost text-sm"
            onClick={() => navigate("/demo")}
          >
            Demo ao vivo →
          </button>
          <button className="btn btn-outline-gold text-sm" onClick={go}>
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Começar por R$ 98,60</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6"
        style={{
          minHeight: "92vh",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(200,145,42,0.07) 0%, transparent 70%), var(--bg)",
          paddingTop: "clamp(3rem, 10vh, 6rem)",
          paddingBottom: "clamp(2.5rem, 6vh, 5rem)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="anim-fade flex justify-center mb-6">
            <span
              className="text-xs uppercase tracking-widest px-3 py-1 rounded-full font-body"
              style={{
                color: "var(--gold)",
                background: "var(--gold-dim)",
                border: "1px solid rgba(200,145,42,0.2)",
              }}
            >
              Para donos de PME · Sem controller · Sem complicação
            </span>
          </div>

          <h1
            className="anim-slide-up delay-1 font-display leading-none mb-6"
            style={{
              fontSize: "clamp(3.2rem, 8vw, 6.5rem)",
              fontWeight: 300,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Você sabe exatamente<br />
            <em style={{ ...S.goldHi, fontStyle: "italic" }}>quanto sobrou</em><br />
            este mês?
          </h1>

          <p
            className="anim-slide-up delay-2 font-body text-lg leading-relaxed mx-auto mb-10"
            style={{ ...S.text2, maxWidth: 520 }}
          >
            O FinBoard transforma os números da sua empresa em respostas claras —
            resultado real, margem, caixa. Tudo em 10 minutos.
          </p>

          <div className="anim-slide-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="btn btn-gold text-base px-8 py-3.5" onClick={go}>
              Entender meu negócio
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost text-sm" onClick={() => navigate("/demo")}>
              Ver demonstração
            </button>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="w-full max-w-3xl mx-auto mt-12 sm:mt-20 px-3 sm:px-4">
          <DashboardMockup />
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--bg))",
          }}
        />
      </section>

      {/* ── PAIN SECTION ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.surface}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Label>A realidade de quem não tem controller</Label>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                lineHeight: 1.15,
              }}
            >
              Reconhece alguma dessas situações?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                emoji: "😰",
                title: "O dinheiro some",
                desc: "Você faturou bem, mas no fim do mês não sabe onde foi o dinheiro. O caixa não bate com o faturamento.",
              },
              {
                emoji: "📊",
                title: "Relatório ilegível",
                desc: "Seu contador manda um balancete enorme que você não consegue ler. Você acena com a cabeça e finge que entendeu.",
              },
              {
                emoji: "❓",
                title: "Decisão no escuro",
                desc: "Você precisa decidir se contrata, investe ou corta — mas não tem clareza se está lucrando de verdade.",
              },
            ].map((p, i) => (
              <div
                key={p.title}
                className="p-6 rounded-md flex flex-col gap-3"
                style={{ ...S.card, animationDelay: `${i * 0.1}s` }}
              >
                <span style={{ fontSize: 36 }}>{p.emoji}</span>
                <h3 className="font-display text-xl" style={{ color: "var(--text)", fontWeight: 400 }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={S.text2}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.bg}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <Label>4 respostas que você vai ter toda semana</Label>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                lineHeight: 1.15,
                maxWidth: 600,
              }}
            >
              Não gráficos. <em style={{ ...S.goldHi, fontStyle: "italic" }}>Respostas.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Feature
              number="01"
              question="Quanto sobrou no mês?"
              desc="Resultado completo: o que entrou, o que saiu, o que sobrou. Com a margem real — não o faturamento bruto que o banco mostra."
              items={["Resultado mês a mês automaticamente", "Comparativo com período anterior", "Evolução dos últimos 12 meses"]}
              delay={0}
            />
            <Feature
              number="02"
              question="Minha margem está caindo?"
              desc="Tendência das margens ao longo do tempo. Se alguma despesa está crescendo mais que a receita, você vê antes de virar problema."
              items={["Margem bruta, operacional e líquida", "Gráfico de tendência mensal", "Variação colorida — sobe verde, cai vermelho"]}
              delay={0.1}
            />
            <Feature
              number="03"
              question="Onde o dinheiro está indo?"
              desc="Separação entre entradas e saídas do caixa mês a mês. Entenda se a empresa gera ou consome caixa na operação."
              items={["Entradas vs saídas mensais", "Geração de caixa operacional", "Saldo acumulado do período"]}
              delay={0.2}
            />
            <Feature
              number="04"
              question="Como apresento para o banco ou sócio?"
              desc="Painel executivo em uma tela, pronto para reunião. Escolha entre 5 modelos de PDF ou baixe a planilha Excel — parece trabalho de semanas, feito em segundos."
              items={["5 modelos de PDF: Cartão Executivo, DRE, Margens, Completo, Caixa", "Planilha Excel formatada com 4 abas", "Formato profissional sem esforço extra"]}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── EXPORT DIFFERENTIATOR ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.surface}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-14 items-end">
            <div>
              <Label>Relatórios prontos para impressionar</Label>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  fontWeight: 300,
                  color: "var(--text)",
                  lineHeight: 1.15,
                }}
              >
                5 modelos de PDF.<br />
                Planilha Excel<br />
                <em style={{ ...S.goldHi, fontStyle: "italic" }}>formatada.</em>
              </h2>
            </div>
            <div>
              <p className="text-base leading-relaxed mb-4" style={S.text2}>
                Escolha o formato certo para cada situação — reunião com sócio,
                apresentação ao banco, análise interna ou envio ao contador.
                Tudo gerado com um clique, sem instalar nada extra.
              </p>
              <div className="flex items-center gap-2 text-sm" style={S.text3}>
                <span style={{ ...S.gold, fontSize: "1rem" }}>✓</span>
                <span style={{ fontFamily: "'Outfit', sans-serif" }}>Funciona direto no navegador · sem software · sem assinatura extra</span>
              </div>
            </div>
          </div>

          {/* Template cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <TemplateCard
              name="Cartão Executivo"
              desc="4 KPIs em destaque com variação MoM e margens. Leitura rápida para reuniões de 10 minutos."
              badge="PDF · 1 pág"
              accentColor="var(--gold)"
              mockup={
                <>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    {["#f5f0e8","#edf4ee","#f5f0e8","#edf4ee"].map((bg, i) => (
                      <div key={i} style={{ flex: 1, height: 28, background: bg, borderRadius: 2, border: "1px solid #e4e0d8" }}>
                        <div style={{ height: 3, background: i % 2 === 0 ? "#c8a020" : "#1e7a44", borderRadius: "2px 2px 0 0" }} />
                        <div style={{ padding: "3px 4px" }}>
                          <div style={{ height: 3, width: "70%", background: "#d8d4cc", borderRadius: 1, marginBottom: 2 }} />
                          <div style={{ height: 5, width: "85%", background: "#b0a890", borderRadius: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Row w1={4} w2={1} w3={1} />
                  <Row w1={4} w2={1} w3={1} shade />
                  <Row w1={4} w2={1} w3={1} />
                </>
              }
            />
            <TemplateCard
              name="DRE Gerencial"
              desc="16 linhas completas × todos os meses + coluna YTD. A DRE que o contador manda, em formato legível."
              badge="PDF · 1-2 págs"
              accentColor="var(--gold)"
              mockup={
                <>
                  <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                    <div style={{ flex: 3, height: 4, background: "#b8a060", borderRadius: 1 }} />
                    {[1,1,1,1].map((_,i) => (
                      <div key={i} style={{ flex: 1, height: 4, background: "#d8d4cc", borderRadius: 1 }} />
                    ))}
                  </div>
                  {[false, false, true, false, false, false, true, false, true].map((sub, i) => (
                    <div key={i} style={{ display: "flex", gap: 2, marginBottom: 2, background: sub ? "rgba(184,129,30,0.08)" : "transparent" }}>
                      <div style={{ flex: 3, height: 3, background: sub ? "#c8a060" : "#dedad4", borderRadius: 1 }} />
                      {[1,1,1,1].map((_,j) => (
                        <div key={j} style={{ flex: 1, height: 3, background: sub ? "#c8b080" : "#e4e0dc", borderRadius: 1 }} />
                      ))}
                    </div>
                  ))}
                </>
              }
            />
            <TemplateCard
              name="Análise de Margens"
              desc="Evolução mensal das 3 margens com células coloridas, setas de variação e colunas Melhor/Pior."
              badge="PDF · 1 pág"
              accentColor="var(--green)"
              mockup={
                <>
                  <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    {[["#c8a020","#f5f0e8"],["#1e7a44","#edf4ee"],["#3a6ec8","#ecf0f9"]].map(([c,bg],i) => (
                      <div key={i} style={{ flex: 1, height: 22, background: bg, borderRadius: 3, border: `2px solid ${c}`, overflow: "hidden" }}>
                        <div style={{ height: 3, background: c }} />
                        <div style={{ padding: "2px 3px" }}>
                          <div style={{ height: 6, width: "80%", background: c, borderRadius: 1, opacity: 0.7 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {[["#e8f4ec","#edf9f1"],["transparent","#f5faf7"],["#e8f4ec","#edf9f1"]].map((row,i) => (
                    <div key={i} style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                      <div style={{ flex: 2, height: 4, background: "#d8d4cc", borderRadius: 1 }} />
                      {row.map((bg, j) => (
                        <div key={j} style={{ flex: 1, height: 4, background: bg || "#e8e4dc", borderRadius: 1, border: bg !== "transparent" ? "1px solid #90c8a0" : "none" }} />
                      ))}
                      <div style={{ flex: 1, height: 4, background: "#ffe8e8", borderRadius: 1 }} />
                    </div>
                  ))}
                </>
              }
            />
            <TemplateCard
              name="Relatório Completo"
              desc="3 páginas: capa elegante + painel de KPIs + DRE condensada + fluxo de caixa. Ideal para conselho ou investidores."
              badge="PDF · 3 págs"
              accentColor="var(--gold)"
              mockup={
                <>
                  <div style={{ textAlign: "center", paddingTop: 4 }}>
                    <div style={{ fontSize: 18, color: "#c8a020", fontFamily: "Georgia, serif", lineHeight: 1, marginBottom: 4, opacity: 0.5 }}>FB</div>
                    <div style={{ height: 5, width: "60%", background: "#b8a060", borderRadius: 2, margin: "0 auto 3px" }} />
                    <div style={{ height: 3, width: "40%", background: "#d8d4cc", borderRadius: 2, margin: "0 auto 6px" }} />
                    <div style={{ height: 1, width: "80%", background: "#c8a020", margin: "0 auto 3px", opacity: 0.4 }} />
                    <div style={{ height: 3, width: "55%", background: "#e8e4dc", borderRadius: 2, margin: "0 auto" }} />
                  </div>
                </>
              }
            />
            <TemplateCard
              name="Fluxo de Caixa"
              desc="Entradas, saídas e FCO mensais com saldo acumulado. Para mostrar se a empresa gera ou consome caixa."
              badge="PDF · 1 pág"
              accentColor="var(--green)"
              mockup={
                <>
                  <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    {[["#1e7a44","#edf4ee"],["#b03028","#fdf2f2"],["#1e7a44","#edf4ee"]].map(([c,bg],i) => (
                      <div key={i} style={{ flex: 1, height: 22, background: bg, borderRadius: 2, borderLeft: `3px solid ${c}`, padding: "3px 4px" }}>
                        <div style={{ height: 3, width: "70%", background: "#d8d4cc", borderRadius: 1, marginBottom: 2 }} />
                        <div style={{ height: 5, width: "85%", background: c, borderRadius: 1, opacity: 0.6 }} />
                      </div>
                    ))}
                  </div>
                  <Row w1={3} w2={1} w3={1} />
                  <Row w1={3} w2={1} w3={1} shade />
                  <Row w1={3} w2={1} w3={1} />
                  <Row w1={3} w2={1} w3={1} shade />
                </>
              }
            />
            {/* Excel card */}
            <div
              className="flex flex-col gap-3 p-4 rounded-md"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 96,
                  background: "rgba(30,122,68,0.06)",
                  borderRadius: 4,
                  border: "1px solid rgba(30,122,68,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, width: 64 }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: 10,
                        borderRadius: 1,
                        background: i < 4 ? "rgba(30,122,68,0.5)" : i === 0 || i === 4 || i === 8 || i === 12 ? "rgba(30,122,68,0.3)" : "rgba(30,122,68,0.15)",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.65rem", color: "var(--green)", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.1em", opacity: 0.8 }}>
                  .xlsx
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                    Planilha Excel
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      color: "var(--green)",
                      background: "var(--bg-card-2)",
                      border: "1px solid rgba(30,122,68,0.25)",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "0.6rem",
                    }}
                  >
                    XLSX · 4 abas
                  </span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                  Resumo, DRE, Margens e Fluxo de Caixa — com formatação `#,##0` e fórmulas prontas.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom callout */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-md mt-6"
            style={{
              background: "var(--gold-dim)",
              border: "1px solid rgba(200,145,42,0.18)",
            }}
          >
            <div className="text-3xl">🖨️</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                Gerado no navegador, salvo como PDF pelo próprio sistema operacional.
              </p>
              <p className="text-xs mt-1" style={{ ...S.text3, fontFamily: "'Outfit', sans-serif" }}>
                Sem Adobe, sem Google Drive, sem extensões. Um clique no botão "Exportar" e escolha o modelo.
              </p>
            </div>
            <button className="btn btn-gold whitespace-nowrap text-sm" onClick={go}>
              Ver na prática <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.surface}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <Label>Sem complicação</Label>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                lineHeight: 1.15,
              }}
            >
              Do zero ao painel em 10 minutos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "01",
                emoji: "⚡",
                title: "Veja um exemplo real imediatamente",
                desc: "Ao entrar, o FinBoard carrega um painel de demonstração completo. Você entende tudo antes de inserir qualquer número.",
              },
              {
                step: "02",
                emoji: "📁",
                title: "Importe a planilha do seu contador",
                desc: "Baixe nosso modelo CSV, peça ao contador preencher, faça upload. Seus 12 meses aparecem instantaneamente.",
              },
              {
                step: "03",
                emoji: "📈",
                title: "Saiba toda semana como está seu negócio",
                desc: "No fechamento de cada mês, atualiza em 5 minutos. Você passa a tomar decisões com base em números reais.",
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-3">
                <span
                  className="font-display text-6xl leading-none"
                  style={{ color: "var(--border)", fontWeight: 300 }}
                >
                  {s.step}
                </span>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                <h3
                  className="font-display text-xl"
                  style={{ color: "var(--text)", fontWeight: 400 }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={S.text2}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CSV callout */}
          <div
            className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-md"
            style={{
              background: "var(--gold-dim)",
              border: "1px solid rgba(200,145,42,0.2)",
            }}
          >
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h3
                className="font-display text-xl mb-1"
                style={{ color: "var(--text)", fontWeight: 400 }}
              >
                Importação via planilha CSV
              </h3>
              <p className="text-sm" style={S.text2}>
                Você não digita nada manualmente. Passa o modelo para o seu contador, ele preenche
                com os dados do DRE, você faz upload. 12 meses de uma vez.
              </p>
            </div>
            <button className="btn btn-gold whitespace-nowrap" onClick={go}>
              Baixar modelo <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        className="py-12 sm:py-20 md:py-28 px-4 sm:px-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(200,145,42,0.04) 0%, transparent 70%), var(--bg)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <Label>Quem já usa</Label>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 300,
                color: "var(--text)",
                lineHeight: 1.15,
              }}
            >
              O que mudou para quem <em style={{ ...S.goldHi, fontStyle: "italic" }}>entendeu</em><br />
              os próprios números
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Testimonial
              quote="Sempre achei que estava bem porque o faturamento crescia. O FinBoard me mostrou que minha margem caiu 8 pontos em 4 meses. Renegociei fornecedores antes de ficar sem caixa."
              author="Marcos T."
              role="Distribuidora de alimentos · MG · R$ 8M/ano"
            />
            <Testimonial
              quote="Meu contador mandava relatório todo mês e eu não entendia nada. Com o FinBoard finalmente vi, em gráfico, onde o dinheiro da empresa estava indo."
              author="Claudia R."
              role="Clínica odontológica · SP · 3 unidades"
            />
            <Testimonial
              quote="Fui ao banco pedir crédito e apresentei o painel executivo do FinBoard. O gerente ficou impressionado. Consegui o crédito na primeira tentativa."
              author="Rafael M."
              role="Construtora · RS · R$ 5M/ano"
            />
          </div>
        </div>
      </section>

      {/* ── DEMO CTA ── */}
      <section
        className="py-10 sm:py-16 md:py-20 px-4 sm:px-6"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,145,42,0.05) 0%, transparent 70%), var(--bg)",
        }}
      >
        <div
          className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8 p-8 rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(200,145,42,0.25)",
            boxShadow: "0 0 0 1px var(--gold-dim)",
          }}
        >
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest mb-2 font-body" style={S.gold}>
              Sem cadastro · Sem cartão
            </p>
            <h3
              className="font-display mb-2"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "var(--text)", lineHeight: 1.2 }}
            >
              Veja o painel funcionando<br />
              <em style={{ ...S.goldHi, fontStyle: "italic" }}>agora mesmo</em>
            </h3>
            <p className="text-sm" style={S.text2}>
              Explore todos os gráficos e recursos com dados reais de uma distribuidora.
              Leva menos de 30 segundos para entender se é para você.
            </p>
          </div>
          <button
            className="btn btn-gold text-base px-8 py-3.5 whitespace-nowrap"
            onClick={() => navigate("/demo")}
          >
            Abrir demo ao vivo
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.surface}>
        <div className="max-w-lg mx-auto text-center">
          <Label>Investimento</Label>
          <h2
            className="font-display mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              color: "var(--text)",
            }}
          >
            Um pagamento.<br />Clareza para sempre.
          </h2>

          <div
            className="p-8 rounded-md mt-10"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 0 0 1px var(--gold-dim), 0 24px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Price */}
            <div className="mb-2">
                <div className="flex items-center gap-3 mb-1">
                <span
                  className="font-mono-data"
                  style={{ fontSize: "1.1rem", textDecoration: "line-through", color: "var(--text-3)" }}
                >
                  R$ 197
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                  style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid rgba(184,129,30,0.3)" }}
                >
                  −50%
                </span>
              </div>
              <div>
                <span className="font-mono-data text-sm" style={{ color: "var(--text-2)" }}>R$</span>
                <span
                  className="font-display"
                  style={{ fontSize: "5rem", fontWeight: 300, color: "var(--text)", lineHeight: 1, marginLeft: 4 }}
                >
                  98,60
                </span>
              </div>
            </div>
            <p className="text-sm mb-8" style={S.text2}>
              oferta de lançamento · uma única vez · sem mensalidade
            </p>

            <ul className="flex flex-col gap-3 text-left mb-8">
              {[
                "Resultado do mês (DRE Gerencial)",
                "Análise de margem bruta, operacional e líquida",
                "Fluxo de caixa realizado",
                "Painel executivo para reuniões",
                "Importação via CSV (modelo incluso)",
                "Demo com dados reais ao entrar",
                "5 modelos de PDF + planilha Excel (4 abas)",
                "7 dias de garantia incondicional",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-2)" }}>
                  <Check size={13} style={S.gold} />
                  {item}
                </li>
              ))}
            </ul>

            <button
              className="btn btn-gold w-full justify-center text-base py-3.5"
              onClick={go}
            >
              Entender meu negócio agora
              <ArrowRight size={16} />
            </button>

            <p className="text-xs mt-4" style={S.text3}>
              Oferta válida este mês · PIX, Boleto ou Cartão · 7 dias de garantia
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-20 md:py-28 px-4 sm:px-6" style={S.bg}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <Label>Dúvidas</Label>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 300,
                color: "var(--text)",
              }}
            >
              Perguntas frequentes
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: "Preciso saber de contabilidade para usar?",
                a: "Não. O FinBoard foi feito para donos de negócio, não para contadores. Tudo é explicado em linguagem simples e os cálculos são automáticos.",
              },
              {
                q: "Como coloco meus dados?",
                a: "Baixe nosso modelo CSV, passe para o contador preencher com os dados do DRE, e faça upload. 12 meses de uma vez. Leva menos de 5 minutos.",
              },
              {
                q: "E se eu não tiver contador?",
                a: "Também funciona. O formulário manual permite inserir os valores diretamente. Se você tem receita, custos e despesas anotados em qualquer lugar, consegue colocar aqui.",
              },
              {
                q: "Para qual tamanho de empresa?",
                a: "PMEs com faturamento entre R$ 2M e R$ 15M/ano que não têm um departamento financeiro estruturado. Se você é o dono e quer entender os números sem depender de relatórios complexos, é para você.",
              },
              {
                q: "E se não gostar?",
                a: "7 dias de garantia incondicional. Se por qualquer motivo não atender, devolvemos 100% do valor — sem perguntas.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-md"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <summary
                  className="flex items-center justify-between p-5 cursor-pointer font-body font-medium text-sm select-none"
                  style={{ color: "var(--text)" }}
                >
                  {faq.q}
                  <span
                    className="ml-4 flex-shrink-0 transition-transform group-open:rotate-45"
                    style={S.gold}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="px-5 pb-5 text-sm leading-relaxed"
                  style={S.text2}
                >
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPORTE ── */}
      <section className="py-8 px-4 sm:px-6" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-2xl mx-auto">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-md"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="font-medium text-sm mb-1" style={{ color: "var(--text)", fontFamily: "'Outfit', sans-serif" }}>
                Problema com login ou pagamento?
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
                Não consegue acessar sua conta ou teve algum erro na compra? Nossa equipe resolve.
              </p>
            </div>
            <button
              onClick={() => navigate("/suporte")}
              className="btn btn-ghost text-sm whitespace-nowrap flex-shrink-0"
            >
              Falar com suporte
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-14 sm:py-24 md:py-32 px-4 sm:px-6 text-center"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(200,145,42,0.06) 0%, transparent 70%), var(--bg-surface)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <GoldRule width={40} />
          <h2
            className="font-display mb-6"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 300,
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            Faturamento não é lucro.<br />
            <em style={{ ...S.goldHi, fontStyle: "italic" }}>Agora você vai saber a diferença.</em>
          </h2>
          <p className="text-base mb-10" style={S.text2}>
            <span style={{ textDecoration: "line-through", opacity: 0.5 }}>R$ 197</span>
            {" "}<strong style={{ color: "var(--gold)" }}>R$ 98,60</strong> · Acesso imediato · 7 dias de garantia
          </p>
          <button className="btn btn-gold text-base px-10 py-4" onClick={go}>
            Quero entender meu negócio
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}
      >
        <span className="font-display text-base" style={S.gold}>
          FinBoard
        </span>
        <span>© {new Date().getFullYear()} FinBoard. Todos os direitos reservados.</span>
        <div className="flex gap-5">
          {[
            { label: "Termos de Uso", href: "/termos" },
            { label: "Privacidade",   href: "/privacidade" },
            { label: "Suporte",       href: "/suporte" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{ color: "var(--text-3)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
