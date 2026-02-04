
# Plano: Ajustes Diversos no Portal

## 1. Coluna COBERTURA na Lista de Contratos

### Problema
Atualmente a coluna "Cobertura" mostra o valor da `garantia_anual` (premio pago). O usuario quer que ela mostre a **Cobertura Total** (Valor Locaticio x 20), que representa o limite maximo de acionamento de garantias.

### Solucao
Adicionar uma nova coluna "Cobertura" que calcula `valor_total * 20` e manter a coluna "Garantia Anual" existente.

### Arquivos Afetados
- `src/components/contracts/ContractList.tsx` (Portal Tridots)
- `src/components/agency/AgencyContractList.tsx` (Portal Imobiliaria)

---

## 2. Banner de Documentacao Pendente

### Problema
O banner aparece para todos os contratos com status `documentacao_pendente`, mesmo quando a imobiliaria ja enviou os documentos e esta aguardando avaliacao da Tridots.

### Regra de Negocio Atualizada
O banner deve aparecer apenas quando:
- Existe contrato com `status = 'documentacao_pendente'` **E**
- Pelo menos um documento NAO foi enviado (`status = null`) **OU**
- Pelo menos um documento foi REJEITADO (`status = 'rejeitado'`)

Se todos os documentos estao com `status = 'enviado'` (aguardando validacao) ou `status = 'aprovado'`, o banner NAO deve aparecer.

### Arquivos Afetados
- `src/hooks/useContractsPendingDocs.ts` - Alterar query para filtrar corretamente

---

## 3. Bug do Calendario (Timezone)

### Problema
Ao selecionar uma data no calendario (ex: 05/02/2026), o campo exibe o dia anterior (04/02/2026).

### Causa Raiz
O problema ocorre na funcao `handleDateSelect` do `ClaimDebtTable.tsx`:

```typescript
const formattedDate = format(date, 'yyyy-MM-dd');
```

Quando a data e convertida para string no formato ISO sem considerar o timezone local, pode haver deslocamento de 1 dia dependendo do horario.

### Solucao
Usar a funcao `startOfDay` para normalizar a data antes de formatar, garantindo que a data selecionada seja preservada corretamente.

### Arquivo Afetado
- `src/components/agency/claims/ClaimDebtTable.tsx`

---

## 4. E-mail de Notificacao para Chamados

### Problema
Atualmente nao existe notificacao por e-mail quando a Tridots cria um chamado para a imobiliaria ou responde a um chamado existente.

### Solucao
Criar uma Edge Function `send-ticket-notification` que:
1. Recebe o ID do ticket e tipo de evento (novo_chamado ou nova_resposta)
2. Busca os dados do ticket e imobiliaria
3. Envia e-mail para:
   - O colaborador designado no chamado (se houver)
   - O e-mail principal da imobiliaria (`responsavel_email`)

### Trigger
Utilizar database triggers para disparar a funcao automaticamente quando:
- Um novo ticket e criado com `agency_id` preenchido
- Uma nova mensagem e inserida em `ticket_messages` por um usuario Tridots

### Arquivos a Criar/Modificar
- `supabase/functions/send-ticket-notification/index.ts` (nova Edge Function)
- `supabase/functions/_shared/email-templates.ts` (novo template)
- Migration para criar triggers no banco

---

## Secao Tecnica

### 1. ContractList.tsx - Adicionar Coluna Cobertura

Antes (linha 192):
```typescript
<TableHead className="text-right">Cobertura</TableHead>
```

Depois:
```typescript
<TableHead className="text-right">Garantia Anual</TableHead>
<TableHead className="text-right">Cobertura 20x</TableHead>
```

Valor da nova coluna:
```typescript
{contract.analysis?.valor_total 
  ? formatCurrency(contract.analysis.valor_total * 20)
  : '-'
}
```

### 2. useContractsPendingDocs.ts - Nova Logica

```typescript
// Buscar contratos onde:
// - status = 'documentacao_pendente'
// - E pelo menos um doc NAO enviado ou REJEITADO
const { data, error } = await supabase
  .from('contracts')
  .select('id, doc_contrato_locacao_status, doc_vistoria_inicial_status, doc_seguro_incendio_status')
  .eq('agency_id', agencyId)
  .eq('status', 'documentacao_pendente');

// Filtrar no frontend
const pendingCount = data?.filter(c => 
  c.doc_contrato_locacao_status === null ||
  c.doc_contrato_locacao_status === 'rejeitado' ||
  c.doc_vistoria_inicial_status === null ||
  c.doc_vistoria_inicial_status === 'rejeitado' ||
  c.doc_seguro_incendio_status === null ||
  c.doc_seguro_incendio_status === 'rejeitado'
).length || 0;
```

### 3. ClaimDebtTable.tsx - Correcao Timezone

Antes (linha 154):
```typescript
const formattedDate = format(date, 'yyyy-MM-dd');
```

Depois:
```typescript
// Usar a data local sem conversao de timezone
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;
```

### 4. Template de E-mail para Chamados

```typescript
// Novo template em email-templates.ts
export function ticketNotificationTemplate(data: {
  agencyName: string;
  ticketProtocol: string;
  ticketSubject: string;
  eventType: 'new_ticket' | 'new_reply';
  message?: string;
  portalUrl: string;
}): { subject: string; html: string }
```

### 5. Migration para Triggers

```sql
-- Funcao para disparar notificacao de novo ticket
CREATE OR REPLACE FUNCTION notify_agency_new_ticket()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar Edge Function apenas para tickets criados por usuarios Tridots
  IF NEW.agency_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url') || '/send-ticket-notification',
      body := jsonb_build_object(
        'ticket_id', NEW.id,
        'event_type', 'new_ticket'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos tickets
CREATE TRIGGER trigger_notify_agency_new_ticket
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_agency_new_ticket();

-- Funcao para disparar notificacao de nova mensagem
CREATE OR REPLACE FUNCTION notify_agency_new_ticket_message()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket RECORD;
  v_sender_role TEXT;
BEGIN
  -- Buscar ticket e role do sender
  SELECT t.*, p.role INTO v_ticket
  FROM tickets t
  LEFT JOIN profiles p ON p.id = NEW.sender_id
  WHERE t.id = NEW.ticket_id;
  
  -- Notificar apenas se mensagem foi enviada por usuario Tridots (master/analyst)
  SELECT role INTO v_sender_role FROM profiles WHERE id = NEW.sender_id;
  IF v_sender_role IN ('master', 'analyst') AND v_ticket.agency_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url') || '/send-ticket-notification',
      body := jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'message_id', NEW.id,
        'event_type', 'new_reply'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas mensagens
CREATE TRIGGER trigger_notify_agency_new_ticket_message
AFTER INSERT ON ticket_messages
FOR EACH ROW
EXECUTE FUNCTION notify_agency_new_ticket_message();
```

---

## Resumo das Alteracoes

| Item | Tipo | Arquivo(s) |
|------|------|------------|
| Coluna Cobertura 20x | Modificacao | ContractList.tsx, AgencyContractList.tsx |
| Banner Docs Pendentes | Modificacao | useContractsPendingDocs.ts |
| Bug Calendario | Modificacao | ClaimDebtTable.tsx |
| E-mail Chamados | Criacao | send-ticket-notification/index.ts, email-templates.ts, migration SQL |
