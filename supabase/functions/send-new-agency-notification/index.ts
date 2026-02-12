import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { newAgencyPendingTemplate } from "../_shared/email-templates.ts";
import {
  corsHeaders,
  initNotificationContext,
  validateResendKey,
  sendAndLog,
  errorResponse,
  successResponse,
  notFoundResponse,
} from "../_shared/notification-utils.ts";

interface NewAgencyNotificationRequest {
  agency_id: string;
  test_mode?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, resendApiKey } = initNotificationContext();
    const tridotsEmail = Deno.env.get('TRIDOTS_NOTIFICATIONS_EMAIL');

    const keyError = validateResendKey(resendApiKey);
    if (keyError) return keyError;

    if (!tridotsEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'TRIDOTS_NOTIFICATIONS_EMAIL não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agency_id, test_mode = false }: NewAgencyNotificationRequest = await req.json();

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, nome_fantasia, razao_social, cnpj, responsavel_nome, responsavel_email, cidade, estado')
      .eq('id', agency_id)
      .single();

    if (agencyError || !agency) {
      return notFoundResponse('Agência não encontrada');
    }

    const { subject, html } = newAgencyPendingTemplate({
      agencyName: agency.nome_fantasia || agency.razao_social,
      cnpj: agency.cnpj,
      responsibleName: agency.responsavel_nome || 'Não informado',
      responsibleEmail: agency.responsavel_email || 'Não informado',
      city: agency.cidade || undefined,
      state: agency.estado || undefined
    });

    const result = await sendAndLog(supabase, {
      resendApiKey: resendApiKey!,
      recipientEmail: tridotsEmail,
      subject,
      html,
      templateType: 'new_agency_pending',
      referenceId: agency_id,
      recipientName: agency.nome_fantasia || agency.razao_social,
      testMode: test_mode,
      testEmail: tridotsEmail,
      metadata: { agency_id, test_mode },
    });

    return successResponse({
      success: result.success,
      message_id: result.messageId,
      error: result.error,
    });

  } catch (error) {
    return errorResponse(error, 'send-new-agency-notification');
  }
});
