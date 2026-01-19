import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { newAgencyPendingTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewAgencyNotificationRequest {
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
    const tridotsEmail = Deno.env.get('TRIDOTS_NOTIFICATIONS_EMAIL');
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tridotsEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'TRIDOTS_NOTIFICATIONS_EMAIL não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { agency_id, test_mode = false }: NewAgencyNotificationRequest = await req.json();

    // Buscar dados da agência
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, nome_fantasia, razao_social, cnpj, responsavel_nome, responsavel_email, cidade, estado')
      .eq('id', agency_id)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agência não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar e-mail
    const { subject, html } = newAgencyPendingTemplate({
      agencyName: agency.nome_fantasia || agency.razao_social,
      cnpj: agency.cnpj,
      responsibleName: agency.responsavel_nome || 'Não informado',
      responsibleEmail: agency.responsavel_email || 'Não informado',
      city: agency.cidade || undefined,
      state: agency.estado || undefined
    });

    // Enviar e-mail para lista de distribuição Tridots
    const result = await sendEmail(
      resendApiKey,
      tridotsEmail,
      subject,
      html,
      test_mode,
      tridotsEmail // Em modo teste também vai para o mesmo e-mail
    );

    // Registrar no log
    await supabase.from('email_logs').insert({
      recipient_email: tridotsEmail,
      recipient_original: null,
      template_type: 'new_agency_pending',
      subject,
      status: result.success ? 'sent' : 'failed',
      metadata: { agency_id, test_mode },
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
    console.error('Erro ao enviar notificação de nova agência:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
