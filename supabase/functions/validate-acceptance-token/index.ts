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
        JSON.stringify({ valid: false, reason: "invalid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validating acceptance token:", token.substring(0, 8) + "...");

    // Fetch analysis by token
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select(`
        id,
        inquilino_nome,
        inquilino_cpf,
        inquilino_rg,
        inquilino_data_nascimento,
        inquilino_email,
        inquilino_telefone,
        inquilino_profissao,
        inquilino_empresa,
        inquilino_renda_mensal,
        imovel_endereco,
        imovel_numero,
        imovel_complemento,
        imovel_bairro,
        imovel_cidade,
        imovel_estado,
        imovel_cep,
        valor_total,
        valor_aluguel,
        taxa_garantia_percentual,
        setup_fee,
        setup_fee_exempt,
        terms_accepted_at,
        payer_name,
        payer_cpf,
        setup_payment_link,
        guarantee_payment_link,
        setup_payment_confirmed_at,
        guarantee_payment_confirmed_at,
        acceptance_token_expires_at,
        acceptance_token_used_at,
        agency:agencies(id, nome_fantasia, razao_social, logo_url)
      `)
      .eq("acceptance_token", token)
      .single();

    if (fetchError || !analysis) {
      console.log("Token not found in database");
      return new Response(
        JSON.stringify({ valid: false, reason: "invalid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is used (but allow continuing if not fully completed)
    if (analysis.acceptance_token_used_at) {
      console.log("Token already used");
      return new Response(
        JSON.stringify({ valid: false, reason: "used" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(analysis.acceptance_token_expires_at);
    if (expiresAt < new Date()) {
      console.log("Token expired");
      return new Response(
        JSON.stringify({ valid: false, reason: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate values
    const valorTotal = analysis.valor_total || analysis.valor_aluguel;
    const garantiaAnual = valorTotal * analysis.taxa_garantia_percentual / 100;
    const garantiaMensal = garantiaAnual / 12;
    const setupFee = analysis.setup_fee_exempt ? 0 : analysis.setup_fee;
    const primeiraParcela = setupFee + garantiaMensal;

    console.log("Token is valid:", { analysisId: analysis.id });

    return new Response(
      JSON.stringify({
        valid: true,
        expiresAt: analysis.acceptance_token_expires_at,
        analysis: {
          id: analysis.id,
          inquilino_nome: analysis.inquilino_nome,
          inquilino_cpf: analysis.inquilino_cpf,
          inquilino_rg: analysis.inquilino_rg,
          inquilino_data_nascimento: analysis.inquilino_data_nascimento,
          inquilino_email: analysis.inquilino_email,
          inquilino_telefone: analysis.inquilino_telefone,
          inquilino_profissao: analysis.inquilino_profissao,
          inquilino_empresa: analysis.inquilino_empresa,
          inquilino_renda_mensal: analysis.inquilino_renda_mensal,
          imovel_endereco: analysis.imovel_endereco,
          imovel_numero: analysis.imovel_numero,
          imovel_complemento: analysis.imovel_complemento,
          imovel_bairro: analysis.imovel_bairro,
          imovel_cidade: analysis.imovel_cidade,
          imovel_estado: analysis.imovel_estado,
          imovel_cep: analysis.imovel_cep,
          valor_total: valorTotal,
          valor_aluguel: analysis.valor_aluguel,
          taxa_garantia_percentual: analysis.taxa_garantia_percentual,
          setup_fee: analysis.setup_fee,
          setup_fee_exempt: analysis.setup_fee_exempt,
          garantia_mensal: garantiaMensal,
          garantia_anual: garantiaAnual,
          primeira_parcela: primeiraParcela,
          terms_accepted_at: analysis.terms_accepted_at,
          payer_name: analysis.payer_name,
          payer_cpf: analysis.payer_cpf,
          setup_payment_link: analysis.setup_payment_link,
          guarantee_payment_link: analysis.guarantee_payment_link,
          setup_payment_confirmed_at: analysis.setup_payment_confirmed_at,
          guarantee_payment_confirmed_at: analysis.guarantee_payment_confirmed_at,
        },
        agency: {
          id: analysis.agency?.id,
          nome: analysis.agency?.nome_fantasia || analysis.agency?.razao_social,
          logo_url: analysis.agency?.logo_url,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error validating token:", error);
    return new Response(
      JSON.stringify({ valid: false, reason: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
