

# Plano: Remover menção à imobiliária do corpo dos e-mails para inquilinos

## Problema

Em e-mails destinados ao inquilino, o nome da imobiliária aparece no texto introdutório, dando a entender que a garantia é da imobiliária. A imobiliária deve aparecer apenas na tabela de "Dados da Garantia", nunca no corpo/introdução. A garantia é da Tridots Capital.

## Templates afetados (todos no arquivo `supabase/functions/_shared/email-templates.ts`)

### 1. Aceite Digital (linha 120)
**Atual:** `"Sua análise de garantia locatícia foi aprovada pela ${data.agencyName}!"`
**Novo:** `"Sua análise de garantia locatícia foi aprovada pela Tridots Capital! Agora você precisa concluir o processo de aceite digital para ativar sua garantia."`
(remover a frase duplicada "Agora você precisa..." que vem logo depois)

### 2. Lembrete de Renovação (linha 210)
**Atual:** `"Entre em contato com a ${data.agencyName} para renovar sua garantia e continuar protegido pela Tridots Capital."`
**Novo:** `"Entre em contato com sua imobiliária ou acesse o portal para renovar sua garantia e continuar protegido pela Tridots Capital."`

### 3. Confirmação de Pagamento (linha 258)
**Atual:** `"Aguarde a ativação do contrato pela sua imobiliária."`
**Novo:** `"Aguarde a ativação do seu contrato pela Tridots Capital. Você receberá um e-mail quando estiver tudo pronto!"`

### 4. Contrato Ativado - Inquilino (linha 312)
**Atual:** `"Mantenha seus pagamentos em dia para continuar protegido. Em caso de dúvidas, entre em contato com sua imobiliária."`
**Novo:** `"Mantenha seus pagamentos em dia para continuar protegido. Em caso de dúvidas, entre em contato pelo portal da Tridots Capital."`

### 5. Aceite Digital — cláusula final (linha 152)
**Atual:** `"...confirma a contratação da garantia locatícia e autoriza a cobrança conforme os termos apresentados."`
**Novo:** `"...confirma a contratação da garantia locatícia junto à Tridots Capital e autoriza a cobrança conforme os termos apresentados."`

## Templates que NÃO precisam de alteração
- Templates para imobiliárias (ativação de cadastro, faturas, boletos, bloqueio, comissões, chamados) — esses são destinados à imobiliária, então mencionar o nome dela é correto.

## Arquivo alterado
- `supabase/functions/_shared/email-templates.ts` — 5 trechos

## Exemplo final — E-mail de Aceite Digital

> Olá, **Rayana**!
>
> Sua análise de garantia locatícia foi aprovada pela **Tridots Capital**! Agora você precisa concluir o processo de aceite digital para ativar sua garantia.
>
> **Dados da Garantia**
> Imóvel: Rua João Carlos Polo, 1363 ...
> Imobiliária: Massaru Imóveis *(apenas aqui, na tabela)*
>
> Ao concluir o aceite digital, você confirma a contratação da garantia locatícia **junto à Tridots Capital** e autoriza a cobrança conforme os termos apresentados.

