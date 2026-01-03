import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateTokenRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: ValidateTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, reason: "token_missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find analysis by token
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select(`
        *,
        agency:agencies(id, razao_social, nome_fantasia, logo_url)
      `)
      .eq("acceptance_token", token)
      .single();

    if (fetchError || !analysis) {
      return new Response(
        JSON.stringify({ valid: false, reason: "token_invalid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token was already used
    if (analysis.acceptance_token_used_at) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: "token_used",
          paymentStatus: analysis.payment_confirmed_at ? "completed" : "pending",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token expired
    const expiresAt = new Date(analysis.acceptance_token_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, reason: "token_expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate values
    const valorTotal = analysis.valor_total || analysis.valor_aluguel;
    const garantiaMensal = (valorTotal * analysis.taxa_garantia_percentual / 100) / 12;
    const setupFee = analysis.setup_fee_exempt ? 0 : analysis.setup_fee;
    const primeiraParcela = setupFee + garantiaMensal;

    // Return analysis data for the acceptance page
    return new Response(
      JSON.stringify({
        valid: true,
        analysis: {
          id: analysis.id,
          inquilino_nome: analysis.inquilino_nome,
          inquilino_cpf: analysis.inquilino_cpf,
          inquilino_email: analysis.inquilino_email,
          inquilino_telefone: analysis.inquilino_telefone,
          imovel_endereco: analysis.imovel_endereco,
          imovel_numero: analysis.imovel_numero,
          imovel_cidade: analysis.imovel_cidade,
          imovel_estado: analysis.imovel_estado,
          imovel_cep: analysis.imovel_cep,
          valor_total: valorTotal,
          taxa_garantia_percentual: analysis.taxa_garantia_percentual,
          setup_fee: setupFee,
          setup_fee_exempt: analysis.setup_fee_exempt,
          garantia_mensal: garantiaMensal,
          primeira_parcela: primeiraParcela,
          terms_accepted_at: analysis.terms_accepted_at,
          payer_name: analysis.payer_name,
          payer_cpf: analysis.payer_cpf,
        },
        agency: {
          id: analysis.agency.id,
          nome: analysis.agency.nome_fantasia || analysis.agency.razao_social,
          logo_url: analysis.agency.logo_url,
        },
        expiresAt: analysis.acceptance_token_expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error validating acceptance token:", error);
    return new Response(
      JSON.stringify({ valid: false, reason: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
