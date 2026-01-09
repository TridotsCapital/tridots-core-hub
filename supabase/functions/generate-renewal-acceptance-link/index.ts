import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRenewalLinkRequest {
  renewalId: string;
  contractId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { renewalId, contractId }: GenerateRenewalLinkRequest = await req.json();

    if (!renewalId || !contractId) {
      throw new Error("renewalId and contractId are required");
    }

    console.log("Generating renewal acceptance link:", { renewalId, contractId });

    // Verify renewal exists and is approved
    const { data: renewal, error: renewalError } = await supabase
      .from('contract_renewals')
      .select('*, contract:contracts!contract_renewals_contract_id_fkey(*, analysis:analyses!contracts_analysis_id_fkey(*))')
      .eq('id', renewalId)
      .single();

    if (renewalError || !renewal) {
      throw new Error("Renovação não encontrada");
    }

    if (renewal.status !== 'approved') {
      throw new Error("Renovação ainda não foi aprovada");
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours expiration

    // Update renewal with token
    const { error: updateError } = await supabase
      .from('contract_renewals')
      .update({
        acceptance_token: token,
        acceptance_token_expires_at: expiresAt.toISOString(),
        acceptance_token_used_at: null,
      })
      .eq('id', renewalId);

    if (updateError) {
      console.error("Error updating renewal:", updateError);
      throw updateError;
    }

    // Build acceptance URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://hsyjtujcedwafcviourl.lovable.app";
    const acceptanceUrl = `${baseUrl}/aceite-renovacao/${token}`;

    console.log("Generated renewal acceptance link:", {
      renewalId,
      token,
      expiresAt: expiresAt.toISOString(),
      url: acceptanceUrl,
    });

    // Send email notification to tenant if email is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const tenantEmail = (renewal.contract as any)?.analysis?.inquilino_email;
    const tenantName = (renewal.contract as any)?.analysis?.inquilino_nome;

    if (resendApiKey && tenantEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Tridots <noreply@tridots.com.br>",
            to: [tenantEmail],
            subject: "Renovação de Contrato - Aceite Necessário",
            html: `
              <h2>Olá, ${tenantName || 'Inquilino'}!</h2>
              <p>Sua solicitação de renovação de contrato foi <strong>aprovada</strong>!</p>
              <p>Para concluir o processo, você precisa acessar o link abaixo e aceitar os novos termos:</p>
              <p style="margin: 20px 0;">
                <a href="${acceptanceUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Aceitar Renovação
                </a>
              </p>
              <p><strong>Atenção:</strong> Este link é válido por 72 horas.</p>
              <br>
              <p>Atenciosamente,<br>Equipe Tridots</p>
            `,
          }),
        });
        console.log("Email sent to tenant:", tenantEmail);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        url: acceptanceUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error generating renewal acceptance link:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
