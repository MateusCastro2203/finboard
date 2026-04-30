import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const UPDATED = "30 de abril de 2026";
const CONTACT = "suporte@finboard.app.br";
const URL     = "https://finboard.app.br";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-base font-medium mb-3"
        style={{ color: "var(--gold)", fontFamily: "'Outfit', sans-serif" }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed space-y-3"
        style={{ color: "var(--text-2)", fontFamily: "'Outfit', sans-serif" }}
      >
        {children}
      </div>
    </section>
  );
}

export default function Termos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
              Atualizado em {UPDATED}
            </p>
            <h1
              className="font-display text-2xl sm:text-3xl"
              style={{ color: "var(--text)", fontWeight: 400 }}
            >
              Termos de Uso
            </h1>
          </div>
        </div>

        <div
          className="p-6 sm:p-8 rounded-md mb-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >

          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar ou utilizar o FinBoard (<strong style={{ color: "var(--text)" }}>{URL}</strong>), você concorda com estes Termos de Uso em sua totalidade. Caso não concorde, não utilize o serviço.
            </p>
            <p>
              Estes Termos constituem um contrato vinculante entre você ("<strong style={{ color: "var(--text)" }}>Usuário</strong>") e o FinBoard, operado por Mateus Castro, pessoa física, com contato em <strong style={{ color: "var(--text)" }}>{CONTACT}</strong>.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              O FinBoard é uma plataforma de relatórios financeiros online (SaaS) que permite a pequenas e médias empresas visualizar DRE, Fluxo de Caixa e Análise de Margem a partir de dados inseridos pelo próprio usuário.
            </p>
            <p>
              O serviço é oferecido como uma ferramenta de apoio à gestão financeira. Não constitui serviço de consultoria financeira, contábil, jurídica ou fiscal. Os relatórios gerados são de responsabilidade exclusiva do usuário que inseriu os dados.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>
              Para utilizar o serviço, você deve criar uma conta com e-mail e senha válidos. Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades realizadas em sua conta.
            </p>
            <p>
              Você declara que as informações fornecidas no cadastro são verdadeiras, completas e atualizadas. O FinBoard pode encerrar contas com informações falsas ou que violem estes Termos.
            </p>
          </Section>

          <Section title="4. Acesso e Pagamento">
            <p>
              O FinBoard é oferecido mediante pagamento único de <strong style={{ color: "var(--text)" }}>R$ 98,60</strong> que concede acesso vitalício à plataforma, nas condições vigentes na data da compra.
            </p>
            <p>
              O pagamento é processado pelo Mercado Pago. Após confirmação do pagamento, o acesso é liberado automaticamente.
            </p>
            <p>
              Em conformidade com o art. 49 do Código de Defesa do Consumidor, compras realizadas online podem ser canceladas em até <strong style={{ color: "var(--text)" }}>7 (sete) dias corridos</strong> da data da compra, com reembolso integral. Para solicitar o cancelamento dentro do prazo, entre em contato pelo e-mail <strong style={{ color: "var(--text)" }}>{CONTACT}</strong>.
            </p>
            <p>
              Após o prazo de 7 dias, o pagamento não é reembolsável, salvo por falha técnica comprovada do serviço.
            </p>
          </Section>

          <Section title="5. Uso Aceitável">
            <p>Ao utilizar o FinBoard, você concorda em <strong style={{ color: "var(--text)" }}>não</strong>:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Utilizar o serviço para fins ilegais ou fraudulentos;</li>
              <li>Compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Tentar acessar contas ou dados de outros usuários;</li>
              <li>Realizar engenharia reversa, copiar ou reproduzir o software;</li>
              <li>Inserir dados que violem direitos de terceiros ou segredos empresariais de outras empresas.</li>
            </ul>
          </Section>

          <Section title="6. Dados e Conteúdo do Usuário">
            <p>
              Os dados financeiros que você inserir no FinBoard são de sua propriedade exclusiva. O FinBoard não reivindica qualquer direito de propriedade sobre esses dados.
            </p>
            <p>
              Ao inserir dados, você concede ao FinBoard uma licença limitada para armazená-los e processá-los exclusivamente para prestar o serviço a você.
            </p>
            <p>
              Você é responsável pela exatidão dos dados inseridos. O FinBoard não valida nem audita as informações financeiras inseridas.
            </p>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              O FinBoard, incluindo seu código, design, marca, logotipo e conteúdo, é protegido por direitos autorais e demais leis de propriedade intelectual. É proibida a reprodução parcial ou total sem autorização expressa por escrito.
            </p>
          </Section>

          <Section title="8. Disponibilidade e Limitação de Responsabilidade">
            <p>
              O FinBoard se esforça para manter o serviço disponível continuamente, mas não garante disponibilidade ininterrupta. Manutenções programadas e situações de força maior podem causar indisponibilidade temporária.
            </p>
            <p>
              O FinBoard não se responsabiliza por decisões financeiras ou empresariais tomadas com base nos relatórios gerados pela plataforma. O serviço é uma ferramenta de apoio, não um substituto para assessoria contábil ou financeira profissional.
            </p>
            <p>
              Em nenhuma hipótese a responsabilidade total do FinBoard excederá o valor pago pelo usuário pelo serviço.
            </p>
          </Section>

          <Section title="9. Alterações nos Termos">
            <p>
              O FinBoard pode atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. O uso continuado do serviço após esse prazo constitui aceitação dos novos termos.
            </p>
          </Section>

          <Section title="10. Rescisão">
            <p>
              Você pode encerrar sua conta a qualquer momento entrando em contato pelo e-mail <strong style={{ color: "var(--text)" }}>{CONTACT}</strong>. Após o encerramento, seus dados serão excluídos em até 30 dias, salvo obrigação legal de retenção.
            </p>
            <p>
              O FinBoard pode suspender ou encerrar sua conta em caso de violação destes Termos, sem aviso prévio em casos graves.
            </p>
          </Section>

          <Section title="11. Lei Aplicável e Foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Belo Horizonte — MG para dirimir quaisquer controvérsias oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para dúvidas sobre estes Termos, entre em contato pelo e-mail{" "}
              <a
                href={`mailto:${CONTACT}`}
                style={{ color: "var(--gold)", textDecoration: "none" }}
              >
                {CONTACT}
              </a>{" "}
              ou pela página de{" "}
              <a
                href="/suporte"
                style={{ color: "var(--gold)", textDecoration: "none" }}
              >
                suporte
              </a>.
            </p>
          </Section>

        </div>

        <p className="text-xs text-center" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Veja também nossa{" "}
          <a href="/privacidade" style={{ color: "var(--text-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Política de Privacidade
          </a>
        </p>

      </div>
    </div>
  );
}
