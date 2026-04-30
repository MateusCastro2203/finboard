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

export default function Privacidade() {
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
              Política de Privacidade
            </h1>
          </div>
        </div>

        <div
          className="p-6 sm:p-8 rounded-md mb-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >

          <Section title="1. Controlador dos Dados">
            <p>
              O controlador dos dados pessoais coletados pelo FinBoard é <strong style={{ color: "var(--text)" }}>Mateus Castro</strong>, pessoa física, responsável pela operação do serviço disponível em <strong style={{ color: "var(--text)" }}>{URL}</strong>.
            </p>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta Política, entre em contato pelo e-mail <a href={`mailto:${CONTACT}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{CONTACT}</a>.
            </p>
          </Section>

          <Section title="2. Dados Coletados">
            <p>Coletamos os seguintes dados para operar o serviço:</p>
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li>
                <strong style={{ color: "var(--text)" }}>Dados de cadastro:</strong> endereço de e-mail e senha (armazenada com hash seguro), nome completo.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dados da empresa:</strong> nome, CNPJ (opcional), segmento e moeda — informados voluntariamente pelo usuário.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dados financeiros:</strong> lançamentos de DRE, Fluxo de Caixa, metas e anotações inseridos pelo próprio usuário.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dados de pagamento:</strong> ID da transação e status do pagamento processado pelo Mercado Pago. Não armazenamos dados de cartão de crédito.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dados de suporte:</strong> mensagens enviadas pelo formulário de suporte (nome, e-mail, assunto e mensagem).
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Dados de uso:</strong> preferências de notificação (relatório mensal ativo/inativo).
              </li>
            </ul>
          </Section>

          <Section title="3. Finalidade e Base Legal (LGPD)">
            <p>Tratamos seus dados com as seguintes finalidades e bases legais, conforme a Lei 13.709/2018 (LGPD):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs mt-2" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--text)", fontWeight: 500 }}>Finalidade</th>
                    <th className="text-left py-2" style={{ color: "var(--text)", fontWeight: 500 }}>Base Legal</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Prestação do serviço contratado",           "Execução de contrato (Art. 7º, V)"],
                    ["Processamento de pagamento",                "Execução de contrato (Art. 7º, V)"],
                    ["Envio de e-mails transacionais (recibo, senha)", "Execução de contrato (Art. 7º, V)"],
                    ["Envio de relatório mensal",                 "Legítimo interesse / consentimento (Art. 7º, IX / II)"],
                    ["Atendimento ao suporte",                   "Legítimo interesse (Art. 7º, IX)"],
                    ["Cumprimento de obrigações legais",         "Obrigação legal (Art. 7º, II)"],
                  ].map(([fin, base]) => (
                    <tr key={fin} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-2 pr-4" style={{ color: "var(--text-2)" }}>{fin}</td>
                      <td className="py-2"       style={{ color: "var(--text-3)" }}>{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Compartilhamento com Terceiros">
            <p>Seus dados são compartilhados apenas com os fornecedores necessários para operar o serviço:</p>
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li>
                <strong style={{ color: "var(--text)" }}>Supabase Inc.</strong> — banco de dados e autenticação, hospedado nos EUA (cláusulas contratuais padrão da UE aplicadas). <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>Política de Privacidade</a>
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Mercado Pago S.A.</strong> — processamento de pagamentos. Seus dados financeiros de pagamento são regidos pela política do Mercado Pago.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Resend Inc.</strong> — envio de e-mails transacionais. O e-mail e nome do destinatário são transmitidos para entrega das mensagens.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Vercel Inc.</strong> — hospedagem da aplicação web. Não recebe dados pessoais além de metadados de requisição HTTP (IP, user-agent).
              </li>
            </ul>
            <p>
              Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de marketing.
            </p>
          </Section>

          <Section title="5. Retenção de Dados">
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são excluídos em até <strong style={{ color: "var(--text)" }}>30 dias</strong>, salvo obrigação legal de retenção (ex.: registros fiscais, que podem ser mantidos por até 5 anos).
            </p>
            <p>
              Logs de transações de pagamento são mantidos por até 5 anos para fins de conformidade fiscal.
            </p>
          </Section>

          <Section title="6. Segurança">
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Comunicação criptografada via HTTPS (TLS);</li>
              <li>Senhas armazenadas com hash seguro (bcrypt via Supabase Auth);</li>
              <li>Controle de acesso por Row-Level Security (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados;</li>
              <li>Chaves de API e segredos armazenados em variáveis de ambiente, nunca no código-fonte.</li>
            </ul>
          </Section>

          <Section title="7. Seus Direitos (LGPD — Art. 18)">
            <p>Como titular de dados, você tem os seguintes direitos, que podem ser exercidos pelo e-mail <a href={`mailto:${CONTACT}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{CONTACT}</a>:</p>
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li><strong style={{ color: "var(--text)" }}>Confirmação e acesso:</strong> saber se tratamos seus dados e obter cópia deles.</li>
              <li><strong style={{ color: "var(--text)" }}>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li><strong style={{ color: "var(--text)" }}>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade com a LGPD.</li>
              <li><strong style={{ color: "var(--text)" }}>Portabilidade:</strong> receber seus dados em formato estruturado para transferência a outro serviço.</li>
              <li><strong style={{ color: "var(--text)" }}>Revogação do consentimento:</strong> para tratamentos baseados em consentimento (ex.: relatório mensal), revogável a qualquer momento nas configurações da conta.</li>
              <li><strong style={{ color: "var(--text)" }}>Exclusão da conta:</strong> solicitar o encerramento da conta e a exclusão de todos os dados.</li>
            </ul>
            <p>
              Responderemos às solicitações em até <strong style={{ color: "var(--text)" }}>15 dias úteis</strong>.
            </p>
          </Section>

          <Section title="8. Cookies e Rastreamento">
            <p>
              O FinBoard utiliza apenas cookies essenciais para manter a sessão autenticada do usuário (gerenciados pelo Supabase Auth). Não utilizamos cookies de rastreamento, publicidade ou análise comportamental de terceiros.
            </p>
          </Section>

          <Section title="9. Transferência Internacional de Dados">
            <p>
              Seus dados são armazenados nos servidores da Supabase Inc. nos Estados Unidos. A transferência é realizada com base em cláusulas contratuais padrão que garantem nível de proteção equivalente ao exigido pela LGPD, conforme Art. 33 da Lei 13.709/2018.
            </p>
          </Section>

          <Section title="10. Alterações nesta Política">
            <p>
              Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão mais recente estará sempre disponível em <a href={`${URL}/privacidade`} style={{ color: "var(--gold)", textDecoration: "none" }}>finboard.app.br/privacidade</a>.
            </p>
          </Section>

          <Section title="11. Contato e Reclamações">
            <p>
              Para exercer seus direitos, tirar dúvidas ou registrar reclamações, entre em contato:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>E-mail: <a href={`mailto:${CONTACT}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{CONTACT}</a></li>
              <li>Formulário: <a href="/suporte" style={{ color: "var(--gold)", textDecoration: "none" }}>finboard.app.br/suporte</a></li>
            </ul>
            <p>
              Caso sua solicitação não seja atendida de forma satisfatória, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>www.gov.br/anpd</a>.
            </p>
          </Section>

        </div>

        <p className="text-xs text-center" style={{ color: "var(--text-3)", fontFamily: "'Outfit', sans-serif" }}>
          Veja também nossos{" "}
          <a href="/termos" style={{ color: "var(--text-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Termos de Uso
          </a>
        </p>

      </div>
    </div>
  );
}
