

# Plano: Corrigir Link de Pagamento da Garantia + Texto de Contato

## Problema 1: Tela vazia no Step 3 (Pagamento Garantia)

O bug é um desalinhamento entre o **número do step lógico** e o **número do step no código**:

- Quando `setup_fee_exempt = true`, o fluxo tem 3 steps: Termos (1), Confirmação (2), Pagamento Garantia (3)
- Após o step 2, o código faz `setCurrentStep(3)`
- **Porém**, o card de "Pagamento da Garantia" só renderiza quando `currentStep === 4` (linha 1284)
- O card de step 3 (`currentStep === 3 && !isSetupExempt`) é o de Setup Payment, que fica oculto porque `isSetupExempt = true`
- Resultado: **tela vazia** — nenhum card é renderizado no step 3

## Problema 2: Texto de contato errado no rodapé

O rodapé diz "Dúvidas? Entre em contato com a imobiliária {nome}". O correto é direcionar para a Tridots Capital via WhatsApp.

## Solução

### Arquivo: `src/pages/TenantAcceptance.tsx`

**1. Corrigir renderização do step de garantia**

Alterar a condição do card de Pagamento da Garantia de:
```
currentStep === 4
```
Para:
```
(currentStep === 4) || (currentStep === 3 && isSetupExempt && !isBoletoUnificado)
```

Isso faz o card aparecer no step 3 quando setup é isento (não existe step de setup para pular).

**2. Corrigir botão "Voltar" no card de garantia quando renderizado no step 3**

Ajustar o `onClick` do botão Voltar para considerar que o step anterior é 2 (e não 3).

**3. Corrigir texto do rodapé (linha 1444-1446)**

De:
```
Dúvidas? Entre em contato com a imobiliária {agency?.nome}
```
Para:
```
Dúvidas? Entre em contato com a Tridots Capital pelo WhatsApp (44) 9 9177-8859
```
Com link clicável para `https://wa.me/5544991778859`.

## Impacto

- 1 arquivo alterado (`TenantAcceptance.tsx`)
- Corrige o bug crítico que impede inquilinos de verem o link de pagamento
- Corrige o texto de contato em todas as páginas de aceite

