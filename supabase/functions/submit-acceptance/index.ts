import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitAcceptanceRequest {
  token: string;
  identityPhotoPath: string;
  payerData: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    isTenant: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, identityPhotoPath, payerData }: SubmitAcceptanceRequest = await req.json();

    if (!token || !identityPhotoPath || !payerData) {
      throw new Error("Missing required fields");
    }

    // Validate token
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("id, acceptance_token_expires_at, acceptance_token_used_at")
      .eq("acceptance_token", token)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Token inválido");
    }

    if (analysis.acceptance_token_used_at) {
      throw new Error("Token já foi utilizado");
    }

    const expiresAt = new Date(analysis.acceptance_token_expires_at);
    if (expiresAt < new Date()) {
      throw new Error("Token expirado");
    }

    // Update analysis with acceptance data
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        terms_accepted_at: new Date().toISOString(),
        identity_photo_path: identityPhotoPath,
        payer_name: payerData.name,
        payer_cpf: payerData.cpf,
        payer_email: payerData.email,
        payer_phone: payerData.phone,
        payer_address: payerData.address,
        payer_number: payerData.number,
        payer_complement: payerData.complement || null,
        payer_neighborhood: payerData.neighborhood,
        payer_city: payerData.city,
        payer_state: payerData.state,
        payer_cep: payerData.cep,
        payer_is_tenant: payerData.isTenant,
      })
      .eq("id", analysis.id);

    if (updateError) {
      throw updateError;
    }

    // Log timeline events
    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysis.id,
      _event_type: "terms_accepted",
      _description: "Termos aceitos pelo inquilino",
      _metadata: {},
    });

    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysis.id,
      _event_type: "identity_verified",
      _description: "Documento de identidade enviado para verificação",
      _metadata: { photo_path: identityPhotoPath },
    });

    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysis.id,
      _event_type: "payer_confirmed",
      _description: payerData.isTenant 
        ? "Pagador confirmado como o próprio inquilino" 
        : `Pagador confirmado: ${payerData.name}`,
      _metadata: { is_tenant: payerData.isTenant },
    });

    console.log("Acceptance submitted:", { analysisId: analysis.id });

    return new Response(
      JSON.stringify({ success: true, analysisId: analysis.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error submitting acceptance:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
