

# Melhorar design da secao de boleto e adicionar status

## Problema
A secao de boleto atual usa `bg-primary/5` com `border-primary/30` que gera um visual azulado forte demais, nao harmonioso com o resto da pagina. Alem disso, falta um indicador claro do status do pagamento (disponivel, pago, atrasado).

## Mudancas no arquivo `src/pages/agency/AgencyInvoices.tsx`

### 1. Redesign visual do card de boleto
- Trocar `bg-primary/5 border-primary/30` por fundo branco neutro com borda suave (`border border-border`)
- Usar fundo neutro `bg-muted/50` para o bloco de codigo de barras (ja esta ok)
- Badge de status com cores contextuais em vez de azul fixo

### 2. Adicionar status dinamico do boleto
Mostrar o status real da fatura no header do card:
- **Boleto disponivel** (badge azul): quando `hasBoleto = true` e status != `paga`
- **Fatura paga** (badge verde): quando status = `paga`
- **Fatura atrasada** (badge vermelho): quando status = `atrasada`
- **Fatura pendente** (badge amarelo): quando status = `pendente` e nao tem boleto

### 3. Layout mais limpo
- Separar visualmente o botao de download, o codigo de barras e as observacoes com espacamento adequado
- Usar `Separator` entre as subsecoes para clareza
- Remover excesso de cor de fundo que polui o visual
- Manter consistencia com o design system existente (cards brancos, bordas sutis)

## Arquivo afetado

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/agency/AgencyInvoices.tsx` | Redesign do card de boleto: cores neutras, status dinamico, layout limpo |

