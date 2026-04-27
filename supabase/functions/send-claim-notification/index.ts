import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { claimCreatedTemplate, claimStatusChangedTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClaimNotificationRequest {
  claim_id: string;
  event_type: 'new_claim' | 'status_changed';
  old_status?: string;
  new_status?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ClaimNotificationRequest = await req.json();
    const { claim_id, event_type, old_status, new_status } = body;

    console.log(`Processing claim notification: ${event_type} for claim ${claim_id}`);

    // Fetch claim data with contract, analysis, and agency info
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, agency_id, contract_id, total_claimed_value, public_status')
      .eq('id', claim_id)
      .single();

    if (claimError || !claim) {
      console.error("Claim not found:", claimError);
      return new Response(
        JSON.stringify({ success: false, error: "Claim not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contract + analysis for tenant name
    const { data: contract } = await supabase
      .from('contracts')
      .select('analysis_id')
      .eq('id', claim.contract_id)
      .single();

    let tenantName = 'Inquilino';
    if (contract?.analysis_id) {
      const { data: analysis } = await supabase
        .from('analyses')
        .select('inquilino_nome')
        .eq('id', contract.analysis_id)
        .single();
      if (analysis?.inquilino_nome) {
        tenantName = analysis.inquilino_nome;
      }
    }

    // Fetch agency
    const { data: agency } = await supabase
      .from('agencies')
      .select('id, razao_social, nome_fantasia, responsavel_email, responsavel_nome')
      .eq('id', claim.agency_id)
      .single();

    if (!agency) {
      console.error("Agency not found for claim");
      return new Response(
        JSON.stringify({ success: false, error: "Agency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agencyName = agency.nome_fantasia || agency.razao_social;
    const results: { email: string; success: boolean; error?: string }[] = [];

    if (event_type === 'new_claim') {
      // Send to all active GarantFácil masters
      const { data: roleEntries } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'master');

      const masterIds = roleEntries?.map(r => r.user_id) || [];

      const { data: masters } = masterIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', masterIds)
            .eq('active', true)
        : { data: [] };

      if (masters && masters.length > 0) {
        const template = claimCreatedTemplate({
          agencyName,
          tenantName,
          claimId: claim.id,
          contractId: claim.contract_id,
          totalClaimedValue: claim.total_claimed_value || 0,
        });

        for (const master of masters) {
          if (!master.email) continue;

          const result = await sendEmail(
            resendApiKey,
            master.email,
            template.subject,
            template.html
          );

          results.push({ email: master.email, success: result.success, error: result.error });

          if (!result.success) {
            console.error(`Failed to send claim email to ${master.email}:`, result.error);
          }
        }
      }

      // Log to email_logs
      await supabase.from('email_logs').insert({
        recipient_email: masters?.map(m => m.email).join(', ') || 'no-masters',
        template_type: 'claim_created',
        subject: `Nova garantia solicitada - ${tenantName}`,
        status: results.every(r => r.success) ? 'sent' : 'failed',
        metadata: { claim_id, agency_name: agencyName, tenant_name: tenantName },
        sent_at: new Date().toISOString(),
      });

    } else if (event_type === 'status_changed') {
      // Send to agency primary contact
      if (agency.responsavel_email) {
        const template = claimStatusChangedTemplate({
          agencyName,
          tenantName,
          claimId: claim.id,
          oldStatus: old_status || 'desconhecido',
          newStatus: new_status || claim.public_status,
        });

        const result = await sendEmail(
          resendApiKey,
          agency.responsavel_email,
          template.subject,
          template.html
        );

        results.push({
          email: agency.responsavel_email,
          success: result.success,
          error: result.error,
        });

        if (!result.success) {
          console.error(`Failed to send claim status email to ${agency.responsavel_email}:`, result.error);
        }

        // Log to email_logs
        await supabase.from('email_logs').insert({
          recipient_email: agency.responsavel_email,
          template_type: 'claim_status_changed',
          subject: `Garantia atualizada - ${tenantName}`,
          status: result.success ? 'sent' : 'failed',
          metadata: { claim_id, old_status, new_status, agency_name: agencyName, tenant_name: tenantName },
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        });
      } else {
        console.log("No agency email found for status change notification");
      }
    }

    console.log("Claim notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-claim-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
