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
        const siteUrl = Deno.env.get("SITE_URL") || "https://tridots-core-hub.lovable.app";
        acceptanceUrl = `${siteUrl}/aceite-renovacao/${renewal.acceptance_token}`;
      }
    }

    // Replace placeholder in message if there's an acceptance URL
    const finalMessage = acceptanceUrl 
      ? message.replace('[Link será enviado automaticamente]', acceptanceUrl)
      : message;

    // Send email if applicable
    if ((channel === 'email' || channel === 'both') && recipientEmail) {
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email');
      } else {
        const resend = new Resend(resendApiKey);
        
        const analysis = contract.analysis as any;
        const propertyAddress = analysis ? `${analysis.imovel_endereco || ''}, ${analysis.imovel_cidade || ''} - ${analysis.imovel_estado || ''}` : 'Endereço não disponível';
        
        const emailResponse = await resend.emails.send({
          from: "Tridots <notificacoes@tridots.com.br>",
          to: [recipientEmail],
          subject: "Renovação de Contrato - Ação Necessária",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                pre { white-space: pre-wrap; font-family: inherit; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Renovação de Contrato</h1>
                </div>
                <div class="content">
                  <pre>${finalMessage}</pre>
                  ${acceptanceUrl ? `
                    <p style="text-align: center;">
                      <a href="${acceptanceUrl}" class="button">Aceitar Renovação</a>
                    </p>
                  ` : ''}
                </div>
                <div class="footer">
                  <p>Tridots - Garantia Locatícia</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
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

serve(handler);
