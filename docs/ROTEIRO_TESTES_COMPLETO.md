# Roteiro de Testes Completo - Tridots Core Hub

## Resumo dos Dados de Teste Criados

| Módulo | Quantidade | Observações |
|--------|------------|-------------|
| **Análises** | 31 | Todos os status, planos, pagamentos, urgências |
| **Contratos** | 16 | Docs pendentes, ativos, vencidos, encerrados |
| **Claims (Garantias)** | 12 | Incluindo alto valor (≥R$10k) e stagnação |
| **Renovações** | 3 | Pendente, aprovada, concluída |
| **Tickets** | 8 | Diversos vínculos, status e prioridades |
| **Mensagens** | 14 | Conversas simuladas |
| **Comissões** | 6 | Setup e recorrentes |
| **Itens de Débito** | 14 | Aluguel, condomínio, IPTU |

**Imobiliária de Teste:** 1˚ Imobi Teste (ID: `cd5684fb-60af-45cd-b05e-3bc021c7da9f`)

---

## 🔍 Fase 1: Módulo de Análises

### Teste A1: Verificar Kanban da Agência
**Portal:** Agência (`/agency`)
1. Acessar Dashboard
2. Verificar se o mini-Kanban mostra as análises criadas
3. Clicar em "Ver todas" para acessar lista completa

**Verificações:**
- [ ] Análises aparecem na coluna correta por status
- [ ] Badges de plano (START 🚀, PRIME ⭐, EXCLUSIVE 👑) visíveis
- [ ] Badge de método de pagamento (PIX, 3x, 6x, 12x) visível

### Teste A2: Verificar Badges de Urgência
**Portal:** Tridots (`/analyses`)
1. Acessar Kanban de análises
2. Procurar cards com `updated_at` > 24h

**Verificações:**
- [ ] Badge amarelo "URGENTE" para 24-48h de inatividade
- [ ] Badge vermelho pulsante "URGENTE" para > 48h

**Análises com urgência criadas:**
- `Ana Paula Rodrigues` (30h - amarelo)
- `Fernando Almeida Santos` (55h - vermelho)
- `Marcelo Ribeiro Costa` (28h - amarelo, em_analise)
- `Patricia Oliveira Martins` (52h - vermelho, em_analise)

### Teste A3: Drag-Drop no Kanban
**Portal:** Tridots (`/analyses`)
1. Arrastar card de "Pendente" para "Em Análise"
2. Verificar se modal de atribuição de analista aparece
3. Tentar arrastar direto para "Aguardando Pagamento"

**Verificações:**
- [ ] Modal de analista aparece na transição Pendente → Em Análise
- [ ] Card reverte se tentar pular etapa

### Teste A4: Aprovar Análise com Ajuste de Taxa
**Portal:** Tridots (`/analyses`)
1. Abrir drawer de análise "Em Análise"
2. Clicar em "Aprovar"
3. Ajustar taxa de garantia (ex: 10% → 12%)
4. Preencher links de pagamento
5. Confirmar

**Verificações:**
- [ ] Badge "Taxa Ajustada" aparece no card
- [ ] Timeline registra evento "rate_adjusted"

**Análise para testar:** `Daniela Costa Freitas` (já tem rate_adjusted_by_tridots = true)

### Teste A5: Token de Aceite e Validação de Pagamentos
**Portal:** Tridots (`/analyses`)
1. Abrir análise "Aguardando Pagamento" com pagamentos confirmados
2. Verificar badge "Aguardando Validação"
3. Clicar em "Validar Pagamentos"
4. Inserir datas de pagamento

**Verificações:**
- [ ] Badge "Aguardando Validação" visível quando setup_payment_confirmed_at preenchido
- [ ] Modal de validação exige datas obrigatórias
- [ ] Card move para "Aprovadas" após validação
- [ ] Contrato criado automaticamente

**Análise para testar:** `Lucas Martins Alves`

### Teste A6: Reprovação Simplificada
**Portal:** Tridots (`/analyses`)
1. Abrir análise "Em Análise"
2. Clicar em "Reprovar"
3. Confirmar reprovação

**Verificações:**
- [ ] Modal NÃO exige categoria/motivo
- [ ] Card move para "Reprovadas"

---

## 📄 Fase 2: Módulo de Contratos

### Teste C1: Upload de Documentação (Portal Agência)
**Portal:** Agência (`/agency/contracts`)
1. Acessar contrato com docs pendentes
2. Fazer upload de cada documento (Locação, Vistoria, Seguro, Administrativo)

**Verificações:**
- [ ] Badge "Enviado" aparece após upload
- [ ] Contador de docs atualiza (ex: 1/4)

**Contrato para testar:** Contrato de `Thiago Nascimento Lima` (C1 - 0/4 docs)

### Teste C2: Aprovação de Documentos (Portal Tridots)
**Portal:** Tridots (`/contracts`)
1. Acessar contrato com docs enviados
2. Revisar e aprovar cada documento
3. Quando 4/4 aprovados, verificar botão "Ativar Contrato"

**Verificações:**
- [ ] Botão de aprovar/rejeitar funciona
- [ ] Feedback aparece ao rejeitar
- [ ] Botão "Ativar" aparece quando todos aprovados

**Contrato para testar:** `Roberto Mendes Junior` (C3 - 4/4 enviados)

### Teste C3: Alertas de Vencimento
**Portal:** Tridots (`/contracts`)
1. Verificar contratos próximos do vencimento
2. Observar badges de alerta

**Verificações:**
- [ ] Badge "No Prazo de Renovação" para contratos a 30 dias
- [ ] Badge crítico para contratos vencidos

**Contratos para verificar:**
- `Vinícius Mendes Rocha` (C6 - vence em 30 dias)
- `Larissa Barbosa Melo` (C7 - vence em 15 dias)
- `Felipe Augusto Reis` (C8 - vence em 7 dias)
- `Carla Mendonça Silva` (C9 - vencido há 30 dias)

### Teste C4: Fluxo de Renovação
**Portal:** Agência (`/agency/contracts/:id`)
1. Acessar contrato no prazo de renovação
2. Verificar aba "Renovação"
3. Visualizar solicitação pendente

**Portal:** Tridots (`/contracts/:id`)
4. Aprovar renovação
5. Enviar notificação por e-mail

**Verificações:**
- [ ] Histórico de renovações visível
- [ ] Status de cada renovação correto
- [ ] Botão de notificação funciona

**Contrato para testar:** `Vinícius Mendes Rocha` (C6 - renovação pendente da agência)

---

## ⚠️ Fase 3: Módulo de Garantias (Claims)

### Teste G1: Verificar Kanban de Claims (Portal Agência)
**Portal:** Agência (`/agency/claims`)
1. Acessar lista de garantias
2. Verificar cards por status público

**Verificações:**
- [ ] Claims aparecem corretamente
- [ ] Badges de valor e status visíveis

### Teste G2: Verificar Kanban Interno (Portal Tridots)
**Portal:** Tridots (`/claims`)
1. Acessar Kanban de claims
2. Verificar colunas por status interno

**Verificações:**
- [ ] Etapa "Exoneração e Despejo" com cor rose-700 (crítico)
- [ ] Claims de alto valor (≥R$10k) com badge roxo pulsante

**Claims de alto valor:**
- R$ 12.000 (solicitado)
- R$ 15.000 (em análise)

### Teste G3: Bloqueio de Duplicidade
**Portal:** Agência (`/agency/claims/new`)
1. Tentar criar nova claim para contrato que já tem claim ativa
2. Verificar mensagem de bloqueio

**Verificações:**
- [ ] Alerta aparece com link para claim existente
- [ ] Não permite criar duplicata

### Teste G4: Stagnação de Claims
**Portal:** Tridots (`/claims`)
1. Verificar claims com `last_internal_status_change_at` > 7 dias

**Verificações:**
- [ ] Indicador de stagnação visível

**Claim para verificar:** Claim de `Cláudia Fernandes Silva` (10 dias sem atualização)

### Teste G5: Detalhes de Claim
**Portal:** Tridots (`/claims/:id`)
1. Abrir detalhe de uma claim
2. Verificar abas: Itens, Timeline, Documentos, Notas

**Verificações:**
- [ ] CoverageCard mostra barra de consumo
- [ ] Itens de débito listados corretamente
- [ ] Timeline registra eventos

---

## 💬 Fase 4: Tickets e Notificações

### Teste T1: Criar Novo Ticket (Portal Agência)
**Portal:** Agência (`/agency/support`)
1. Criar novo ticket
2. Selecionar categoria e prioridade
3. Vincular a uma análise/contrato
4. Enviar mensagem

**Verificações:**
- [ ] Ticket aparece na lista
- [ ] Vínculo correto exibido

### Teste T2: Responder Ticket (Portal Tridots)
**Portal:** Tridots (`/tickets`)
1. Abrir ticket recém-criado
2. Responder mensagem
3. Verificar notificação gerada

**Verificações:**
- [ ] Mensagem aparece no chat
- [ ] Notificação criada para usuário da agência
- [ ] Badge de não lido aparece no sino

### Teste T3: Indicadores de Não Lido
**Portal:** Ambos
1. Verificar sino de notificações
2. Marcar como lida
3. Verificar atualização do badge

**Verificações:**
- [ ] Badge mostra contagem correta
- [ ] Badge atualiza ao marcar como lida

### Teste T4: Encerramento e NPS
**Portal:** Agência
1. Abrir ticket resolvido
2. Verificar se NPS pendente aparece

**Verificações:**
- [ ] Modal de NPS aparece para tickets resolvidos

---

## 💰 Fase 5: Comissões

### Teste CO1: Visualizar Comissões (Portal Agência)
**Portal:** Agência (`/agency/commissions`)
1. Acessar página de comissões
2. Verificar listagem

**Verificações:**
- [ ] Comissões da agência visíveis
- [ ] Status correto (Pendente, Paga)
- [ ] Valores corretos

### Teste CO2: Gestão de Comissões (Portal Tridots)
**Portal:** Tridots (`/commissions`)
1. Acessar página de comissões
2. Marcar comissão como "Paga"
3. Verificar atualização

**Verificações:**
- [ ] Status atualiza para "Paga"
- [ ] Data de pagamento registrada

---

## 👥 Fase 6: Colaboradores

### Teste COL1: Listar Colaboradores
**Portal:** Agência (`/agency/collaborators`)
1. Acessar página de colaboradores
2. Verificar listagem

**Verificações:**
- [ ] Colaboradores da agência listados
- [ ] Posições exibidas corretamente

### Teste COL2: Adicionar Colaborador
**Portal:** Agência (`/agency/collaborators`)
1. Clicar em "Adicionar Colaborador"
2. Preencher dados
3. Confirmar

**Verificações:**
- [ ] Colaborador criado
- [ ] Vinculado à agência correta

---

## 📧 Fase 7: E-mails Transacionais

### Teste E1: Aceite Digital (T1)
**Via:** Edge Function `test-email-notifications`
```json
{
  "scenario": "T1",
  "test_email": "gabriel-cichoki@hotmail.com"
}
```

**Verificações:**
- [ ] Logo aparece (CID inline)
- [ ] Link aponta para aceite.tridotscapital.com
- [ ] Dados do inquilino corretos

### Teste E2: Renovação (T2)
**Via:** Edge Function `test-email-notifications`
```json
{
  "scenario": "T2",
  "test_email": "gabriel-cichoki@hotmail.com"
}
```

**Verificações:**
- [ ] Logo aparece
- [ ] Link de renovação correto
- [ ] Valores atualizados

### Teste E3: Pagamento Confirmado (T3)
**Via:** Edge Function `test-email-notifications`
```json
{
  "scenario": "T3",
  "test_email": "gabriel-cichoki@hotmail.com"
}
```

**Verificações:**
- [ ] Logo aparece
- [ ] Dados do pagamento corretos

### Teste E4: Contrato Ativado (T4)
**Via:** Edge Function `test-email-notifications`
```json
{
  "scenario": "T4",
  "test_email": "gabriel-cichoki@hotmail.com"
}
```

**Verificações:**
- [ ] Logo aparece
- [ ] Dados do contrato corretos
- [ ] Enviado para inquilino E imobiliária

### Teste E5: Cadastro Aprovado (T5)
**Via:** Edge Function `test-email-notifications`
```json
{
  "scenario": "T5",
  "test_email": "gabriel-cichoki@hotmail.com"
}
```

**Verificações:**
- [ ] Logo aparece
- [ ] Link para portal correto (/auth)

---

## ✅ Checklist Final

### Portal Agência
- [ ] Dashboard carrega corretamente
- [ ] Mini-Kanban exibe análises
- [ ] Lista de contratos funciona
- [ ] Filtros de busca funcionam
- [ ] Upload de documentos funciona
- [ ] Criação de tickets funciona
- [ ] Notificações em tempo real
- [ ] Comissões visíveis

### Portal Tridots
- [ ] Kanban de análises funciona
- [ ] Drag-drop respeita regras
- [ ] Aprovação/reprovação funciona
- [ ] Validação de pagamentos funciona
- [ ] Contratos listam corretamente
- [ ] Renovações funcionam
- [ ] Claims Kanban funciona
- [ ] Tickets funcionam
- [ ] Comissões gerenciáveis

### Integrações
- [ ] E-mails com logo inline
- [ ] Notificações em tempo real
- [ ] Links de aceite funcionais

---

## 🗑️ Limpeza (Se Necessário)

Para remover todos os dados de teste:

```sql
-- Executar com cuidado!
DELETE FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f');
DELETE FROM tickets WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f';
DELETE FROM claim_items WHERE claim_id IN (SELECT id FROM claims WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f');
DELETE FROM claims WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f';
DELETE FROM commissions WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f';
DELETE FROM contract_renewals WHERE contract_id IN (SELECT id FROM contracts WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f');
DELETE FROM contracts WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f';
DELETE FROM analyses WHERE agency_id = 'cd5684fb-60af-45cd-b05e-3bc021c7da9f';
```

---

## Observações

1. **Acesso Portal Agência:** Login com usuário da imobiliária teste
2. **Acesso Portal Tridots:** Login com usuário master
3. **Tempo estimado:** 2-3 horas para execução completa
4. **Prioridade:** Módulos de Análises e Claims são críticos
