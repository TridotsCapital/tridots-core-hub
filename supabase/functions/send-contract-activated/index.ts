import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  contractActivatedTenantTemplate, 
  contractActivatedAgencyTemplate, 
  sendEmail 
} from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractActivatedRequest {
  contract_id: string;
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
    const { contract_id, test_mode = false }: ContractActivatedRequest = await req.json();

    // Buscar dados do contrato com análise e agência
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id,
        data_fim_contrato,
        analysis:analyses(
          inquilino_nome,
          inquilino_email,
          valor_aluguel,
          imovel_endereco,
          imovel_numero,
          imovel_bairro,
          imovel_cidade
        ),
        agency:agencies(
          nome_fantasia,
          razao_social,
          telefone
        )
      `)
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contrato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = contract.analysis as unknown as {
      inquilino_nome: string;
      inquilino_email?: string;
      valor_aluguel: number;
      imovel_endereco: string;
      imovel_numero?: string;
      imovel_bairro?: string;
      imovel_cidade: string;
    };
    
    const agency = contract.agency as unknown as {
      id?: string;
      nome_fantasia?: string;
      razao_social?: string;
      telefone?: string;
    };

    // Montar endereço
    const addressParts = [
      analysis.imovel_endereco,
      analysis.imovel_numero,
      analysis.imovel_bairro,
      analysis.imovel_cidade
    ].filter(Boolean);
    const propertyAddress = addressParts.join(', ');

    // Nome e telefone da agência
    const agencyName = agency?.nome_fantasia || agency?.razao_social || 'Imobiliária';
    const agencyPhone = agency?.telefone;

    // Formatar data de fim do contrato
    const contractEndDate = contract.data_fim_contrato 
      ? new Date(contract.data_fim_contrato).toLocaleDateString('pt-BR')
      : 'A definir';

    // Formatar valor do aluguel
    const rentValue = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(analysis.valor_aluguel);

    const results: Array<{ type: string; success: boolean; error?: string }> = [];

    // 1. E-mail para o inquilino (se tiver e-mail)
    if (analysis.inquilino_email) {
      const tenantTemplate = contractActivatedTenantTemplate({
        tenantName: analysis.inquilino_nome,
        propertyAddress,
        agencyName,
        agencyPhone,
        contractEndDate
      });

      const tenantResult = await sendEmail(
        resendApiKey,
        analysis.inquilino_email,
        tenantTemplate.subject,
        tenantTemplate.html,
        test_mode,
        testEmail
      );

      await supabase.from('email_logs').insert({
        recipient_email: test_mode ? testEmail : analysis.inquilino_email,
        recipient_original: test_mode ? analysis.inquilino_email : null,
        template_type: 'contract_activated_tenant',
        subject: tenantTemplate.subject,
        status: tenantResult.success ? 'sent' : 'failed',
        metadata: { contract_id, test_mode, recipient_type: 'tenant' },
        error_message: tenantResult.error,
        sent_at: tenantResult.success ? new Date().toISOString() : null
      });

      results.push({ type: 'tenant', success: tenantResult.success, error: tenantResult.error });
    }

    // 2. E-mail para todos os colaboradores da imobiliária
    const { data: agencyUsers } = await supabase
      .from('agency_users')
      .select('user_id')
      .eq('agency_id', agency?.id || '');

    if (agencyUsers && agencyUsers.length > 0) {
      const userIds = agencyUsers.map(u => u.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
        .eq('active', true);

      if (profiles) {
        const agencyTemplate = contractActivatedAgencyTemplate({
          tenantName: analysis.inquilino_nome,
          propertyAddress,
          rentValue,
          contractEndDate
        });

        for (const profile of profiles) {
          const agencyResult = await sendEmail(
            resendApiKey,
            profile.email,
            agencyTemplate.subject,
            agencyTemplate.html,
            test_mode,
            testEmail
          );

          await supabase.from('email_logs').insert({
            recipient_email: test_mode ? testEmail : profile.email,
            recipient_original: test_mode ? profile.email : null,
            template_type: 'contract_activated_agency',
            subject: agencyTemplate.subject,
            status: agencyResult.success ? 'sent' : 'failed',
            metadata: { contract_id, test_mode, recipient_type: 'agency_user', user_id: profile.id },
            error_message: agencyResult.error,
            sent_at: agencyResult.success ? new Date().toISOString() : null
          });

          results.push({ 
            type: `agency_user_${profile.id}`, 
            success: agencyResult.success, 
            error: agencyResult.error 
          });
        }
      }
    }

    const allSuccessful = results.every(r => r.success);
    const anySuccessful = results.some(r => r.success);

    return new Response(
      JSON.stringify({
        success: anySuccessful,
        total_emails: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao enviar e-mail de contrato ativado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
