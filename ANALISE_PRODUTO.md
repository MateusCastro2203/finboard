# FinBoard — Documento Analítico do Produto
**Versão:** 1.0 · **Data:** Abril 2026 · **Classificação:** Interno

---

## 1. O que é o produto

O FinBoard é uma plataforma web voltada para controllers e CFOs de pequenas e médias empresas (faturamento entre R$ 3M e R$ 50M/ano) que hoje fazem análise financeira gerencial manualmente, em planilhas de Excel.

O produto entrega quatro módulos de análise financeira conectados entre si:

- **DRE Gerencial** — estrutura completa de resultado (Receita Bruta → Lucro Líquido), com cálculo automático de todas as linhas e margens
- **Análise de Margem** — evolução gráfica das três margens principais (Bruta, EBITDA, Líquida) ao longo do tempo
- **Fluxo de Caixa** — separação entre entradas e saídas operacionais com geração de caixa mensal
- **Painel Executivo** — visão consolidada para apresentação em reunião de board, com exportação em PDF

O modelo de venda é pagamento único de R$ 297, com acesso vitalício. Sem mensalidade.

---

## 2. Como o usuário experimenta o produto

A jornada completa tem cinco momentos:

**Momento 1 — Descoberta**
O usuário chega à landing page, que apresenta o produto com um mockup do dashboard, quatro blocos de feature, depoimentos e a tabela de preço. Todos os botões na página levam para o cadastro.

**Momento 2 — Cadastro**
O usuário informa nome, e-mail e senha. O sistema cria a conta e envia um e-mail de confirmação. Após confirmar o e-mail, o usuário é direcionado para a tela de checkout.

**Momento 3 — Pagamento**
Na tela de checkout há um resumo do que está sendo comprado e um botão que redireciona para o ambiente de pagamento do Mercado Pago. O usuário paga por PIX, boleto ou cartão. Após o pagamento, o Mercado Pago notifica o FinBoard automaticamente e o acesso é liberado.

**Momento 4 — Configuração**
O usuário, agora com acesso, entra no painel e é direcionado para inserir os dados da empresa. O formulário de entrada de dados pede os valores mensais de cada linha da DRE (Receita Bruta, CMV, Despesas de Pessoal, etc.). Leva entre 20 e 30 minutos para inserir um histórico de 12 meses.

**Momento 5 — Uso contínuo**
Com os dados inseridos, o usuário navega entre os quatro módulos pela barra lateral. No início de cada mês, atualiza com os dados do mês fechado — processo que leva menos de 10 minutos. O Painel Executivo pode ser exportado para PDF e levado para reuniões.

---

## 3. Como o produto está estruturado

### 3.1 Três camadas que compõem o sistema

**Camada de apresentação (o que o usuário vê)**
A interface foi construída com visual sóbrio e profissional — predominantemente azul-escuro e branco, sem elementos decorativos excessivos. A identidade visual é adequada para o público-alvo (profissionais financeiros corporativos). A navegação é por uma barra lateral fixa com quatro opções.

**Camada de dados (onde os dados ficam)**
Os dados dos usuários ficam armazenados em um banco de dados na nuvem (Supabase), com isolamento por usuário — ou seja, nenhum usuário vê dados de outro. Existem cinco tabelas principais: perfis de usuário, empresas, lançamentos de DRE, lançamentos de fluxo de caixa e registros de compra.

**Camada de pagamento (como o dinheiro entra)**
Ao clicar em "Pagar", o sistema cria uma ordem de pagamento no Mercado Pago e redireciona o usuário. Quando o pagamento é confirmado, o Mercado Pago envia uma notificação automática ao sistema, que então libera o acesso do usuário. Esse processo é automatizado e não requer intervenção manual.

### 3.2 O que o sistema calcula automaticamente

O usuário insere apenas os valores brutos de cada linha (ex: R$ 850.000 de Receita Bruta, R$ 110.500 de Deduções). O sistema calcula automaticamente:

- Receita Líquida = Receita Bruta − Deduções
- Lucro Bruto = Receita Líquida − CMV
- EBITDA = Lucro Bruto − (soma de todas as despesas operacionais)
- EBIT = EBITDA − Depreciação
- LAIR = EBIT + Resultado Financeiro
- Lucro Líquido = LAIR − IR e CSLL
- Margem Bruta, EBITDA e Líquida (em percentual sobre a Receita Líquida)
- Comparativo mês a mês (variação percentual)
- Acumulado do período

---

## 4. O que está funcionando bem

**Proposta de valor clara e bem comunicada**
A landing page comunica o problema ("você monta relatório no Excel na raça") e a solução de forma direta, sem jargão técnico excessivo. O copywriting é adequado para o tomador de decisão.

**Cálculos financeiros corretos**
A lógica de cálculo da DRE segue a estrutura gerencial padrão brasileira. As margens são calculadas sobre a Receita Líquida (e não Bruta), o que é o método correto. Os resultados são matematicamente precisos.

**Isolamento de dados por usuário**
O banco de dados está configurado com regras de segurança (Row Level Security) que impedem que um usuário acesse dados de outro. Isso é correto e necessário para um produto que armazena dados financeiros confidenciais.

**Fluxo de pagamento automatizado**
A liberação de acesso após o pagamento é totalmente automática — sem intervenção manual do vendedor. O sistema está preparado para escalar sem que o dono do produto precise "liberar acesso" para cada comprador.

**Exportação do Painel Executivo**
O botão de exportação para PDF funciona acionando a impressão nativa do navegador. É simples, mas funcional, e não depende de nenhum serviço externo.

---

## 5. Falhas e riscos identificados

As falhas estão organizadas em três níveis de gravidade.

---

### Nível 1 — CRÍTICOS (impedem venda ou geram problema com o comprador)

**5.1 Funcionalidades prometidas que não existem**

A landing page lista como entregues dois recursos que não foram implementados:

- *"Resumo narrativo com IA"* (Painel Executivo) — não existe nenhuma geração de texto por IA no produto atual. O painel exibe apenas gráficos e números.
- *"Benchmark por faixa de faturamento"* (Análise de Margem) — não há nenhuma base de comparação de mercado implementada.

**Risco:** Um comprador que leu a landing page e pagou esperando esses recursos vai pedir reembolso e/ou publicar crítica negativa no LinkedIn. Isso é piora da reputação, não apenas churn.

**Correção necessária:** Remover esses dois itens da landing page até serem implementados, ou adicionar uma marcação clara de "em breve".

---

**5.2 Formulário de entrada de dados não cobre o Fluxo de Caixa**

O módulo de Fluxo de Caixa existe no dashboard, mas o formulário de entrada de dados ("Inserir dados") só permite inserir lançamentos da DRE. Não há campo para registrar entradas e saídas de caixa.

**Risco:** O usuário paga R$ 297, acessa o produto, insere a DRE, vai para o módulo de Fluxo de Caixa — e vê a tela completamente vazia, sem nenhum dado, sem nenhuma explicação de como preencher. A percepção é de produto incompleto ou quebrado.

**Correção necessária:** Adicionar seção de entrada de dados de fluxo de caixa no formulário, ou desativar/ocultar o módulo de Fluxo de Caixa até ser completado.

---

**5.3 Possível falha no reconhecimento do pagamento**

A tela de confirmação de pagamento ("Pagamento confirmado!") tenta verificar automaticamente se o acesso foi liberado, mas existe uma falha na lógica: a função que ela chama para verificar o status não retorna nenhum valor utilizável — ela atualiza o estado interno mas não comunica o resultado de volta para a verificação.

**Risco prático:** O usuário paga, é redirecionado para a tela de sucesso, mas ao clicar em "Acessar meu painel" pode ser redirecionado de volta para o checkout (porque o acesso ainda não foi reconhecido pelo sistema). Isso gera dúvida de se o pagamento funcionou e pode resultar em suporte desnecessário ou dupla cobrança.

**Correção necessária:** Ajustar a lógica de verificação para que a tela de sucesso consiga de fato detectar quando o acesso foi liberado antes de permitir o acesso ao dashboard.

---

**5.4 Sem verificação de segurança no recebimento de pagamentos**

O sistema que recebe a notificação de pagamento do Mercado Pago não verifica se a notificação é genuinamente do Mercado Pago. Qualquer pessoa que conheça o endereço desse sistema e tenha o UUID de um usuário pode enviar uma notificação falsa e liberar acesso sem pagar.

**Risco:** Acesso fraudulento ao produto sem pagamento. É um vetor de ataque real, especialmente se o produto ganhar visibilidade.

**Correção necessária:** Implementar verificação de assinatura criptográfica das notificações do Mercado Pago (o MP fornece esse mecanismo).

---

### Nível 2 — IMPORTANTES (geram atrito e suporte desnecessário)

**5.5 Prova social com números fictícios**

A landing page afirma "+340 controllers já usam o FinBoard". No lançamento, esse número é zero. Depoimentos de "Renata M.", "Carlos A." e "Fernanda L." são fictícios.

**Risco:** Se um visitante perguntar ou verificar, isso destrói credibilidade. No LinkedIn, o público de controllers e CFOs é pequeno e conectado — alguém vai questionar.

**Correção necessária:** Remover ou substituir por "Seja um dos primeiros" até ter clientes reais. Incluir depoimentos reais dos primeiros compradores.

---

**5.6 Fluxo de confirmação de e-mail confuso**

Após o cadastro, o sistema exibe a mensagem "Verifique seu e-mail para confirmar". No entanto, o usuário que não confirmar o e-mail e tentar fazer login será redirecionado para o checkout, que tentará verificar a sessão — e falhará, pois a sessão ainda não está ativa. O usuário ficará preso em um loop sem mensagem de erro explicativa.

**Risco:** Taxa de abandono no momento do cadastro. Usuários que pagaram pelo anúncio chegam ao produto e travam antes de completar o pagamento.

---

**5.7 Sem suporte a múltiplas empresas (mas o banco suporta)**

O banco de dados foi projetado para suportar múltiplas empresas por usuário, mas o sistema sempre carrega apenas a primeira empresa cadastrada. Se um usuário criar uma segunda empresa (por acidente ou experimentação), seus dados da segunda empresa nunca aparecerão.

**Risco:** Confusão e perda de dados silenciosa para usuários que testem múltiplos cenários.

---

**5.8 Sem versão mobile**

O layout do dashboard usa uma barra lateral fixa que desaparece completamente em telas de celular, deixando a navegação inacessível. A landing page é responsiva (funciona no celular), mas o dashboard não.

**Risco:** Se o comprador tentar acessar em um iPhone ou Android, verá uma tela quebrada. Apresentações rápidas em reuniões frequentemente acontecem pelo celular.

---

**5.9 Sem feedback de erro no carregamento de dados**

Se o banco de dados falhar ao carregar os dados financeiros do usuário (por instabilidade de rede ou sobrecarga do servidor), o sistema simplesmente exibe a tela vazia de "Nenhum dado". O usuário não recebe nenhuma mensagem informando que houve um erro e que seus dados existem, mas não puderam ser carregados.

**Risco:** O usuário pode apagar e reinserir todos os dados achando que foram perdidos.

---

### Nível 3 — MELHORIAS (impactam qualidade e retenção, não são urgentes)

**5.10 Exportação de PDF precária**

O botão "Exportar PDF" abre a caixa de diálogo de impressão do navegador, que inclui cabeçalho do browser, URL da página, número de páginas e outros elementos indesejados. O resultado final não tem o visual profissional prometido.

**Melhoria sugerida:** Usar uma biblioteca de geração de PDF que produza um arquivo com layout controlado, sem elementos do navegador.

---

**5.11 Inserção de dados mês a mês é lenta para histórico longo**

Para inserir 12 meses de DRE histórica, o usuário precisa selecionar cada mês individualmente e preencher os 10 campos um por um. Para uma empresa com histórico de 2 anos são 24 sessões de preenchimento.

**Melhoria sugerida:** Adicionar importação via planilha CSV/Excel como funcionalidade futura, ou pelo menos permitir copiar valores de um mês para o próximo.

---

**5.12 Resultado financeiro não aceita valores negativos pelo formulário**

O campo "Resultado Financeiro" no formulário de entrada aceita apenas valores positivos (campo numérico com mínimo zero). No entanto, a maioria das PMEs tem resultado financeiro negativo (despesa financeira supera receita financeira). O usuário não consegue representar essa situação comum sem um workaround não documentado.

**Melhoria sugerida:** Permitir valores negativos no campo de Resultado Financeiro, com texto de ajuda explicando a convenção.

---

**5.13 Modelo de acesso vitalício sem receita recorrente**

O produto promete acesso vitalício por R$ 297 único, incluindo "atualizações incluídas". Isso significa que cada usuário paga uma única vez e nunca mais gera receita. O custo de infraestrutura cresce com cada novo usuário, mas a receita não.

**Risco de negócio:** Com crescimento, os custos de armazenamento e processamento podem superar a receita gerada. É um modelo sustentável apenas enquanto a base de usuários for pequena.

**Sugestão:** Avaliar migração para modelo de assinatura anual (ex: R$ 197/ano) ou plano vitalício como oferta especial de lançamento por tempo limitado, seguido de mensalidade.

---

## 6. Resumo executivo de riscos

| # | Falha | Impacto | Urgência |
|---|---|---|---|
| 5.1 | Funcionalidades prometidas inexistentes | Reembolso, reputação | **Imediato** |
| 5.2 | Fluxo de Caixa sem formulário de entrada | Produto incompleto | **Imediato** |
| 5.3 | Falha no reconhecimento do pagamento | Usuário pago sem acesso | **Imediato** |
| 5.4 | Webhook sem verificação de segurança | Fraude, acesso gratuito | **Antes do lançamento** |
| 5.5 | Prova social fictícia | Credibilidade | **Antes do lançamento** |
| 5.6 | Loop de confirmação de e-mail | Abandono no cadastro | Alta |
| 5.7 | Múltiplas empresas invisíveis | Perda de dados silenciosa | Média |
| 5.8 | Sem versão mobile | Acesso quebrado no celular | Média |
| 5.9 | Erro de carregamento sem feedback | Confusão com dados | Média |
| 5.10 | PDF com elementos do browser | Visual não profissional | Baixa |
| 5.11 | Inserção lenta de histórico | Onboarding demorado | Baixa |
| 5.12 | Campo de resultado financeiro sem negativo | Dado incorreto na DRE | Baixa |
| 5.13 | Modelo vitalício insustentável | Viabilidade a longo prazo | Baixa (agora) |

---

## 7. O que precisa acontecer antes do primeiro post no LinkedIn

Para lançar sem risco de reputação, os três itens abaixo precisam ser resolvidos antes de qualquer divulgação:

1. **Remover da landing page** os dois recursos não implementados ("resumo com IA" e "benchmark de mercado")
2. **Adicionar formulário de Fluxo de Caixa** ou esconder o módulo até estar pronto
3. **Corrigir a lógica da tela de confirmação de pagamento** para que o usuário não trave após pagar

Os demais itens podem ser resolvidos de forma incremental após as primeiras vendas.

---

*Documento gerado a partir de análise direta do código-fonte e fluxo funcional do produto.*
