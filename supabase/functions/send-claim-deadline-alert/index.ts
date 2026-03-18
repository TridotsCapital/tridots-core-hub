import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  initNotificationContext,
  validateResendKey,
  sendAndLog,
  errorResponse,
  successResponse,
  corsHeaders,
} from "../_shared/notification-utils.ts";
import { claimDeadlineAlertTemplate } from "../_shared/email-templates.ts";

interface DeadlineAlertRequest {
  claim_id: string;
  days_elapsed: number;
  days_remaining: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, resendApiKey, testEmail } = initNotificationContext();
    const resendError = validateResendKey(resendApiKey);
    if (resendError) return resendError;

    const body: DeadlineAlertRequest = await req.json();
    const { claim_id, days_elapsed, days_remaining } = body;

    console.log(`Processing claim deadline alert: claim ${claim_id}, ${days_elapsed} days elapsed, ${days_remaining} remaining`);

    // Fetch claim with contract, analysis and agency data
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("id, agency_id, contract_id, total_claimed_value, created_at")
      .eq("id", claim_id)
      .single();

    if (claimError || !claim) {
      console.error("Claim not found:", claimError);
      return new Response(
        JSON.stringify({ success: false, error: "Claim not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant name from contract -> analysis
    let tenantName = "Inquilino";
    const { data: contract } = await supabase
      .from("contracts")
      .select("analysis_id")
      .eq("id", claim.contract_id)
      .single();

    if (contract?.analysis_id) {
      const { data: analysis } = await supabase
        .from("analyses")
        .select("inquilino_nome")
        .eq("id", contract.analysis_id)
        .single();
      if (analysis?.inquilino_nome) {
        tenantName = analysis.inquilino_nome;
      }
    }

    // Get agency name
    const { data: agency } = await supabase
      .from("agencies")
      .select("nome_fantasia, razao_social")
      .eq("id", claim.agency_id)
      .single();

    const agencyName = agency?.nome_fantasia || agency?.razao_social || "Imobiliária";

    // Get all active masters and analysts
    const { data: roleEntries } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["master", "analyst"]);

    const userIds = roleEntries?.map((r) => r.user_id) || [];

    const { data: recipients } = userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)
          .eq("active", true)
      : { data: [] };

    if (!recipients || recipients.length === 0) {
      console.log("No active masters/analysts to notify");
      return successResponse({ success: true, message: "No recipients" });
    }

    // Generate email template
    const template = claimDeadlineAlertTemplate({
      tenantName,
      agencyName,
      claimId: claim.id,
      totalClaimedValue: claim.total_claimed_value || 0,
      daysElapsed: days_elapsed,
      daysRemaining: days_remaining,
      claimCreatedAt: claim.created_at,
    });

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      if (!recipient.email) continue;

      const result = await sendAndLog(supabase, {
        resendApiKey: resendApiKey!,
        recipientEmail: recipient.email,
        subject: template.subject,
        html: template.html,
        templateType: "claim_deadline_alert",
        referenceId: claim.id,
        recipientName: recipient.full_name || recipient.email,
        testMode: true,
        testEmail,
        metadata: {
          claim_id,
          days_elapsed,
          days_remaining,
          tenant_name: tenantName,
          agency_name: agencyName,
        },
      });

      results.push({ email: recipient.email, success: result.success, error: result.error });
    }

    console.log("Claim deadline alert results:", results);
    return successResponse({ success: true, results });
  } catch (error) {
    return errorResponse(error, "send-claim-deadline-alert");
  }
});
