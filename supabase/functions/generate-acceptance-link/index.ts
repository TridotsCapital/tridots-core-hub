import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { acceptanceDigitalTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateLinkRequest {
  analysisId: string;
  setupPaymentLink?: string | null;
  guaranteePaymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { analysisId, setupPaymentLink, guaranteePaymentLink }: GenerateLinkRequest = await req.json();

    if (!analysisId) {
      throw new Error("analysisId is required");
    }

    console.log("Generating acceptance link:", { analysisId, hasSetupLink: !!setupPaymentLink, hasGuaranteeLink: !!guaranteePaymentLink });

    // Verify analysis exists and is in correct status
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*, agency:agencies(*)")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Análise não encontrada");
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiration

    // Update analysis with token and payment links
    // Reset ALL step-by-step fields so tenant must repeat entire flow
    const updateData: Record<string, unknown> = {
      acceptance_token: token,
      acceptance_token_expires_at: expiresAt.toISOString(),
      acceptance_token_used_at: null,
      // Reset Step 1 - Identity Photo
      identity_photo_path: null,
      // Reset Step 2 - Terms Acceptance
      terms_accepted_at: null,
      // Reset Step 2 - Payer Data
      payer_is_tenant: null,
      payer_name: null,
      payer_cpf: null,
      payer_email: null,
      payer_phone: null,
      payer_cep: null,
      payer_address: null,
      payer_number: null,
      payer_complement: null,
      payer_neighborhood: null,
      payer_city: null,
      payer_state: null,
      // Reset Steps 3 & 4 - Payment confirmations
      setup_payment_confirmed_at: null,
      setup_payment_receipt_path: null,
      setup_payment_date: null,
      guarantee_payment_confirmed_at: null,
      guarantee_payment_receipt_path: null,
      guarantee_payment_date: null,
      // Reset validation status
      payments_validated_at: null,
      payments_validated_by: null,
      payments_rejected_at: null,
      payments_rejection_reason: null,
    };

    // Add payment links if provided
    if (setupPaymentLink !== undefined) {
      updateData.setup_payment_link = setupPaymentLink;
    }
    if (guaranteePaymentLink !== undefined) {
      updateData.guarantee_payment_link = guaranteePaymentLink;
    }

    const { error: updateError } = await supabase
      .from("analyses")
      .update(updateData)
      .eq("id", analysisId);

    if (updateError) {
      console.error("Error updating analysis:", updateError);
      throw updateError;
    }

    // Log timeline event
    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysisId,
      _event_type: "acceptance_link_generated",
      _description: "Link de aceite gerado com validade de 48 horas",
      _metadata: { 
        expires_at: expiresAt.toISOString(),
        has_setup_link: !!setupPaymentLink,
        has_guarantee_link: !!guaranteePaymentLink,
      },
    });

    // Notify all agency collaborators about the new link
    const { data: agencyUsers } = await supabase
      .from('agency_users')
      .select('user_id')
      .eq('agency_id', analysis.agency_id);

    if (agencyUsers && agencyUsers.length > 0) {
      const notifications = agencyUsers.map((au: { user_id: string }) => ({
        user_id: au.user_id,
        type: 'acceptance_link_generated',
        source: 'analises',
        reference_id: analysisId,
        title: 'Novo link de aceite gerado',
        message: `O link de aceite para ${analysis.inquilino_nome} foi atualizado. Válido por 48 horas.`,
        metadata: {
          tenant_name: analysis.inquilino_nome,
          expires_at: expiresAt.toISOString(),
        },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    // Build acceptance URL - usar subdomínio oficial de aceite
    const baseUrl = Deno.env.get("ACCEPTANCE_BASE_URL") || "https://aceite.tridotscapital.com";
    const acceptanceUrl = `${baseUrl}/aceite/${token}`;

    console.log("Generated acceptance link:", {
      analysisId,
      token,
      expiresAt: expiresAt.toISOString(),
      url: acceptanceUrl,
    });

    // Send email to tenant if email is available and Resend is configured
    let emailSent = false;
    if (resendApiKey && analysis.inquilino_email) {
      try {
        const agencyName = analysis.agency?.nome_fantasia || analysis.agency?.razao_social || 'sua imobiliária';
        const propertyAddress = `${analysis.imovel_endereco}${analysis.imovel_numero ? `, ${analysis.imovel_numero}` : ''} - ${analysis.imovel_bairro || ''}, ${analysis.imovel_cidade}/${analysis.imovel_estado}`;
        
        const expiresAtFormatted = expiresAt.toLocaleString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const emailTemplate = acceptanceDigitalTemplate({
          tenantName: analysis.inquilino_nome,
          propertyAddress: propertyAddress,
          agencyName: agencyName,
          acceptanceUrl: acceptanceUrl,
          expiresAt: expiresAtFormatted
        });

        const emailResult = await sendEmail(
          resendApiKey,
          analysis.inquilino_email,
          emailTemplate.subject,
          emailTemplate.html,
          false
        );

        emailSent = emailResult.success;
        
        if (emailResult.success) {
          console.log(`Acceptance email sent to ${analysis.inquilino_email}`);
          
          // Log email sent event
          await supabase.rpc("log_analysis_timeline_event", {
            _analysis_id: analysisId,
            _event_type: "acceptance_email_sent",
            _description: `E-mail de aceite enviado para ${analysis.inquilino_email}`,
            _metadata: { 
              email: analysis.inquilino_email,
              message_id: emailResult.messageId
            },
          });
        } else {
          console.error(`Failed to send acceptance email:`, emailResult.error);
        }
      } catch (emailError) {
        console.error("Error sending acceptance email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        url: acceptanceUrl,
        emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating acceptance link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
