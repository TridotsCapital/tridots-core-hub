
# Plano: Corrigir Criação/Edição de Usuários (Tridots e Imobiliária)

## Diagnóstico do Problema

O erro "edge function returned a non-2xx status code" é uma mensagem genérica do cliente Supabase. A edge function `create-user` está retornando erros específicos (como "A user with this email address has already been registered"), mas o hook `useCreateUser` não está extraindo corretamente a mensagem do corpo da resposta.

**Causa raiz**: Quando `supabase.functions.invoke` recebe um status não-2xx:
- `error` contém mensagem genérica
- `data` contém o corpo da resposta com a mensagem real

O código atual verifica `error` primeiro e ignora `data.error`.

---

## Solução

### 1. Corrigir o Hook `useCreateUser`

**Arquivo**: `src/hooks/useCreateUser.ts`

Alterar a ordem de verificação de erros para priorizar a mensagem específica:

```typescript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: params,
});

// Priorizar mensagem específica do corpo da resposta
if (data?.error) {
  throw new Error(translateErrorMessage(data.error));
}

// Fallback para erros de rede/invocação
if (error) {
  throw new Error(error.message || 'Falha ao criar usuário');
}
```

Adicionar função para traduzir mensagens de erro comuns:

```typescript
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'A user with this email address has already been registered': 
      'Este email já está cadastrado no sistema',
    'Missing required fields': 
      'Campos obrigatórios não preenchidos',
    'Invalid role for team member': 
      'Permissão inválida para membro da equipe',
    'Only masters can create team members': 
      'Apenas administradores podem criar membros da equipe',
    // ... outras traduções
  };
  return translations[message] || message;
}
```

### 2. Melhorar a Edge Function `create-user`

**Arquivo**: `supabase/functions/create-user/index.ts`

Tratar erro de email duplicado de forma mais amigável:

```typescript
if (createError) {
  console.error('Error creating user:', createError);
  
  // Mensagens específicas para erros comuns
  let userMessage = createError.message;
  if (createError.code === 'email_exists') {
    userMessage = 'Este email já está cadastrado no sistema';
  }
  
  return new Response(
    JSON.stringify({ error: userMessage }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 3. Validação Prévia de Email (Opcional - UX Melhorada)

Adicionar verificação de email antes de submeter o formulário:

**Arquivo**: `src/components/users/AddUserDialog.tsx`

```typescript
// Verificar se email já existe antes de criar
const checkEmailExists = async (email: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();
  return !!data;
};
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useCreateUser.ts` | Corrigir extração de erro + traduzir mensagens |
| `supabase/functions/create-user/index.ts` | Mensagens de erro em português |
| `src/components/users/AddUserDialog.tsx` | (Opcional) Validação prévia de email |

---

## Resultado Esperado

- Usuários Tridots: Criação com mensagens de erro claras em português
- Colaboradores Imobiliária: Mesmo comportamento com feedback adequado
- Emails duplicados: Mensagem específica "Este email já está cadastrado"
- Erros de permissão: Mensagens explicativas para cada caso
