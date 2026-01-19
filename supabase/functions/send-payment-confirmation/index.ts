import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paymentConfirmationTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmationRequest {
  analysis_id: string;
  test_mode?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const testEmail = Deno.env.get('TRIDOTS_NOTIFICATIONS_EMAIL') || 'testes@tridots.com.br';
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { analysis_id, test_mode = false }: PaymentConfirmationRequest = await req.json();

    // Buscar dados da análise
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        id,
        inquilino_nome,
        inquilino_email,
        imovel_endereco,
        imovel_numero,
        imovel_bairro,
        imovel_cidade,
        plano_garantia,
        agency:agencies(nome_fantasia, razao_social)
      `)
      .eq('id', analysis_id)
      .single();

    if (analysisError || !analysis) {
      return new Response(
        JSON.stringify({ success: false, error: 'Análise não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantEmail = analysis.inquilino_email;
    if (!tenantEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Inquilino não possui e-mail cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar endereço
    const addressParts = [
      analysis.imovel_endereco,
      analysis.imovel_numero,
      analysis.imovel_bairro,
      analysis.imovel_cidade
    ].filter(Boolean);
    const propertyAddress = addressParts.join(', ');

    // Nome da agência
    const agencyData = analysis.agency as { nome_fantasia?: string; razao_social?: string } | null;
    const agencyName = agencyData?.nome_fantasia || agencyData?.razao_social || 'Imobiliária';

    // Gerar e-mail
    const { subject, html } = paymentConfirmationTemplate({
      tenantName: analysis.inquilino_nome,
      propertyAddress,
      agencyName,
      planName: analysis.plano_garantia || 'Garantia Locatícia'
    });

    // Enviar e-mail
    const result = await sendEmail(
      resendApiKey,
      tenantEmail,
      subject,
      html,
      test_mode,
      testEmail
    );

    // Registrar no log
    await supabase.from('email_logs').insert({
      recipient_email: test_mode ? testEmail : tenantEmail,
      recipient_original: test_mode ? tenantEmail : null,
      template_type: 'payment_confirmation',
      subject,
      status: result.success ? 'sent' : 'failed',
      metadata: { analysis_id, test_mode },
      error_message: result.error,
      sent_at: result.success ? new Date().toISOString() : null
    });

    return new Response(
      JSON.stringify({
        success: result.success,
        message_id: result.messageId,
        error: result.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao enviar confirmação de pagamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
