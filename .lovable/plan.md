
# Plano: Garantir Funcionamento de Criação/Edição de Usuários

## Diagnóstico Final

O erro "email já cadastrado" está correto tecnicamente - o email `lamadreseguros@gmail.com` **existe** no sistema de autenticação do Supabase (auth.users), mas:
- **Não tem profile** na tabela pública `profiles`
- **Não aparece na listagem** porque a UI busca apenas de `profiles`

Este é um "usuário órfão" - criado no sistema de auth mas sem registro completo.

## Causas Possíveis
1. Tentativa anterior de registro que falhou após criar o usuário no auth
2. Trigger `handle_new_user` falhou silenciosamente
3. Registro via outro fluxo que não completou

---

## Solução Proposta

### 1. Melhorar Edge Function `create-user`

Adicionar lógica para detectar e recuperar usuários órfãos:

```text
┌─────────────────────┐
│ Tentar criar user   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌────────────────────────┐
│ Email já existe?    │────▶│ Verificar se tem       │
└─────────────────────┘ SIM │ profile no sistema     │
                            └───────────┬────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
          ┌─────────────────┐                    ┌─────────────────┐
          │ Tem profile?    │                    │ Usuário órfão   │
          │ Erro: duplicado │                    │ Recuperar!      │
          └─────────────────┘                    └─────────────────┘
```

**Novo fluxo:**
1. Tentar criar usuário via `auth.admin.createUser`
2. Se falhar com "email exists":
   - Buscar o user_id existente via listagem
   - Verificar se existe profile para esse user_id
   - Se NÃO existe profile → criar profile + vincular roles
   - Se existe profile → retornar erro "email já cadastrado"

### 2. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/create-user/index.ts` | Adicionar lógica de recuperação de usuário órfão |
| `src/hooks/useCreateUser.ts` | Adicionar tradução para novas mensagens |

### 3. Código Principal - Edge Function

```typescript
// Após erro de email duplicado, verificar se é usuário órfão
if (createError?.message?.includes('already been registered')) {
  // Buscar usuário existente
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users?.find(u => u.email === email);
  
  if (existingUser) {
    // Verificar se tem profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', existingUser.id)
      .single();
    
    if (!profile) {
      // É usuário órfão - criar profile manualmente
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: existingUser.id,
          email: email,
          full_name: full_name
        });
      
      if (!profileError) {
        // Continuar com vinculação de roles...
        userId = existingUser.id;
        // Prosseguir normalmente
      }
    } else {
      // Profile existe - é duplicado real
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado e ativo no sistema' }),
        { status: 400, ... }
      );
    }
  }
}
```

### 4. Melhorias de UX Adicionais

- Mensagem clara quando usuário é recuperado: "Usuário existente vinculado com sucesso"
- Log de auditoria para rastrear recuperações
- Opção futura: tela de administração para ver/limpar usuários órfãos

---

## Resumo da Implementação

1. **Edge Function** - Detectar email duplicado + verificar se é órfão + recuperar automaticamente
2. **Hook Frontend** - Traduzir novas mensagens de sucesso/erro
3. **Validação** - Garantir que novo usuário recebe role correta mesmo em recuperação

## Resultado Esperado

- ✅ Criar novos usuários Tridots funciona
- ✅ Criar colaboradores de imobiliária funciona  
- ✅ Emails duplicados reais mostram erro claro
- ✅ Usuários órfãos são recuperados automaticamente
- ✅ Mensagens em português claras para todos os cenários
