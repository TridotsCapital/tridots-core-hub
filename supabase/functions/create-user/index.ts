import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  type: 'team' | 'agency_collaborator';
  role?: 'master' | 'analyst';
  agency_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get the authorization header to identify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, type, role, agency_id } = body;

    // Validate required fields
    if (!email || !password || !full_name || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate permissions based on type
    if (type === 'team') {
      // Check if requesting user is master
      const { data: isMaster } = await supabaseAdmin.rpc('is_master', { _user_id: requestingUser.id });
      
      if (!isMaster) {
        return new Response(
          JSON.stringify({ error: 'Only masters can create team members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!role || !['master', 'analyst'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role for team member' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (type === 'agency_collaborator') {
      if (!agency_id) {
        return new Response(
          JSON.stringify({ error: 'Agency ID is required for collaborators' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if requesting user belongs to the same agency
      const { data: agencyLink } = await supabaseAdmin
        .from('agency_users')
        .select('id')
        .eq('user_id', requestingUser.id)
        .eq('agency_id', agency_id)
        .single();

      if (!agencyLink) {
        return new Response(
          JSON.stringify({ error: 'You can only add collaborators to your own agency' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if agency is active
      const { data: agency } = await supabaseAdmin
        .from('agencies')
        .select('active')
        .eq('id', agency_id)
        .single();

      if (!agency?.active) {
        return new Response(
          JSON.stringify({ error: 'Cannot add collaborators to inactive agency' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create the user with admin API
    let userId: string;
    let isRecoveredOrphan = false;
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Check if this is an "email already exists" error - might be an orphan user
      const isEmailExistsError = 
        createError.message?.includes('already been registered') || 
        createError.message?.includes('already exists') ||
        createError.message?.includes('User already registered');
      
      if (isEmailExistsError) {
        console.log('Email exists, checking for orphan user...');
        
        // Try to find the existing user
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          return new Response(
            JSON.stringify({ error: 'Erro ao verificar usuário existente' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          // Check if user has a profile
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, active')
            .eq('id', existingUser.id)
            .single();
          
          if (!existingProfile) {
            // This is an orphan user - recover it by creating the profile
            console.log(`Orphan user detected: ${email}. Recovering...`);
            
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: existingUser.id,
                email: email,
                full_name: full_name,
                active: true
              });
            
            if (profileError) {
              console.error('Error creating profile for orphan user:', profileError);
              return new Response(
                JSON.stringify({ error: 'Erro ao recuperar usuário. Contate o suporte.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            // Update password for the recovered user
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              { password: password }
            );
            
            if (updateError) {
              console.error('Error updating password for orphan user:', updateError);
              // Continue anyway, user can reset password later
            }
            
            userId = existingUser.id;
            isRecoveredOrphan = true;
            console.log(`Orphan user recovered successfully: ${email}`);
          } else {
            // User has profile - check if active
            if (!existingProfile.active) {
              return new Response(
                JSON.stringify({ error: 'Este email pertence a um usuário desativado. Contate o administrador.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            // Profile exists and is active - truly duplicate
            return new Response(
              JSON.stringify({ error: 'Este email já está cadastrado e ativo no sistema' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // Couldn't find the user - generic error
          return new Response(
            JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (createError.message?.includes('invalid email')) {
        return new Response(
          JSON.stringify({ error: 'Email inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (createError.message?.includes('password')) {
        return new Response(
          JSON.stringify({ error: 'Senha inválida. Verifique os requisitos de segurança.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: createError.message || 'Erro ao criar usuário' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      userId = newUser.user.id;
    }

    // The profile is created automatically by the handle_new_user trigger
    // Now add role-specific records

    if (type === 'team') {
      // Add to user_roles
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: role });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Clean up: delete the created user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Failed to assign role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (type === 'agency_collaborator') {
      // Add to agency_users
      const { error: agencyUserError } = await supabaseAdmin
        .from('agency_users')
        .insert({ user_id: userId, agency_id: agency_id, is_primary_contact: false });

      if (agencyUserError) {
        console.error('Error linking to agency:', agencyUserError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Failed to link user to agency' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add agency_user role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'agency_user' });

      if (roleError) {
        console.error('Error assigning agency role:', roleError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Failed to assign role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`User ${isRecoveredOrphan ? 'recovered' : 'created'} successfully: ${email} (${type})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        recovered: isRecoveredOrphan,
        message: isRecoveredOrphan 
          ? 'Usuário existente recuperado e vinculado com sucesso'
          : 'Usuário criado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
