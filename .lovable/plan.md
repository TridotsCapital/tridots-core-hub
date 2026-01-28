

# Plano: Criar Perfil de Demonstração para Imobiliária (Atualizado)

## Objetivo

Criar uma imobiliária de teste completa com **30+ análises** em cenários variados, além de contratos, chamados e garantias para demonstrar todas as funcionalidades do Portal Imobiliária.

---

## Dados da Imobiliária Demo

| Campo | Valor |
|-------|-------|
| Nome Fantasia | **Imobiliária Demo** |
| Razão Social | Demo Administradora de Imóveis Ltda |
| CNPJ | 12.345.678/0001-90 |
| Email | demo@imobiliaria.com |
| Responsável | Carlos Silva |
| Cidade/UF | São Paulo/SP |
| Status | **Ativa** |
| Comissão Inicial | 50% |
| Comissão Recorrente | 10% |

### Usuário de Acesso
- Email: `demo@tridots.com.br`
- Senha: `Demo@2025`
- Perfil: agency_user vinculado à imobiliária Demo

---

## 30 Análises em Cenários Variados

### Status: PENDENTE (5 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário |
|---|-----------|--------|---------------|-------|---------|
| 1 | Maria Santos | Apt 101 - Av. Paulista, 1000 | R$ 2.500 | Prime | Recém criada (hoje) |
| 2 | João Oliveira | Casa - Rua das Flores, 45 | R$ 3.500 | Exclusive | Criada há 1 dia |
| 3 | Ana Costa | Studio - Consolação, 200 | R$ 1.800 | Start | Criada há 2 dias |
| 4 | Pedro Lima | Apt 202 - Moema, 350 | R$ 4.000 | Prime | Com cônjuge |
| 5 | Carla Mendes | Cobertura - Itaim, 500 | R$ 8.000 | Exclusive | Alto valor |

### Status: EM ANÁLISE (6 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário |
|---|-----------|--------|---------------|-------|---------|
| 6 | Lucas Souza | Apt 303 - Pinheiros, 120 | R$ 2.800 | Prime | Em análise há 1 dia |
| 7 | Fernanda Reis | Casa - Vila Madalena, 80 | R$ 5.500 | Exclusive | Em análise há 2 dias |
| 8 | Roberto Alves | Apt 404 - Jardins, 200 | R$ 6.000 | Prime | Renda autônomo |
| 9 | Juliana Martins | Studio - República, 50 | R$ 1.500 | Start | Estudante com fiador |
| 10 | Marcos Pereira | Apt 505 - Bela Vista, 180 | R$ 3.200 | Prime | Com mensagem no chat |
| 11 | Patrícia Gomes | Casa - Perdizes, 300 | R$ 7.000 | Exclusive | Empresa como locatária |

### Status: APROVADA (aguardando pagamento) (5 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário |
|---|-----------|--------|---------------|-------|---------|
| 12 | Thiago Santos | Apt 606 - Vila Olímpia, 400 | R$ 4.500 | Prime | Link enviado hoje |
| 13 | Camila Lima | Casa - Alto de Pinheiros, 250 | R$ 9.000 | Exclusive | Link enviado há 2 dias |
| 14 | Rafael Costa | Studio - Liberdade, 30 | R$ 1.600 | Start | Primeiro lembrete |
| 15 | Amanda Oliveira | Apt 707 - Brooklin, 280 | R$ 5.000 | Prime | Taxa reajustada |
| 16 | Bruno Ferreira | Apt 808 - Morumbi, 350 | R$ 6.500 | Exclusive | Pagamento parcial |

### Status: ATIVO (Contratos ativos) (8 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário |
|---|-----------|--------|---------------|-------|---------|
| 17 | Daniela Rocha | Apt 909 - Tatuapé, 150 | R$ 2.200 | Prime | Ativo há 11 meses (renovação próxima) |
| 18 | Eduardo Nunes | Casa - Santana, 200 | R$ 4.000 | Exclusive | Ativo há 6 meses |
| 19 | Fabiana Silva | Studio - Barra Funda, 40 | R$ 1.400 | Start | Ativo há 3 meses |
| 20 | Gabriel Martins | Apt 1010 - Lapa, 180 | R$ 3.000 | Prime | Ativo há 1 mês (recente) |
| 21 | Helena Costa | Cobertura - Higienópolis, 450 | R$ 12.000 | Exclusive | Alto valor, ativo há 8 meses |
| 22 | Igor Almeida | Apt 1111 - Paraíso, 200 | R$ 3.500 | Prime | Com claim em andamento |
| 23 | Jéssica Souza | Casa - Butantã, 180 | R$ 2.800 | Prime | Docs completos |
| 24 | Kevin Lima | Apt 1212 - Aclimação, 120 | R$ 2.000 | Start | Contrato simples |

### Status: REPROVADA (4 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário/Motivo |
|---|-----------|--------|---------------|-------|----------------|
| 25 | Leonardo Dias | Apt 1313 - Centro | R$ 1.800 | Start | Renda insuficiente |
| 26 | Mariana Ferreira | Casa - Ipiranga | R$ 3.500 | Prime | Restrição cadastral |
| 27 | Nicolas Gomes | Studio - Brás | R$ 1.200 | Start | Documentação incompleta |
| 28 | Olivia Ramos | Apt 1414 - Cambuci | R$ 2.500 | Prime | Score baixo |

### Status: CANCELADA (2 análises)

| # | Inquilino | Imóvel | Valor Aluguel | Plano | Cenário/Motivo |
|---|-----------|--------|---------------|-------|----------------|
| 29 | Paulo Henrique | Apt 1515 - Penha | R$ 2.000 | Start | Desistência do inquilino |
| 30 | Renata Vieira | Casa - Tucuruvi | R$ 3.000 | Prime | Imóvel já alugado |

---

## Distribuição por Status (Visual)

```text
┌─────────────────────────────────────────────────────────────────┐
│  FUNIL DE ANÁLISES - IMOBILIÁRIA DEMO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⏳ Pendente         ████████████████  5                        │
│  🔍 Em Análise       ████████████████████  6                    │
│  💳 Aguard. Pgto     ████████████████  5                        │
│  ✅ Ativo            ████████████████████████████████  8        │
│  ❌ Reprovada        ████████████  4                            │
│  🚫 Cancelada        ████  2                                    │
│                      ─────────────────────────────              │
│  TOTAL               30 análises                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contratos Vinculados (8 contratos dos ativos)

| # | Análise | Status Contrato | Documentos | Cenário |
|---|---------|-----------------|------------|---------|
| 1 | Daniela Rocha | **Ativo** | 4/4 ✅ | Renovação em 30 dias |
| 2 | Eduardo Nunes | **Ativo** | 4/4 ✅ | Contrato normal |
| 3 | Fabiana Silva | **Ativo** | 4/4 ✅ | Contrato recente |
| 4 | Gabriel Martins | **Doc. Pendente** | 2/4 | Aguardando vistoria |
| 5 | Helena Costa | **Ativo** | 4/4 ✅ | Alto valor |
| 6 | Igor Almeida | **Ativo** | 4/4 ✅ | Com claim vinculado |
| 7 | Jéssica Souza | **Doc. Pendente** | 1/4 | Doc rejeitado |
| 8 | Kevin Lima | **Ativo** | 4/4 ✅ | Simples |

---

## Tickets/Chamados (8 tickets)

| # | Assunto | Categoria | Prioridade | Status | Vínculo |
|---|---------|-----------|------------|--------|---------|
| 1 | Dúvida sobre taxa de garantia | Financeiro | Normal | **Aberto** | Avulso |
| 2 | Não consigo fazer upload | Técnico | Alta | **Em Atendimento** | Análise #10 |
| 3 | Preciso de 2ª via do boleto | Comercial | Normal | **Aguardando Cliente** | Contrato #2 |
| 4 | Inquilino não recebeu o link | Urgente | Urgente | **Em Atendimento** | Análise #12 |
| 5 | Como funciona a renovação? | Comercial | Baixa | **Resolvido** | Avulso |
| 6 | Dúvida sobre cobertura do sinistro | Financeiro | Alta | **Em Atendimento** | Claim #1 |
| 7 | Erro ao acessar documentos | Técnico | Normal | **Aberto** | Contrato #4 |
| 8 | Solicitar aditivo contratual | Comercial | Normal | **Resolvido** | Contrato #1 |

---

## Solicitações de Garantia/Claims (4 claims)

| # | Contrato | Status Público | Status Interno | Valor Total | Cenário |
|---|----------|----------------|----------------|-------------|---------|
| 1 | Igor Almeida | **Solicitado** | Triagem | R$ 7.000 | Novo, 2 aluguéis |
| 2 | Eduardo Nunes | **Em Análise Técnica** | Coleta Docs | R$ 12.500 | 3 aluguéis + cond |
| 3 | Daniela Rocha | **Pagamento Programado** | Aguard. Pgto | R$ 4.400 | 2 aluguéis aprovados |
| 4 | Fabiana Silva | **Finalizado** | Encerrado | R$ 2.800 | Histórico pago |

### Itens do Claim #1 (Exemplo Detalhado)

```text
┌─────────────────────────────────────────────────────────────────┐
│  SOLICITAÇÃO DE GARANTIA #1 - Igor Almeida                     │
│  Contrato: Apt 1111 - Paraíso                                   │
├─────────────────────────────────────────────────────────────────┤
│  DÉBITOS DECLARADOS                                             │
│                                                                 │
│  📅 Dezembro/2025                                               │
│     ├─ Aluguel .......................... R$ 3.500,00          │
│                                                                 │
│  📅 Janeiro/2026                                                │
│     ├─ Aluguel .......................... R$ 3.500,00          │
│                                                                 │
│                                          ─────────────          │
│  TOTAL SOLICITADO ...................... R$ 7.000,00           │
│                                                                 │
│  📎 Arquivos anexados: 3                                        │
│     • Notificação extrajudicial.pdf                            │
│     • Comprovante de inadimplência.pdf                         │
│     • Boletos em aberto.pdf                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dados Adicionais para Realismo

### Mensagens de Chat em Análises

**Análise #10 (Marcos Pereira):**
```text
[2 dias atrás] Imobiliária: "Bom dia, há previsão de conclusão?"
[1 dia atrás] Tridots: "Olá! Estamos aguardando retorno do score. Previsão: amanhã."
[Hoje] Imobiliária: "Obrigado pela atualização!"
```

**Análise #12 (Thiago Santos):**
```text
[3 dias atrás] Tridots: "Análise aprovada! Link de aceite enviado ao inquilino."
[1 dia atrás] Imobiliária: "O inquilino disse que não recebeu o email."
[Hoje] Tridots: "Reenviamos o link. Favor verificar pasta de spam."
```

### Timeline de Eventos (Exemplos)

**Análise #17 (Daniela Rocha - ativa há 11 meses):**
- Análise criada (11 meses atrás)
- Status: Em Análise (11 meses atrás)
- Status: Aprovada (11 meses atrás)
- Pagamento confirmado (11 meses atrás)
- Contrato criado (11 meses atrás)
- Documentos aprovados (10 meses atrás)
- Contrato ativado (10 meses atrás)
- Notificação de renovação enviada (hoje)

---

## Comissões Geradas (Exemplos)

| Contrato | Tipo | Valor | Status | Referência |
|----------|------|-------|--------|------------|
| Daniela Rocha | Setup | R$ 1.320 | Paga | Nov/2024 |
| Daniela Rocha | Recorrente | R$ 220 | Paga | Dez-Out/2025 |
| Eduardo Nunes | Setup | R$ 2.400 | Paga | Jun/2025 |
| Eduardo Nunes | Recorrente | R$ 400 | Paga | Jul-Jan/2026 |
| Helena Costa | Setup | R$ 7.200 | Paga | Mar/2025 |
| Helena Costa | Recorrente | R$ 1.200 | Paga | Abr-Jan/2026 |

---

## Implementação Técnica

### Arquivo a Criar

`supabase/functions/seed-demo-agency/index.ts`

### Fluxo da Edge Function

1. Verificar se usuário é master (segurança)
2. Verificar se imobiliária demo já existe (evitar duplicação)
3. Criar imobiliária com dados completos
4. Criar usuário via Admin API
5. Vincular usuário como agency_user
6. Loop para criar 30 análises com status variados
7. Criar contratos para análises ativas
8. Criar tickets com diferentes categorias
9. Criar claims com itens e arquivos
10. Inserir mensagens de chat
11. Inserir eventos de timeline
12. Gerar comissões para contratos ativos
13. Retornar resumo dos dados criados

---

## Resumo Final dos Dados

| Entidade | Quantidade | Observação |
|----------|------------|------------|
| Imobiliária | 1 | Ativa, perfil completo |
| Usuário | 1 | demo@tridots.com.br |
| **Análises** | **30** | Todos os status |
| Contratos | 8 | 6 ativos, 2 doc pendente |
| Tickets | 8 | Todas categorias |
| Claims | 4 | Ciclo completo |
| Mensagens Chat | ~20 | Análises + Tickets |
| Timeline | ~50 | Eventos históricos |
| Comissões | ~15 | Setup + recorrentes |

---

## Resultado Esperado na Demonstração

Ao acessar o portal demo, o usuário verá:

- **Dashboard**: KPIs reais com números expressivos
- **Kanban de Análises**: Cards em TODAS as colunas (30 análises)
- **Lista de Contratos**: Vários status e ações disponíveis
- **Central de Chamados**: Tickets em diferentes situações
- **Garantias**: Solicitações em todas as fases
- **Comissões**: Histórico de ganhos demonstrando o benefício

