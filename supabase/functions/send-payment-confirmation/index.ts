import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { paymentConfirmationTemplate } from "../_shared/email-templates.ts";
import {
  corsHeaders,
  initNotificationContext,
  validateResendKey,
  sendAndLog,
  errorResponse,
  successResponse,
  notFoundResponse,
} from "../_shared/notification-utils.ts";

interface PaymentConfirmationRequest {
  analysis_id: string;
  test_mode?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, resendApiKey, testEmail } = initNotificationContext();

    const keyError = validateResendKey(resendApiKey);
    if (keyError) return keyError;

    const { analysis_id, test_mode = false }: PaymentConfirmationRequest = await req.json();

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
      return notFoundResponse('Análise não encontrada');
    }

    const tenantEmail = analysis.inquilino_email;
    if (!tenantEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Inquilino não possui e-mail cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const addressParts = [
      analysis.imovel_endereco,
      analysis.imovel_numero,
      analysis.imovel_bairro,
      analysis.imovel_cidade
    ].filter(Boolean);
    const propertyAddress = addressParts.join(', ');

    const agencyData = analysis.agency as { nome_fantasia?: string; razao_social?: string } | null;
    const agencyName = agencyData?.nome_fantasia || agencyData?.razao_social || 'Imobiliária';

    const { subject, html } = paymentConfirmationTemplate({
      tenantName: analysis.inquilino_nome,
      propertyAddress,
      agencyName,
      planName: analysis.plano_garantia || 'Garantia Locatícia'
    });

    const result = await sendAndLog(supabase, {
      resendApiKey: resendApiKey!,
      recipientEmail: tenantEmail,
      subject,
      html,
      templateType: 'payment_confirmation',
      referenceId: analysis_id,
      recipientName: analysis.inquilino_nome,
      testMode: test_mode,
      testEmail,
      metadata: { analysis_id, test_mode },
    });

    return successResponse({
      success: result.success,
      message_id: result.messageId,
      error: result.error,
    });

  } catch (error) {
    return errorResponse(error, 'send-payment-confirmation');
  }
});
