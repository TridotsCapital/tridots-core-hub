import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { weeklyCommissionReportTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReportRequest {
  test_mode?: boolean;
  agency_id?: string; // Se informado, envia apenas para essa agência (para testes)
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
    
    let requestBody: WeeklyReportRequest = { test_mode: false };
    try {
      requestBody = await req.json();
    } catch {
      // Sem body = executar para todas as agências
    }
    
    const { test_mode = false, agency_id } = requestBody;

    // Calcular período da semana (segunda a domingo anterior)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToLastSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - daysToLastSunday);
    lastSunday.setHours(23, 59, 59, 999);
    
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);
    lastMonday.setHours(0, 0, 0, 0);

    // Buscar comissões pagas na semana que ainda não foram incluídas em relatório
    let query = supabase
      .from('commissions')
      .select(`
        id,
        type,
        valor,
        data_pagamento,
        agency_id,
        analysis:analyses(
          inquilino_nome,
          imovel_endereco,
          imovel_cidade
        ),
        agency:agencies(
          id,
          nome_fantasia,
          razao_social,
          responsavel_email
        )
      `)
      .eq('status', 'paga')
      .is('report_sent_at', null)
      .gte('data_pagamento', lastMonday.toISOString())
      .lte('data_pagamento', lastSunday.toISOString());

    if (agency_id) {
      query = query.eq('agency_id', agency_id);
    }

    const { data: commissions, error: commissionsError } = await query;

    if (commissionsError) {
      console.error('Erro ao buscar comissões:', commissionsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar comissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!commissions || commissions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma comissão paga encontrada no período',
          period: {
            start: lastMonday.toISOString(),
            end: lastSunday.toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Agrupar comissões por agência
    const commissionsByAgency: Record<string, typeof commissions> = {};
    for (const commission of commissions) {
      const agencyData = commission.agency as unknown as { id: string } | null;
      if (!agencyData?.id) continue;
      
      if (!commissionsByAgency[agencyData.id]) {
        commissionsByAgency[agencyData.id] = [];
      }
      commissionsByAgency[agencyData.id].push(commission);
    }

    const results: Array<{ 
      agency_id: string; 
      agency_name: string;
      commissions_count: number;
      total_value: number;
      success: boolean; 
      error?: string 
    }> = [];

    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatDate = (dateStr: string) => 
      new Date(dateStr).toLocaleDateString('pt-BR');

    // Enviar relatório para cada agência
    for (const [agencyId, agencyCommissions] of Object.entries(commissionsByAgency)) {
      const firstCommission = agencyCommissions[0];
      const agencyData = firstCommission.agency as {
        nome_fantasia?: string;
        razao_social?: string;
        responsavel_email?: string;
      };

      const agencyName = agencyData?.nome_fantasia || agencyData?.razao_social || 'Imobiliária';
      const recipientEmail = agencyData?.responsavel_email;

      if (!recipientEmail) {
        results.push({
          agency_id: agencyId,
          agency_name: agencyName,
          commissions_count: agencyCommissions.length,
          total_value: agencyCommissions.reduce((sum, c) => sum + Number(c.valor), 0),
          success: false,
          error: 'Sem e-mail do responsável'
        });
        continue;
      }

      // Preparar dados das comissões
      const commissionsData = agencyCommissions.map(c => {
        const analysisData = c.analysis as {
          inquilino_nome?: string;
          imovel_endereco?: string;
          imovel_cidade?: string;
        } | null;

        return {
          tenantName: analysisData?.inquilino_nome || 'N/A',
          propertyAddress: [analysisData?.imovel_endereco, analysisData?.imovel_cidade]
            .filter(Boolean).join(' - '),
          value: formatCurrency(Number(c.valor)),
          paidAt: c.data_pagamento ? formatDate(c.data_pagamento) : 'N/A',
          type: c.type === 'setup' ? 'Setup' : 'Recorrente'
        };
      });

      const totalValue = agencyCommissions.reduce((sum, c) => sum + Number(c.valor), 0);

      // Gerar e-mail
      const { subject, html } = weeklyCommissionReportTemplate({
        agencyName,
        weekStart: formatDate(lastMonday.toISOString()),
        weekEnd: formatDate(lastSunday.toISOString()),
        commissions: commissionsData,
        totalValue: formatCurrency(totalValue)
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
        template_type: 'commission_report',
        subject,
        status: result.success ? 'sent' : 'failed',
        metadata: { 
          agency_id: agencyId, 
          test_mode,
          commissions_count: agencyCommissions.length,
          total_value: totalValue,
          period: {
            start: lastMonday.toISOString(),
            end: lastSunday.toISOString()
          }
        },
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : null
      });

      // Marcar comissões como enviadas (apenas se não for teste)
      if (result.success && !test_mode) {
        const commissionIds = agencyCommissions.map(c => c.id);
        await supabase
          .from('commissions')
          .update({ report_sent_at: new Date().toISOString() })
          .in('id', commissionIds);
      }

      results.push({
        agency_id: agencyId,
        agency_name: agencyName,
        commissions_count: agencyCommissions.length,
        total_value: totalValue,
        success: result.success,
        error: result.error
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        period: {
          start: lastMonday.toISOString(),
          end: lastSunday.toISOString()
        },
        total_agencies: results.length,
        successful: successCount,
        failed: failCount,
        total_commissions: commissions.length,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao enviar relatório semanal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
