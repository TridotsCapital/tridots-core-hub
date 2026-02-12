import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { agencyActivationTemplate } from "../_shared/email-templates.ts";
import {
  corsHeaders,
  initNotificationContext,
  validateResendKey,
  sendAndLog,
  errorResponse,
  successResponse,
  notFoundResponse,
} from "../_shared/notification-utils.ts";

interface AgencyActivationRequest {
  agency_id: string;
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

    const { agency_id, test_mode = false }: AgencyActivationRequest = await req.json();

    // Buscar dados da agência
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, nome_fantasia, razao_social, responsavel_nome, responsavel_email')
      .eq('id', agency_id)
      .single();

    if (agencyError || !agency) {
      return notFoundResponse('Agência não encontrada');
    }

    const recipientEmail = agency.responsavel_email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agência não possui e-mail do responsável cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, html } = agencyActivationTemplate({
      responsibleName: agency.responsavel_nome || 'Responsável',
      agencyName: agency.nome_fantasia || agency.razao_social,
      loginUrl: 'https://tridots-core-hub.lovable.app/auth'
    });

    const result = await sendAndLog(supabase, {
      resendApiKey: resendApiKey!,
      recipientEmail,
      subject,
      html,
      templateType: 'agency_activation',
      referenceId: agency_id,
      recipientName: agency.responsavel_nome || agency.nome_fantasia || agency.razao_social,
      testMode: test_mode,
      testEmail,
      metadata: { agency_id, test_mode },
    });

    return successResponse({
      success: result.success,
      message_id: result.messageId,
      error: result.error,
    });

  } catch (error) {
    return errorResponse(error, 'send-agency-activation');
  }
});
