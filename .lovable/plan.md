

# Plano: Documentação Técnica + Relatório Institucional Tridots Capital

## Entregáveis

Dois arquivos Markdown salvos em `/mnt/documents/`:

1. **`tridots-documentacao-tecnica.md`** — referência técnica completa do sistema
2. **`tridots-relatorio-institucional.md`** — documento institucional multi-público

## Documento 1: Documentação Técnica

Estrutura prevista (~15-20 mil palavras):

### Parte A — Visão geral por módulo
Cada módulo com: propósito, fluxo principal, entidades envolvidas, regras de negócio aplicáveis, telas relacionadas.

- **Autenticação & Roles** (master, analyst, agency users; impersonation mode)
- **Imobiliárias (Agencies)** — onboarding, ativação, documentos, billing status
- **Análises (Analyses)** — ciclo de vida pendente→aprovada/reprovada, kanban, draft, taxa de garantia
- **Aceite Digital (Tenant Acceptance)** — token 48h, etapas dinâmicas, assinaturas
- **Contratos (Contracts)** — 4 documentos obrigatórios, ativação, datas de vigência, migrados
- **Renovações (Contract Renewals)** — fluxo de 12 meses sem setup, aprovação Tridots
- **Garantias Solicitadas (Claims)** — status público vs interno, prazos, deadline 30 dias
- **Faturas (Agency Invoices) / Boleto Unificado** — ciclo de faturamento, hard lock 72h
- **Comissões** — setup + recorrente, pagamento dia 10
- **Tickets (Suporte)** — categorias, prioridades, ordenação por última mensagem
- **Notificações** — in-app + e-mail, sistema unificado
- **Help Center** — admin de capítulos/seções, feedback
- **Auditoria & Cloud Monitoring** — audit_logs, function_logs

### Parte B — Banco de dados
Para cada tabela (~40 tabelas): colunas principais, defaults, políticas RLS, relacionamentos lógicos, observações de uso. Agrupadas por domínio.

### Parte C — Edge Functions
Para cada uma das ~40 functions: propósito, gatilho (cron, webhook, frontend), inputs, outputs, dependências (Resend, Stripe, Storage), `verify_jwt`.

### Parte D — Frontend (Hooks & Componentes)
- Inventário dos hooks (`useTickets`, `useClaims`, `useAgencyUser`, `useContracts`, etc.) com responsabilidade de cada um
- Componentes-chave por módulo (Kanbans, Drawers, Forms, Modals)
- Padrões transversais: `formatDateBR`, `buildStoragePath`, `isMaster`, impersonation context

### Parte E — Padrões técnicos
Convenções de storage, datas, segurança de roles, downloads via Blob, RLS standards, automações cron.

## Documento 2: Relatório Institucional Tridots Capital

Documento multi-público (~20-25 mil páginas), dividido em seções claramente marcadas. Onde faltarem dados institucionais reais, usarei marcadores `[A PREENCHER: descrição]`.

### Capítulo 1 — Sobre a Tridots Capital
- Identidade `[A PREENCHER: CNPJ, endereço, fundação, sócios]`
- Missão, visão, valores `[A PREENCHER ou inferir do produto]`
- Posicionamento: garantidora de aluguel B2B2C via imobiliárias
- Marca, domínios, canais oficiais

### Capítulo 2 — Modelo de negócio (Investidores)
- Como a Tridots ganha dinheiro: setup fee + taxa de garantia anual + comissões recorrentes
- Estrutura de planos: START / PRIME / EXCLUSIVE — taxas, coberturas, limites
- Limite de R$ 4.000 de aluguel total
- Métodos de pagamento: PIX, Cartão, Boleto Unificado
- Unit economics base `[A PREENCHER: ticket médio, CAC, LTV]`
- Fluxo financeiro completo: análise → aprovação → pagamento → comissão dia 10

### Capítulo 3 — Operação interna (Onboarding)
- Papéis: Master, Analyst, Imobiliária (titular + colaboradores)
- Jornada da análise: pendente → em análise → aprovada → contrato ativo
- Jornada do contrato: documentação pendente → 4 docs aprovados → ativo → renovação
- Jornada da garantia (claim): solicitado → em análise → pago/negado, prazo 30 dias
- Modo Suporte (impersonation), Help Center, Tickets
- Automações diárias (crons): faturamento, inadimplência, alertas

### Capítulo 4 — Regras de negócio consolidadas
Compilado das ~70 regras documentadas em memória:
- Análises (limite R$4k, validação cônjuge, ciclo, recálculo de taxa)
- Contratos (datas, migração, documentos, renovação)
- Aceite (token 48h, etapas dinâmicas, branding Tridots)
- Boleto Unificado (ciclo, weekend, retroativo, hard lock)
- Comissões (dia 10, todas modalidades)
- Claims (60 dias submissão, alertas escalonados, deadline 30 dias)
- Imobiliárias (onboarding, restrições inativas, PIX dinâmico)

### Capítulo 5 — Marketing & Comercial
- Personas: Imobiliária pequena/média, Imobiliária grande, Inquilino final
- Diferenciais: 100% digital, aceite em 48h, sem fiador, Boleto Unificado
- Funil de aquisição sugerido `[A PREENCHER: canais ativos]`
- Cenários de campanha: lançamento Boleto Unificado, captação de imobiliárias, retenção pós-renovação
- Argumentos por persona (problemas resolvidos)
- Prova social `[A PREENCHER: casos, números reais]`

### Capítulo 6 — Financeiro & Administrativo
- Régua de cobrança: faturamento mensal, vencimento configurável (5/10/15), hard lock em 72h
- Reconciliação de boletos
- Comissionamento: cálculo, status (pendente/a_pagar/pago), relatório semanal
- Auditoria e logs
- KPIs operacionais sugeridos

### Capítulo 7 — Tecnologia (visão executiva)
Resumo não-técnico do que existe, em 2-3 páginas, citando: stack, infraestrutura cloud, segurança (RLS, storage privado), automações, integrações (Stripe, Resend).

### Capítulo 8 — O que foi construído (status atual)
Lista priorizada e categorizada de funcionalidades já entregues (Core, Financeiro, Suporte, Compliance, UX).

### Capítulo 9 — Roadmap & ideias no radar
- Prioridades sugeridas baseadas em gaps observados no código
- Ideias para evolução: dashboards executivos, BI, app mobile, IA para análise de risco, integração com CRMs imobiliários
- `[A PREENCHER: prioridades estratégicas definidas pela liderança]`

### Capítulo 10 — Apêndices
- Glossário de termos
- Mapa de e-mails transacionais
- Lista de domínios e ambientes
- Índice de regras de negócio com referência cruzada

## Método de execução

1. Ler memória do projeto (`mem://`) para consolidar regras de negócio
2. Inspecionar `src/pages`, `src/hooks`, `supabase/functions/` e migrações relevantes para mapear módulos
3. Consultar schema completo do banco via `supabase--read_query` (information_schema)
4. Gerar os dois `.md` em `/mnt/documents/` com formatação consistente (headings hierárquicos, tabelas markdown, blocos de código onde útil)
5. Validar tamanho e cobertura antes de entregar

## Observações

- Sem geração de UI nem alterações de código
- Não fará leitura linha a linha de todos os arquivos — usará leituras estratégicas + listagens + busca
- Marcadores `[A PREENCHER: ...]` apenas em dados institucionais que não estão no código
- Tempo estimado de execução: longo (várias chamadas de leitura sequenciais)

