// Help Center Seed Data - 12 Chapters
// Based on docs/manual-portal-imobiliaria-tridots.md

export interface SeedChapter {
  order_index: number;
  slug: string;
  title: string;
  icon: string;
  is_new: boolean;
  sections: SeedSection[];
  faqs: SeedFaq[];
}

export interface SeedSection {
  order_index: number;
  slug: string;
  title: string;
  content: string;
  tips?: string[];
  warnings?: string[];
  see_also?: Array<{ title: string; slug: string }>;
  portal_links?: Array<{ label: string; path: string; icon?: string }>;
}

export interface SeedFaq {
  order_index: number;
  question: string;
  answer: string;
}

export const HELP_CHAPTERS: SeedChapter[] = [
  {
    order_index: 1,
    slug: "introducao",
    title: "Introdução e Primeiro Acesso",
    icon: "BookOpen",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "bem-vindo",
        title: "Bem-vindo ao Portal",
        content: `O **Portal de Imobiliárias da GarantFácil** foi desenvolvido para facilitar sua gestão de garantias locatícias. Aqui você pode:

- Solicitar análises de crédito para inquilinos
- Acompanhar o status de cada análise em tempo real
- Gerenciar seus contratos ativos
- Solicitar garantias em caso de inadimplência
- Acompanhar suas comissões

[SCREENSHOT: dashboard-overview]

O portal foi projetado para ser intuitivo e eficiente, permitindo que você gerencie todas as operações de garantia locatícia em um único lugar.`,
        tips: [
          "Salve o link do portal nos seus favoritos para acesso rápido",
          "Use um navegador atualizado para melhor experiência"
        ],
      },
      {
        order_index: 2,
        slug: "primeiro-acesso",
        title: "Primeiro Acesso",
        content: `Para acessar o portal pela primeira vez:

1. Acesse o link fornecido pela equipe GarantFácil
2. Insira seu e-mail cadastrado
3. Utilize a senha temporária enviada por e-mail
4. Na primeira vez, você será solicitado a alterar sua senha

[SCREENSHOT: login-screen]

A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números.`,
        warnings: [
          "Se não recebeu o e-mail de boas-vindas, verifique sua caixa de spam"
        ],
        portal_links: [
          { label: "Alterar Senha", path: "/settings/password", icon: "KeyRound" }
        ]
      },
      {
        order_index: 3,
        slug: "navegacao",
        title: "Navegação no Portal",
        content: `O portal é organizado com um **menu lateral** que dá acesso a todas as funcionalidades:

- **Dashboard**: Visão geral com KPIs e alertas
- **Chamados**: Comunicação com a equipe GarantFácil
- **Minhas Análises**: Acompanhamento de análises de crédito
- **Meus Contratos**: Gestão de contratos ativos
- **Garantias**: Solicitação de garantias
- **Minhas Comissões**: Acompanhamento de comissões
- **Drive Documentos**: Modelos e documentos úteis
- **Colaboradores**: Gestão da equipe

[SCREENSHOT: sidebar-menu]`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Como recupero minha senha?",
        answer: "Na tela de login, clique em **'Esqueci minha senha'** e insira seu e-mail cadastrado. Você receberá um link para redefinir sua senha."
      },
      {
        order_index: 2,
        question: "Posso acessar de dispositivos móveis?",
        answer: "Sim! O portal é responsivo e funciona em smartphones e tablets. Recomendamos o uso de navegadores atualizados."
      },
      {
        order_index: 3,
        question: "Como adiciono mais usuários da minha imobiliária?",
        answer: "Acesse **Colaboradores** no menu lateral e clique em **'Adicionar Colaborador'**. O novo usuário receberá um e-mail com as credenciais de acesso."
      }
    ]
  },
  {
    order_index: 2,
    slug: "onboarding",
    title: "Onboarding - Ativação da Conta",
    icon: "ClipboardCheck",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "documentos-necessarios",
        title: "Documentos Necessários",
        content: `Para ativar sua conta no portal, é necessário enviar os seguintes documentos:

1. **Cartão CNPJ** - Versão atualizada
2. **Certidão do CRECI** - Válida e com o número de registro
3. **Documento do Sócio** - RG ou CNH do responsável
4. **Contrato Social** - Última alteração registrada

[SCREENSHOT: documents-upload]

Todos os documentos devem estar legíveis e em formato PDF, PNG ou JPG (máximo 10MB cada).`,
        tips: [
          "Escaneie os documentos em boa qualidade para evitar rejeições",
          "Verifique se todos os dados estão visíveis antes de enviar"
        ],
        portal_links: [
          { label: "Acessar Meu Perfil", path: "/profile", icon: "UserCircle" }
        ]
      },
      {
        order_index: 2,
        slug: "envio-documentos",
        title: "Enviando os Documentos",
        content: `Para enviar seus documentos:

1. Acesse **Meu Perfil** no menu lateral
2. Vá até a aba **Documentos**
3. Preencha o **Número do CRECI**
4. Clique no botão de upload de cada documento
5. Aguarde a confirmação de envio

[SCREENSHOT: documents-tab]

Após o envio, nossa equipe irá analisar os documentos em até 2 dias úteis.`,
        warnings: [
          "Documentos com informações ilegíveis serão rejeitados",
          "Certifique-se de que o CRECI está ativo"
        ]
      },
      {
        order_index: 3,
        slug: "termo-adesao",
        title: "Termo de Adesão",
        content: `Após a aprovação dos documentos iniciais, você deverá:

1. Baixar o **Termo de Adesão** disponibilizado na aba Documentos
2. Assinar digitalmente via **GOV.BR**
3. Fazer upload do termo assinado

[SCREENSHOT: termo-adesao]

O termo de adesão formaliza a parceria entre sua imobiliária e a GarantFácil, estabelecendo os termos de uso da garantia locatícia.`,
        tips: [
          "A assinatura via GOV.BR tem validade jurídica"
        ]
      },
      {
        order_index: 4,
        slug: "status-ativacao",
        title: "Status de Ativação",
        content: `Você pode acompanhar o status da sua ativação no banner superior do portal:

- **Documentação Pendente**: Aguardando envio de documentos
- **Em Análise**: Documentos enviados e em revisão
- **Documento Rejeitado**: Necessário reenviar documento
- **Termo Pendente**: Aguardando envio do termo assinado
- **Ativo**: Conta ativada e pronta para uso

[SCREENSHOT: activation-banner]

Enquanto sua conta não estiver ativa, algumas funcionalidades estarão bloqueadas.`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Por que meu documento foi rejeitado?",
        answer: "Os motivos comuns incluem: imagem ilegível, documento vencido, ou informações incompletas. Verifique o feedback na aba Documentos e reenvie."
      },
      {
        order_index: 2,
        question: "Quanto tempo demora a ativação?",
        answer: "Após o envio de todos os documentos corretos, a ativação é feita em até 2 dias úteis."
      },
      {
        order_index: 3,
        question: "Posso solicitar análises antes da ativação?",
        answer: "Não. É necessário concluir todo o processo de onboarding para ter acesso às funcionalidades do portal."
      }
    ]
  },
  {
    order_index: 3,
    slug: "dashboard",
    title: "Dashboard - Central de Controle",
    icon: "LayoutDashboard",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "visao-geral",
        title: "Visão Geral",
        content: `O **Dashboard** é sua central de informações. Ao acessar o portal, você terá uma visão completa das suas operações:

[SCREENSHOT: dashboard-full]

O dashboard é atualizado em tempo real e mostra os dados mais relevantes para sua gestão diária.`,
        portal_links: [
          { label: "Ir para Dashboard", path: "/", icon: "LayoutDashboard" }
        ]
      },
      {
        order_index: 2,
        slug: "kpis",
        title: "KPIs Principais",
        content: `Os **indicadores-chave de performance** mostram:

- **Contratos Ativos**: Quantidade de contratos em vigor
- **Análises do Mês**: Total de análises solicitadas
- **Taxa de Aprovação**: Percentual de análises aprovadas
- **Comissões Acumuladas**: Total de comissões no período

[SCREENSHOT: kpi-cards]

Clique em qualquer KPI para ver mais detalhes.`,
        tips: [
          "Use o filtro de período para analisar diferentes intervalos de tempo"
        ]
      },
      {
        order_index: 3,
        slug: "graficos",
        title: "Gráficos e Tendências",
        content: `O dashboard inclui gráficos para visualização de tendências:

- **Evolução de Contratos**: Crescimento do portfólio
- **Comissões por Mês**: Histórico de ganhos
- **Distribuição por Status**: Análises e contratos por status

[SCREENSHOT: charts]`,
      },
      {
        order_index: 4,
        slug: "alertas",
        title: "Alertas e Notificações",
        content: `O sistema exibe banners de alerta para ações importantes:

- **Documentos Pendentes**: Contratos aguardando documentação
- **Renovações Próximas**: Contratos com vencimento próximo
- **Análises Aguardando Pagamento**: Necessário ação do inquilino

[SCREENSHOT: alert-banners]`,
        warnings: [
          "Fique atento aos alertas para não perder prazos importantes"
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Com que frequência os dados são atualizados?",
        answer: "Os dados do dashboard são atualizados em tempo real. Ao realizar qualquer ação, os indicadores refletem imediatamente a mudança."
      },
      {
        order_index: 2,
        question: "Posso exportar os dados do dashboard?",
        answer: "Atualmente não há exportação direta. Para relatórios detalhados, acesse as páginas específicas de cada módulo."
      },
      {
        order_index: 3,
        question: "O que significa a taxa de aprovação?",
        answer: "É o percentual de análises que foram aprovadas em relação ao total de análises finalizadas (aprovadas + reprovadas) no período."
      }
    ]
  },
  {
    order_index: 4,
    slug: "nova-analise",
    title: "Nova Análise de Crédito",
    icon: "FileSearch",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "iniciando",
        title: "Iniciando uma Análise",
        content: `Para solicitar uma análise de crédito para um inquilino:

1. Clique no botão **"Nova Análise"** no menu lateral
2. Ou acesse via Dashboard > "Nova Análise"

[SCREENSHOT: new-analysis-button]

O processo é dividido em 5 etapas simples e você pode salvar o rascunho a qualquer momento.`,
        tips: [
          "Tenha em mãos os documentos do inquilino antes de iniciar",
          "O rascunho é salvo automaticamente a cada 30 segundos"
        ],
        portal_links: [
          { label: "Iniciar Nova Análise", path: "/analyses/new", icon: "Plus" }
        ]
      },
      {
        order_index: 2,
        slug: "dados-inquilino",
        title: "Dados do Inquilino",
        content: `Na primeira etapa, preencha os dados do inquilino:

- **Nome completo**
- **CPF** (validado automaticamente)
- **Data de nascimento**
- **RG**
- **E-mail e telefone**
- **Profissão e empresa**
- **Renda mensal**

[SCREENSHOT: tenant-step]

Se o inquilino for casado, haverá um campo para adicionar os dados do cônjuge.`,
        warnings: [
          "O CPF deve ser válido para prosseguir",
          "Verifique se o e-mail está correto - o inquilino receberá comunicações por ele"
        ]
      },
      {
        order_index: 3,
        slug: "dados-imovel",
        title: "Dados do Imóvel",
        content: `Na segunda etapa, informe os dados do imóvel:

- **Endereço completo** (preenchido automaticamente via CEP)
- **Tipo do imóvel** (Residencial, Comercial, etc.)
- **Nome do proprietário**
- **CPF/CNPJ do proprietário**

[SCREENSHOT: property-step]`,
        tips: [
          "Digite o CEP para preenchimento automático do endereço"
        ]
      },
      {
        order_index: 4,
        slug: "valores-locacao",
        title: "Valores da Locação",
        content: `Na terceira etapa, informe os valores mensais:

- **Aluguel**: Valor mensal do aluguel
- **Condomínio**: Valor do condomínio (se aplicável)
- **IPTU**: Valor mensal do IPTU
- **Outros encargos**: Taxas adicionais

[SCREENSHOT: values-step]

O sistema calculará automaticamente o **valor locatício total** e a **garantia anual**.`,
      },
      {
        order_index: 5,
        slug: "simulador-garantia",
        title: "Simulador de Garantia",
        content: `O simulador mostra as opções de plano disponíveis:

## Plano START 🚀
- Taxa: 10% a 12,5%
- Cobertura: 20x valor locatício
- Custos de saída: até R$ 4.000
- Comissão: 5%

## Plano PRIME ⭐
- Taxa: 13% a 14,5%
- Cobertura: 20x valor locatício
- Custos de saída: até R$ 6.000
- Comissão: 10%

## Plano EXCLUSIVE 💎
- Taxa: 15%
- Cobertura: 20x valor locatício
- Custos de saída: até R$ 8.000
- Comissão: 15%

[SCREENSHOT: plan-selector]

Selecione o plano mais adequado para seu cliente.`,
        tips: [
          "Planos com taxas maiores oferecem maior cobertura de custos de saída",
          "A comissão é calculada sobre o valor da garantia anual"
        ]
      },
      {
        order_index: 6,
        slug: "forma-pagamento",
        title: "Forma de Pagamento",
        content: `Escolha a forma de pagamento preferida do inquilino:

- **PIX**: Pagamento à vista com 5% de desconto
- **Cartão de Crédito**: Parcelamento em até 12x

[SCREENSHOT: payment-options]

Esta informação ajudará na geração do link de aceite.`,
      },
      {
        order_index: 7,
        slug: "resumo-envio",
        title: "Resumo e Envio",
        content: `Na etapa final, revise todas as informações:

[SCREENSHOT: summary-step]

Confira cuidadosamente todos os dados antes de clicar em **"Enviar Análise"**. Após o envio, a análise entrará na fila de avaliação da equipe GarantFácil.`,
        warnings: [
          "Após o envio, não é possível editar os dados da análise"
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Posso salvar e continuar depois?",
        answer: "Sim! O sistema salva automaticamente seu progresso como rascunho. Você pode continuar de onde parou a qualquer momento."
      },
      {
        order_index: 2,
        question: "Qual a renda mínima para aprovação?",
        answer: "Não há renda mínima fixa. A análise considera diversos fatores como comprometimento de renda, histórico de crédito e perfil do inquilino."
      },
      {
        order_index: 3,
        question: "O inquilino precisa ter conta bancária?",
        answer: "Sim, para pagamento via PIX é necessário ter uma conta bancária. Para cartão de crédito, é necessário ter um cartão válido."
      },
      {
        order_index: 4,
        question: "Posso alterar o plano após enviar a análise?",
        answer: "Não diretamente. Caso necessário, entre em contato com a equipe GarantFácil via Chamados."
      }
    ]
  },
  {
    order_index: 5,
    slug: "analises",
    title: "Minhas Análises - Acompanhamento",
    icon: "Kanban",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "visualizacao",
        title: "Modos de Visualização",
        content: `A página de análises oferece dois modos de visualização:

## Kanban
Visão em colunas por status, ideal para acompanhamento visual do fluxo.

## Lista
Visão em tabela com filtros avançados, ideal para buscas específicas.

[SCREENSHOT: view-modes]

Alterne entre os modos usando os botões no topo da página.`,
        portal_links: [
          { label: "Ver Minhas Análises", path: "/analyses", icon: "FileSearch" }
        ]
      },
      {
        order_index: 2,
        slug: "status-analise",
        title: "Status das Análises",
        content: `Cada análise passa por diferentes status:

| Status | Descrição |
|--------|-----------|
| **Pendente** | Aguardando início da análise |
| **Em Análise** | Sendo avaliada pela equipe |
| **Aguardando Pagamento** | Aprovada, aguardando pagamento do inquilino |
| **Aprovada** | Pagamento confirmado, contrato será gerado |
| **Reprovada** | Não aprovada (veja o motivo nos detalhes) |

[SCREENSHOT: kanban-columns]`,
      },
      {
        order_index: 3,
        slug: "detalhes",
        title: "Detalhes da Análise",
        content: `Clique em qualquer análise para ver os detalhes completos:

- **Dados do inquilino**
- **Dados do imóvel**
- **Valores e plano selecionado**
- **Histórico de status**
- **Link de aceite** (quando aplicável)

[SCREENSHOT: analysis-drawer]`,
      },
      {
        order_index: 4,
        slug: "filtros",
        title: "Filtros e Busca",
        content: `Use os filtros para encontrar análises específicas:

- **Por status**: Filtre por um ou mais status
- **Por período**: Defina intervalo de datas
- **Por nome**: Busque pelo nome do inquilino
- **Por CPF**: Busque pelo CPF do inquilino

[SCREENSHOT: analysis-filters]`,
        tips: [
          "Combine múltiplos filtros para buscas mais precisas"
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Quanto tempo demora a análise?",
        answer: "Em média, as análises são processadas em até 24 horas úteis. Análises urgentes podem ser priorizadas mediante contato."
      },
      {
        order_index: 2,
        question: "Como sei o motivo de uma reprovação?",
        answer: "Abra os detalhes da análise reprovada. O motivo estará visível na seção de status."
      },
      {
        order_index: 3,
        question: "Posso reenviar uma análise reprovada?",
        answer: "Se houve erro nos dados, você pode criar uma nova análise com as informações corretas."
      }
    ]
  },
  {
    order_index: 6,
    slug: "aceite-pagamento",
    title: "Aceite e Pagamento do Inquilino",
    icon: "CreditCard",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "link-aceite",
        title: "Link de Aceite",
        content: `Quando uma análise é aprovada, é gerado um **link de aceite digital** que será enviado ao inquilino.

O link permite que o inquilino:
1. Visualize os termos da garantia
2. Confirme os dados
3. Aceite digitalmente os termos
4. Realize o pagamento

[SCREENSHOT: acceptance-link]

O link tem validade de **48 horas**.`,
        warnings: [
          "O link expira em 48 horas - oriente o inquilino a acessar o quanto antes"
        ]
      },
      {
        order_index: 2,
        slug: "pagamento-pix",
        title: "Pagamento via PIX",
        content: `Se o inquilino escolher PIX:

1. Um QR Code será exibido
2. O pagamento pode ser feito pelo app do banco
3. A confirmação é instantânea
4. **5% de desconto** é aplicado automaticamente

[SCREENSHOT: pix-payment]`,
        tips: [
          "PIX é a opção mais rápida e econômica"
        ]
      },
      {
        order_index: 3,
        slug: "pagamento-cartao",
        title: "Pagamento via Cartão",
        content: `Se o inquilino escolher cartão de crédito:

1. Será redirecionado para página segura (Stripe)
2. Pode parcelar em até 12x
3. A confirmação ocorre em alguns minutos

[SCREENSHOT: card-payment]`,
      },
      {
        order_index: 4,
        slug: "novo-link",
        title: "Solicitar Novo Link",
        content: `Se o link expirar ou o inquilino precisar de um novo:

1. Acesse a análise em **"Aguardando Pagamento"**
2. Clique em **"Solicitar Novo Link"**
3. Um novo link será gerado pela equipe GarantFácil

[SCREENSHOT: request-new-link]

Aguarde a confirmação antes de enviar ao inquilino.`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "O que acontece se o link expirar?",
        answer: "Você pode solicitar um novo link através da análise. A equipe GarantFácil irá gerar e enviar um novo link."
      },
      {
        order_index: 2,
        question: "O inquilino pode mudar a forma de pagamento depois?",
        answer: "Sim, dentro da página de aceite ele pode escolher entre PIX e cartão de crédito."
      },
      {
        order_index: 3,
        question: "Como sei se o pagamento foi confirmado?",
        answer: "Você receberá uma notificação e a análise mudará de status para **'Aprovada'**."
      }
    ]
  },
  {
    order_index: 7,
    slug: "contratos",
    title: "Meus Contratos",
    icon: "FileText",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "visao-geral-contratos",
        title: "Visão Geral",
        content: `A página **Meus Contratos** mostra todos os contratos de garantia da sua imobiliária:

- **Documentação Pendente**: Aguardando envio de documentos
- **Ativo**: Contrato em vigor
- **Em Renovação**: Processo de renovação em andamento
- **Encerrado**: Contrato finalizado
- **Cancelado**: Contrato cancelado

[SCREENSHOT: contracts-list]`,
        portal_links: [
          { label: "Ver Meus Contratos", path: "/contracts", icon: "FileCheck" }
        ]
      },
      {
        order_index: 2,
        slug: "documentos-contrato",
        title: "Documentos do Contrato",
        content: `Para ativar um contrato, é necessário enviar 4 documentos obrigatórios:

1. **Contrato de Locação** - Assinado por todas as partes
2. **Vistoria Inicial** - Laudo de vistoria do imóvel
3. **Seguro Incêndio** - Apólice vigente
4. **Contrato de Administração** - Contrato entre imobiliária e proprietário

[SCREENSHOT: contract-documents]

Faça upload de cada documento na aba **"Documentos"** do contrato.`,
        warnings: [
          "O contrato só será ativado após aprovação de todos os documentos"
        ]
      },
      {
        order_index: 3,
        slug: "detalhes-contrato",
        title: "Detalhes do Contrato",
        content: `Ao clicar em um contrato, você verá:

- **Resumo**: Dados principais e valores
- **Documentos**: Status e upload de documentos
- **Timeline**: Histórico de eventos
- **Financeiro**: Detalhamento de valores
- **Renovação**: Status de renovação (quando aplicável)

[SCREENSHOT: contract-detail]`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Quanto tempo tenho para enviar os documentos?",
        answer: "Recomendamos enviar em até 7 dias após a confirmação do pagamento. Contratos sem documentação completa ficam em status pendente."
      },
      {
        order_index: 2,
        question: "Por que meu documento foi rejeitado?",
        answer: "Verifique o feedback na aba Documentos. Motivos comuns: documento ilegível, incompleto ou desatualizado."
      },
      {
        order_index: 3,
        question: "Quando o contrato é ativado?",
        answer: "Após a aprovação dos 4 documentos obrigatórios pela equipe GarantFácil."
      }
    ]
  },
  {
    order_index: 8,
    slug: "renovacao",
    title: "Renovação de Contratos",
    icon: "RefreshCw",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "quando-renovar",
        title: "Quando Renovar",
        content: `A renovação deve ser solicitada **até 60 dias antes** do vencimento do contrato.

Você receberá alertas automáticos:
- 90 dias antes: Aviso de proximidade
- 60 dias antes: Lembrete de renovação
- 30 dias antes: Alerta urgente

[SCREENSHOT: renewal-alert]`,
        warnings: [
          "Contratos não renovados serão encerrados automaticamente na data de vencimento"
        ]
      },
      {
        order_index: 2,
        slug: "processo-renovacao",
        title: "Processo de Renovação",
        content: `Para solicitar a renovação:

1. Acesse o contrato desejado
2. Clique em **"Solicitar Renovação"**
3. Informe os novos valores (se houver reajuste)
4. Confirme a solicitação

[SCREENSHOT: renewal-request]

A equipe GarantFácil analisará a solicitação e gerará um novo link de aceite para o inquilino.`,
      },
      {
        order_index: 3,
        slug: "reajuste-valores",
        title: "Reajuste de Valores",
        content: `Na renovação, você pode atualizar:

- Valor do aluguel
- Valor do condomínio
- Valor do IPTU
- Outros encargos

[SCREENSHOT: renewal-values]

A nova garantia será calculada com base nos valores atualizados.`,
        tips: [
          "Verifique o índice de reajuste previsto no contrato de locação"
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "O inquilino precisa fazer novo aceite?",
        answer: "Sim. Um novo link de aceite digital será enviado com os termos atualizados."
      },
      {
        order_index: 2,
        question: "Posso renovar com valores menores?",
        answer: "Sim, os valores podem ser ajustados para cima ou para baixo conforme a nova negociação."
      },
      {
        order_index: 3,
        question: "O que acontece se o inquilino não aceitar a renovação?",
        answer: "O contrato atual seguirá vigente até o vencimento. Após isso, será encerrado e não haverá mais cobertura."
      }
    ]
  },
  {
    order_index: 9,
    slug: "garantias",
    title: "Garantias Solicitadas (Sinistros)",
    icon: "Shield",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "quando-solicitar",
        title: "Quando Solicitar",
        content: `Solicite uma garantia quando houver:

- **Inadimplência de aluguel**: Inquilino não pagou
- **Inadimplência de encargos**: Condomínio, IPTU em atraso
- **Danos ao imóvel**: Ao final da locação
- **Custos de saída**: Despesas com desocupação

[SCREENSHOT: claim-reasons]

A garantia cobre até **20x o valor locatício mensal**.`,
        warnings: [
          "A solicitação deve ser feita assim que identificada a inadimplência"
        ],
        portal_links: [
          { label: "Solicitar Garantia", path: "/claims/new", icon: "Shield" }
        ]
      },
      {
        order_index: 2,
        slug: "criando-garantia",
        title: "Criando uma Solicitação",
        content: `Para solicitar uma garantia:

1. Clique em **"Solicitar Garantia"**
2. Selecione o contrato correspondente
3. Adicione os itens de cobrança (meses em atraso, encargos, etc.)
4. Anexe os comprovantes necessários
5. Descreva a situação nas observações
6. Clique em **"Enviar Solicitação"**

[SCREENSHOT: new-claim-form]`,
        tips: [
          "Quanto mais documentos comprobatórios, mais rápida será a análise"
        ]
      },
      {
        order_index: 3,
        slug: "status-garantia",
        title: "Status da Garantia",
        content: `Acompanhe o status da sua solicitação:

| Status | Descrição |
|--------|-----------|
| **Solicitado** | Aguardando análise inicial |
| **Em Análise Técnica** | Em verificação pela equipe |
| **Pagamento Programado** | Aprovado, pagamento em processamento |
| **Finalizado** | Processo concluído |

[SCREENSHOT: claim-status]`,
      },
      {
        order_index: 4,
        slug: "limites-cobertura",
        title: "Limites de Cobertura",
        content: `Cada plano tem limites específicos para custos de saída:

- **START**: até R$ 4.000
- **PRIME**: até R$ 6.000
- **EXCLUSIVE**: até R$ 8.000

A cobertura total (aluguel + encargos) é sempre **20x o valor locatício mensal**.

[SCREENSHOT: coverage-limits]`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Em quanto tempo recebo o pagamento?",
        answer: "Após aprovação da solicitação, o pagamento é processado em até 5 dias úteis."
      },
      {
        order_index: 2,
        question: "Posso solicitar garantia por danos ao imóvel?",
        answer: "Sim, desde que comprovados por laudo de vistoria e dentro dos limites de cobertura do plano."
      },
      {
        order_index: 3,
        question: "O que acontece após o pagamento da garantia?",
        answer: "A GarantFácil assume a cobrança do inquilino. Você não precisa se preocupar com a recuperação do valor."
      }
    ]
  },
  {
    order_index: 10,
    slug: "comissoes",
    title: "Minhas Comissões",
    icon: "DollarSign",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "tipos-comissao",
        title: "Tipos de Comissão",
        content: `Você recebe dois tipos de comissão:

## Comissão de Setup
- Paga uma única vez no início do contrato
- Percentual definido no seu acordo comercial
- Sobre a taxa de setup (se aplicável)

## Comissão Recorrente
- Paga mensalmente durante a vigência do contrato
- Percentual varia conforme o plano escolhido:
  - START: 5%
  - PRIME: 10%
  - EXCLUSIVE: 15%

[SCREENSHOT: commission-types]`,
        portal_links: [
          { label: "Ver Minhas Comissões", path: "/commissions", icon: "DollarSign" }
        ]
      },
      {
        order_index: 2,
        slug: "status-comissao",
        title: "Status das Comissões",
        content: `Cada comissão tem um status:

- **Pendente**: Aguardando data de vencimento
- **Disponível**: Pronta para pagamento
- **Paga**: Já depositada
- **Estornada**: Devolvida (em caso de cancelamento)

[SCREENSHOT: commission-status]`,
      },
      {
        order_index: 3,
        slug: "relatorio-semanal",
        title: "Relatório Semanal",
        content: `Toda sexta-feira às 18h, você recebe por e-mail um **relatório consolidado** com:

- Comissões pagas na semana
- Comissões pendentes
- Previsão para a próxima semana

[SCREENSHOT: weekly-report]`,
        tips: [
          "Verifique sua caixa de entrada às sextas-feiras"
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Quando recebo minhas comissões?",
        answer: "As comissões são pagas até o dia 10 de cada mês, referentes ao mês anterior."
      },
      {
        order_index: 2,
        question: "Como é calculada a comissão recorrente?",
        answer: "É calculada sobre o valor da garantia anual, dividida por 12 meses, aplicando o percentual do plano."
      },
      {
        order_index: 3,
        question: "Perco comissões se o contrato for cancelado?",
        answer: "As comissões já pagas não são devolvidas. As comissões futuras são canceladas."
      }
    ]
  },
  {
    order_index: 11,
    slug: "chamados",
    title: "Chamados - Suporte GarantFácil",
    icon: "MessageSquare",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "abrindo-chamado",
        title: "Abrindo um Chamado",
        content: `Para abrir um chamado de suporte:

1. Acesse **Chamados** no menu lateral
2. Clique em **"Novo Chamado"**
3. Selecione a categoria
4. Descreva sua dúvida ou problema
5. Anexe documentos se necessário
6. Clique em **"Enviar"**

[SCREENSHOT: new-ticket]`,
        tips: [
          "Seja específico na descrição para agilizar o atendimento"
        ],
        portal_links: [
          { label: "Abrir Chamado", path: "/support", icon: "MessageSquare" }
        ]
      },
      {
        order_index: 2,
        slug: "categorias",
        title: "Categorias de Chamado",
        content: `Escolha a categoria mais adequada:

- **Dúvida**: Perguntas gerais sobre o portal
- **Problema Técnico**: Erros ou bugs no sistema
- **Financeiro**: Dúvidas sobre pagamentos e comissões
- **Análise**: Questões sobre análises de crédito
- **Contrato**: Dúvidas sobre contratos
- **Garantia**: Questões sobre sinistros
- **Outro**: Assuntos não listados

[SCREENSHOT: ticket-categories]`,
      },
      {
        order_index: 3,
        slug: "chamado-vinculado",
        title: "Chamados Vinculados",
        content: `Você pode vincular um chamado a:

- Uma análise específica
- Um contrato específico
- Uma garantia específica

Isso ajuda a equipe GarantFácil a entender o contexto rapidamente.

[SCREENSHOT: linked-ticket]`,
        tips: [
          "Chamados vinculados são respondidos mais rapidamente"
        ]
      },
      {
        order_index: 4,
        slug: "acompanhamento",
        title: "Acompanhando Chamados",
        content: `Acompanhe o status dos seus chamados:

- **Aberto**: Aguardando primeira resposta
- **Em Atendimento**: Equipe trabalhando na solução
- **Aguardando Resposta**: Aguardando sua resposta
- **Resolvido**: Problema solucionado

[SCREENSHOT: ticket-status]

Você receberá notificações a cada atualização.`,
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Qual o prazo de resposta?",
        answer: "Chamados são respondidos em até 24 horas úteis. Casos urgentes podem ser priorizados."
      },
      {
        order_index: 2,
        question: "Posso reabrir um chamado resolvido?",
        answer: "Não diretamente, mas você pode criar um novo chamado referenciando o anterior."
      },
      {
        order_index: 3,
        question: "Como anexo documentos ao chamado?",
        answer: "Ao criar ou responder um chamado, use o botão de anexo para adicionar arquivos (PDF, imagens, etc.)."
      }
    ]
  },
  {
    order_index: 12,
    slug: "drive-colaboradores",
    title: "Drive de Documentos e Colaboradores",
    icon: "FolderOpen",
    is_new: false,
    sections: [
      {
        order_index: 1,
        slug: "drive",
        title: "Drive de Documentos",
        content: `O Drive contém documentos úteis:

- **Modelos de Contrato**: Templates para download
- **Termos**: Termos de uso e políticas
- **Materiais de Apoio**: Guias e tutoriais

[SCREENSHOT: document-drive]

Clique no documento desejado para fazer download.`,
        portal_links: [
          { label: "Acessar Drive", path: "/documents", icon: "FolderOpen" }
        ]
      },
      {
        order_index: 2,
        slug: "colaboradores",
        title: "Gestão de Colaboradores",
        content: `Gerencie os usuários da sua imobiliária:

1. Acesse **Colaboradores** no menu
2. Veja a lista de usuários ativos
3. Adicione novos colaboradores
4. Defina permissões

[SCREENSHOT: collaborators-list]`,
        portal_links: [
          { label: "Ver Colaboradores", path: "/collaborators", icon: "Users" }
        ]
      },
      {
        order_index: 3,
        slug: "perfis-acesso",
        title: "Perfis de Acesso",
        content: `Cada colaborador pode ter um perfil:

- **Administrador**: Acesso total ao portal
- **Operador**: Pode criar análises e gerenciar contratos
- **Visualizador**: Apenas visualização (sem edição)

[SCREENSHOT: access-profiles]`,
        tips: [
          "Defina o perfil adequado para cada função na sua equipe"
        ]
      },
      {
        order_index: 4,
        slug: "meu-perfil",
        title: "Meu Perfil",
        content: `Atualize seus dados pessoais:

1. Clique no ícone de perfil no menu lateral
2. Atualize nome, e-mail, telefone
3. Altere sua foto de perfil
4. Salve as alterações

[SCREENSHOT: my-profile]`,
        portal_links: [
          { label: "Editar Meu Perfil", path: "/profile", icon: "UserCircle" }
        ]
      }
    ],
    faqs: [
      {
        order_index: 1,
        question: "Posso remover um colaborador?",
        answer: "Sim. Acesse Colaboradores, encontre o usuário e clique em 'Desativar'. O usuário perderá acesso imediatamente."
      },
      {
        order_index: 2,
        question: "Os documentos do Drive são atualizados?",
        answer: "Sim, a equipe GarantFácil mantém os documentos sempre atualizados. Verifique a data de última atualização."
      },
      {
        order_index: 3,
        question: "Quantos colaboradores posso adicionar?",
        answer: "Não há limite de colaboradores. Adicione quantos usuários forem necessários para sua operação."
      }
    ]
  }
];

// Glossary terms for tooltips
export const HELP_GLOSSARY_TERMS = [
  { term: "RLS", definition: "Row Level Security - Política de segurança que controla acesso aos dados por usuário" },
  { term: "KPI", definition: "Key Performance Indicator - Indicador-chave de desempenho" },
  { term: "Setup", definition: "Taxa inicial de configuração cobrada no início do contrato" },
  { term: "PIX", definition: "Sistema de pagamento instantâneo do Banco Central do Brasil" },
  { term: "Sinistro", definition: "Evento de inadimplência que aciona a garantia locatícia" },
  { term: "Garantia", definition: "Cobertura financeira contra inadimplência do inquilino" },
  { term: "Kanban", definition: "Metodologia visual de gestão de tarefas em colunas por status" },
  { term: "CRECI", definition: "Conselho Regional de Corretores de Imóveis" },
  { term: "CPF", definition: "Cadastro de Pessoas Físicas - documento de identificação fiscal" },
  { term: "CNPJ", definition: "Cadastro Nacional de Pessoas Jurídicas - identificação de empresas" },
  { term: "IPTU", definition: "Imposto Predial e Territorial Urbano" },
  { term: "Taxa de Garantia", definition: "Percentual anual cobrado sobre o valor locatício total para a cobertura" },
  { term: "Valor Locatício", definition: "Soma do aluguel, condomínio, IPTU e outros encargos mensais" },
  { term: "Cobertura", definition: "Limite máximo de indenização em caso de sinistro (20x valor locatício)" },
  { term: "Custos de Saída", definition: "Despesas com desocupação do imóvel (pintura, reparos, etc.)" },
];
