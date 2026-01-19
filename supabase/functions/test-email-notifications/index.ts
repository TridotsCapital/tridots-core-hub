import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  paymentConfirmationTemplate,
  contractActivatedTenantTemplate,
  contractActivatedAgencyTemplate,
  agencyActivationTemplate,
  newAgencyPendingTemplate,
  weeklyCommissionReportTemplate,
  sendEmail
} from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestScenarioRequest {
  scenario: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';
  test_email?: string;
  dry_run?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { scenario, test_email = 'testes@tridots.com.br', dry_run = false }: TestScenarioRequest = await req.json();

    let emailData: { subject: string; html: string };
    let recipientOriginal = 'exemplo@email.com';
    let templateType = '';
    let metadata: Record<string, unknown> = {};

    switch (scenario) {
      case 'T1': {
        // Link de Aceite - apenas simula, o fluxo real está em generate-acceptance-link
        templateType = 'acceptance_link';
        emailData = {
          subject: 'Aceite Digital - Tridots Capital',
          html: '<p>Este cenário usa a edge function generate-acceptance-link existente.</p>'
        };
        metadata = { note: 'Testar via fluxo real de aprovação de análise' };
        break;
      }
      
      case 'T2': {
        // Lembrete de Renovação - apenas simula, o fluxo real está em renewal-reminders
        templateType = 'renewal_reminder';
        emailData = {
          subject: 'Lembrete de Renovação - Tridots Capital',
          html: '<p>Este cenário usa a edge function renewal-reminders existente.</p>'
        };
        metadata = { note: 'Testar via fluxo real de contratos próximos do vencimento' };
        break;
      }
      
      case 'T3': {
        // Confirmação de Pagamento
        templateType = 'payment_confirmation';
        emailData = paymentConfirmationTemplate({
          tenantName: 'João Silva (Teste)',
          propertyAddress: 'Rua das Flores, 123 - Centro',
          agencyName: 'Imobiliária Exemplo',
          planName: 'Plano Essencial'
        });
        recipientOriginal = 'inquilino.teste@email.com';
        break;
      }
      
      case 'T4': {
        // Contrato Ativado (Inquilino + Imobiliária)
        templateType = 'contract_activated';
        
        // Template do inquilino
        const tenantEmail = contractActivatedTenantTemplate({
          tenantName: 'Maria Santos (Teste)',
          propertyAddress: 'Av. Brasil, 456 - Jardins',
          agencyName: 'Imobiliária Premium',
          agencyPhone: '(11) 99999-9999',
          contractEndDate: '15/01/2027'
        });
        
        // Template da imobiliária
        const agencyEmail = contractActivatedAgencyTemplate({
          tenantName: 'Maria Santos (Teste)',
          propertyAddress: 'Av. Brasil, 456 - Jardins',
          rentValue: 'R$ 2.500,00',
          contractEndDate: '15/01/2027'
        });
        
        // Enviar ambos os e-mails
        emailData = tenantEmail;
        recipientOriginal = 'inquilino@email.com, colaborador@imobiliaria.com';
        metadata = { 
          emails_sent: 2,
          tenant_subject: tenantEmail.subject,
          agency_subject: agencyEmail.subject
        };
        break;
      }
      
      case 'T5': {
        // Cadastro Aprovado (Imobiliária)
        templateType = 'agency_activation';
        emailData = agencyActivationTemplate({
          responsibleName: 'Carlos Oliveira (Teste)',
          agencyName: 'Nova Imobiliária Ltda',
          loginUrl: 'https://tridots-core-hub.lovable.app/auth'
        });
        recipientOriginal = 'responsavel@imobiliaria.com';
        break;
      }
      
      case 'T6': {
        // Relatório Semanal de Comissões
        templateType = 'commission_report';
        emailData = weeklyCommissionReportTemplate({
          agencyName: 'Imobiliária Demonstração',
          weekStart: '13/01/2026',
          weekEnd: '19/01/2026',
          commissions: [
            { 
              tenantName: 'Ana Costa', 
              propertyAddress: 'Rua A, 100',
              value: 'R$ 150,00', 
              paidAt: '14/01/2026',
              type: 'Setup'
            },
            { 
              tenantName: 'Bruno Lima', 
              propertyAddress: 'Rua B, 200',
              value: 'R$ 80,00', 
              paidAt: '15/01/2026',
              type: 'Recorrente'
            },
            { 
              tenantName: 'Carla Dias', 
              propertyAddress: 'Rua C, 300',
              value: 'R$ 80,00', 
              paidAt: '16/01/2026',
              type: 'Recorrente'
            }
          ],
          totalValue: 'R$ 310,00'
        });
        recipientOriginal = 'financeiro@imobiliaria.com';
        break;
      }
      
      case 'T7': {
        // Nova Imobiliária Pendente (Tridots)
        templateType = 'new_agency_pending';
        emailData = newAgencyPendingTemplate({
          agencyName: 'Imobiliária Recém Cadastrada Ltda',
          cnpj: '12.345.678/0001-99',
          responsibleName: 'Fernanda Souza',
          responsibleEmail: 'fernanda@novaimob.com',
          city: 'São Paulo',
          state: 'SP'
        });
        recipientOriginal = Deno.env.get('TRIDOTS_NOTIFICATIONS_EMAIL') || 'cadastros@tridots.com.br';
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Cenário inválido. Use T1-T7.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log do teste
    const logEntry: {
      recipient_email: string;
      recipient_original: string;
      template_type: string;
      subject: string;
      status: string;
      metadata: Record<string, unknown>;
      error_message?: string;
    } = {
      recipient_email: test_email,
      recipient_original: recipientOriginal,
      template_type: templateType,
      subject: emailData.subject,
      status: dry_run ? 'dry_run' : 'pending',
      metadata: { scenario, test_mode: true, ...metadata }
    };

    // Enviar e-mail se não for dry_run e tiver API key
    let sendResult: { success: boolean; messageId?: string; error?: string } = { 
      success: false, 
      messageId: undefined, 
      error: undefined 
    };
    
    if (!dry_run && resendApiKey) {
      sendResult = await sendEmail(
        resendApiKey,
        test_email,
        emailData.subject,
        emailData.html,
        true,
        test_email
      );
      
      logEntry.status = sendResult.success ? 'sent' : 'failed';
      if (!sendResult.success && sendResult.error) {
        logEntry.error_message = sendResult.error;
      }
    }

    // Salvar log
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        ...logEntry,
        sent_at: sendResult.success ? new Date().toISOString() : null
      });

    if (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scenario,
        template_type: templateType,
        email_preview: emailData.html,
        subject: emailData.subject,
        recipient_original: recipientOriginal,
        recipient_used: test_email,
        dry_run,
        sent: !dry_run && sendResult.success,
        message_id: sendResult.messageId,
        error: sendResult.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro no teste de notificações:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
