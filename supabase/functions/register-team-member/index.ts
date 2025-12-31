import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamMemberData {
  user_id: string;
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

    const data: TeamMemberData = await req.json();
    
    console.log("Registering team member:", data.user_id);

    // Create user_roles record (role = 'analyst')
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: data.user_id,
        role: "analyst",
      });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao definir permissão", details: roleError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created: analyst");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta de analista criada com sucesso!" 
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
