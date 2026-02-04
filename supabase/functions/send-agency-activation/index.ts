import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { agencyActivationTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgencyActivationRequest {
  agency_id: string;
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
    const { agency_id, test_mode = false }: AgencyActivationRequest = await req.json();

    // Buscar dados da agência
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, nome_fantasia, razao_social, responsavel_nome, responsavel_email')
      .eq('id', agency_id)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agência não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipientEmail = agency.responsavel_email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agência não possui e-mail do responsável cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar e-mail
    const { subject, html } = agencyActivationTemplate({
      responsibleName: agency.responsavel_nome || 'Responsável',
      agencyName: agency.nome_fantasia || agency.razao_social,
      loginUrl: 'https://tridots-core-hub.lovable.app/auth'
    });

    // Enviar e-mail
    const result = await sendEmail(
      resendApiKey,
      recipientEmail,
      subject,
      html,
      test_mode,
      testEmail
    );

    // Registrar no log
    await supabase.from('email_logs').insert({
      recipient_email: test_mode ? testEmail : recipientEmail,
      recipient_original: test_mode ? recipientEmail : null,
      template_type: 'agency_activation',
      subject,
      status: result.success ? 'sent' : 'failed',
      metadata: { agency_id, test_mode },
      error_message: result.error,
      sent_at: result.success ? new Date().toISOString() : null
    });

    // Criar notificação in-app para usuários Tridots
    await supabase.rpc('create_email_sent_notification', {
      p_template_type: 'agency_activation',
      p_recipient_email: recipientEmail,
      p_recipient_name: agency.responsavel_nome || agency.nome_fantasia || agency.razao_social,
      p_reference_id: agency_id,
      p_success: result.success
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
    console.error('Erro ao enviar e-mail de ativação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
