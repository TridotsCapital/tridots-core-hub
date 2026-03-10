

# Exibir eventos de correção manual na timeline do contrato (Tridots + Imobiliária)

## Problema
Os eventos `manual_date_correction` foram inseridos na tabela `analysis_timeline`, mas as timelines dos contratos (tanto na visão Tridots quanto na visão da imobiliária) são construídas localmente a partir de campos do contrato/análise — não consultam a `analysis_timeline`. Por isso, a correção manual não aparece.

## Solução
Buscar eventos do tipo `manual_date_correction` da tabela `analysis_timeline` e injetá-los na timeline de eventos do contrato em ambas as páginas.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ContractDetail.tsx` | Adicionar query para buscar eventos `manual_date_correction` da `analysis_timeline` pelo `analysisId` e injetá-los no array `timelineEvents` com ícone `Pencil` e cor laranja |
| `src/components/agency/AgencyContractDetail.tsx` | Mesma lógica: buscar eventos `manual_date_correction` da `analysis_timeline` pelo `id` (analysis_id) e injetá-los no array `timelineEvents` |

## Detalhe da implementação

Em cada arquivo:

1. Adicionar uma query `useQuery` para buscar da `analysis_timeline` filtrando por `analysis_id` e `event_type = 'manual_date_correction'`
2. No bloco de construção do `timelineEvents`, iterar os resultados e adicionar entradas com:
   - `icon: Pencil` (importar de lucide-react)
   - `iconColor: 'text-orange-500'`
   - `title: 'Correção Manual de Datas'`
   - `description`: usar o campo `description` do evento
   - `type: 'contract'`
3. O tipo `TimelineEvent` já suporta isso sem alterações

