import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgencyRegistrationData {
  user_id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email: string;
  telefone?: string;
  responsavel_nome: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: AgencyRegistrationData = await req.json();
    
    console.log("Registering agency for user:", data.user_id);

    // 1. Create agency record (active = false, percentual_comissao = 0)
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        email: data.email,
        telefone: data.telefone || null,
        responsavel_nome: data.responsavel_nome,
        responsavel_email: data.responsavel_email || null,
        responsavel_telefone: data.responsavel_telefone || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        active: false,
        percentual_comissao_recorrente: 0,
      })
      .select()
      .single();

    if (agencyError) {
      console.error("Error creating agency:", agencyError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar imobiliária", details: agencyError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Agency created:", agency.id);

    // 2. Create agency_users record (link user to agency)
    const { error: agencyUserError } = await supabase
      .from("agency_users")
      .insert({
        user_id: data.user_id,
        agency_id: agency.id,
        is_primary_contact: true,
      });

    if (agencyUserError) {
      console.error("Error creating agency_user:", agencyUserError);
      // Rollback: delete agency
      await supabase.from("agencies").delete().eq("id", agency.id);
      return new Response(
        JSON.stringify({ error: "Erro ao vincular usuário", details: agencyUserError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Agency user linked");

    // 3. Create user_roles record (role = 'agency_user')
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: data.user_id,
        role: "agency_user",
      });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      // Rollback
      await supabase.from("agency_users").delete().eq("user_id", data.user_id);
      await supabase.from("agencies").delete().eq("id", agency.id);
      return new Response(
        JSON.stringify({ error: "Erro ao definir permissão", details: roleError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created: agency_user");

    return new Response(
      JSON.stringify({ 
        success: true, 
        agency_id: agency.id,
        message: "Cadastro realizado com sucesso! Seu perfil está em análise." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
