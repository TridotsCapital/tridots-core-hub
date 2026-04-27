import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  contractId: string;
  renewalId?: string;
  channel: 'email' | 'whatsapp' | 'both';
  recipientEmail?: string;
  recipientName: string;
  message: string;
}

// Logo GarantFácil em base64 (PNG transparente branco)
const LOGO_BASE64 = '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';

const TRIDOTS_BLUE = '#1a1a2e';
const TRIDOTS_ACCENT = '#4A90A4';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { contractId, renewalId, channel, recipientEmail, recipientName, message }: RequestBody = await req.json();

    console.log(`[send-renewal-notification] Processing notification for contract: ${contractId}, channel: ${channel}`);

    // Fetch contract and renewal data for context
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id,
        data_fim_contrato,
        analysis:analyses(
          inquilino_nome,
          inquilino_email,
          imovel_endereco,
          imovel_cidade,
          imovel_estado
        ),
        agency:agencies(
          nome_fantasia,
          razao_social
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError) {
      console.error('Error fetching contract:', contractError);
      throw new Error('Contract not found');
    }

    // Get acceptance URL if there's a renewal with token
    let acceptanceUrl = '';
    if (renewalId) {
      const { data: renewal } = await supabase
        .from('contract_renewals')
        .select('acceptance_token')
        .eq('id', renewalId)
        .single();
      
      if (renewal?.acceptance_token) {
        acceptanceUrl = `https://aceite.tridotscapital.com/aceite-renovacao/${renewal.acceptance_token}`;
      }
    }

    // Replace placeholder in message if there's an acceptance URL
    const finalMessage = acceptanceUrl 
      ? message.replace('[Link será enviado automaticamente]', acceptanceUrl)
      : message;

    // Send email if applicable
    let emailSuccess = false;
    if ((channel === 'email' || channel === 'both') && recipientEmail) {
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email');
      } else {
        const resend = new Resend(resendApiKey);
        
        const analysis = contract.analysis as any;
        const agency = contract.agency as any;
        const propertyAddress = analysis 
          ? `${analysis.imovel_endereco || ''}, ${analysis.imovel_cidade || ''} - ${analysis.imovel_estado || ''}` 
          : 'Endereço não disponível';
        const agencyName = agency?.nome_fantasia || agency?.razao_social || 'Imobiliária';
        
        // Generate styled email HTML
        const emailHtml = generateRenewalEmailHtml({
          recipientName,
          propertyAddress,
          agencyName,
          message: finalMessage,
          acceptanceUrl,
          contractEndDate: contract.data_fim_contrato
        });
        
        try {
          const emailResponse = await resend.emails.send({
            from: "GarantFácil <naoresponder@tridotscapital.com>",
            to: [recipientEmail],
            subject: `${recipientName}, renovação de contrato - ação necessária - GarantFácil`,
            html: emailHtml,
            attachments: [{
              filename: 'tridots-logo.png',
              content: LOGO_BASE64,
            }]
          });

          console.log("Email sent successfully:", emailResponse);
          emailSuccess = true;

          // Criar notificação in-app para usuários GarantFácil
          await supabase.rpc('create_email_sent_notification', {
            p_template_type: 'renewal_notification',
            p_recipient_email: recipientEmail,
            p_recipient_name: recipientName,
            p_reference_id: contractId,
            p_success: true
          });
        } catch (emailError) {
          console.error("Email send failed:", emailError);
          
          // Criar notificação de falha
          await supabase.rpc('create_email_sent_notification', {
            p_template_type: 'renewal_notification',
            p_recipient_email: recipientEmail,
            p_recipient_name: recipientName,
            p_reference_id: contractId,
            p_success: false
          });
          
          throw emailError;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        acceptanceUrl: acceptanceUrl || null
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-renewal-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateRenewalEmailHtml(data: {
  recipientName: string;
  propertyAddress: string;
  agencyName: string;
  message: string;
  acceptanceUrl: string;
  contractEndDate: string | null;
}): string {
  const formattedEndDate = data.contractEndDate 
    ? new Date(data.contractEndDate).toLocaleDateString('pt-BR')
    : 'Data não disponível';

  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Renovação de Contrato 📋
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.recipientName}</strong>!
    </p>
    
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
      <pre style="margin:0;font-family:inherit;white-space:pre-wrap;font-size:15px;color:#374151;line-height:1.6;">${data.message}</pre>
    </div>

    ${data.acceptanceUrl ? `
    <div style="text-align:center;margin:30px 0;">
      <a href="${data.acceptanceUrl}" style="display:inline-block;background-color:${TRIDOTS_ACCENT};color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Aceitar Renovação
      </a>
    </div>
    ` : ''}

    <div style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#1e40af;">Detalhes do Contrato</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imobiliária:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vencimento Atual:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${formattedEndDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Em caso de dúvidas, entre em contato com sua imobiliária <strong>${data.agencyName}</strong>.
    </p>
  `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GarantFácil - Renovação de Contrato</title>
  <span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Seu contrato de garantia precisa ser renovado</span>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${TRIDOTS_BLUE};padding:30px 40px;text-align:center;">
              <img src="cid:tridots-logo" alt="GarantFácil" style="height:40px;width:auto;max-width:200px;" />
            </td>
          </tr>
          <!-- Hero Image -->
          <tr>
            <td style="padding:0;">
              <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=180&fit=crop&crop=center" alt="GarantFácil" style="width:100%;max-width:600px;height:180px;object-fit:cover;object-position:center;display:block;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:30px 40px;border-top:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align:center;color:#6b7280;font-size:13px;line-height:1.6;">
                    <p style="margin:0 0 10px 0;">
                      <strong>GarantFácil</strong><br>
                      A garantia locatícia mais segura e completa do Brasil
                    </p>
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      Este é um e-mail automático, não responda diretamente.<br>
                      Em caso de dúvidas, entre em contato com sua imobiliária.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(handler);
