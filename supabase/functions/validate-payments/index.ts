import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidatePaymentsRequest {
  analysisId: string;
  action: "validate" | "reject";
  rejectionReason?: string;
  setupPaymentDate?: string;
  guaranteePaymentDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header to identify the user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { analysisId, action, rejectionReason, setupPaymentDate, guaranteePaymentDate }: ValidatePaymentsRequest = await req.json();

    if (!analysisId || !action) {
      throw new Error("Missing required fields: analysisId and action");
    }

    if (action === "validate" && !guaranteePaymentDate) {
      throw new Error("Data de pagamento da garantia é obrigatória");
    }

    console.log("Processing payment validation:", { analysisId, action, userId });

    // Fetch analysis
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*, agency:agencies(*)")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Análise não encontrada");
    }

    if (analysis.status !== "aguardando_pagamento") {
      throw new Error("Análise não está aguardando pagamento");
    }

    if (action === "validate") {
      // Validate payments - move to approved and create contract
      
      // Update analysis status with payment dates
      const updateData: Record<string, any> = {
        status: "aprovada",
        approved_at: new Date().toISOString(),
        payments_validated_at: new Date().toISOString(),
        payments_validated_by: userId,
        guarantee_payment_date: guaranteePaymentDate,
      };
      
      if (setupPaymentDate) {
        updateData.setup_payment_date = setupPaymentDate;
      }

      const { error: updateError } = await supabase
        .from("analyses")
        .update(updateData)
        .eq("id", analysisId);

      if (updateError) {
        console.error("Error updating analysis:", updateError);
        throw updateError;
      }

      // Create contract using RPC function
      const { data: contractId, error: contractError } = await supabase.rpc(
        "create_contract_from_analysis",
        { _analysis_id: analysisId }
      );

      if (contractError) {
        console.error("Error creating contract:", contractError);
        // Don't fail the whole operation, log it
      }

      // Log timeline event with payment dates
      const setupDateInfo = setupPaymentDate ? `, Setup: ${setupPaymentDate}` : '';
      await supabase.rpc("log_analysis_timeline_event", {
        _analysis_id: analysisId,
        _event_type: "payments_validated",
        _description: `Pagamentos validados - Garantia: ${guaranteePaymentDate}${setupDateInfo}`,
        _metadata: { 
          validated_by: userId,
          contract_id: contractId,
          setup_payment_date: setupPaymentDate || null,
          guarantee_payment_date: guaranteePaymentDate,
        },
        _created_by: userId,
      });

      // Notify agency users
      const { data: agencyUsers } = await supabase
        .from("agency_users")
        .select("user_id")
        .eq("agency_id", analysis.agency_id);

      if (agencyUsers && agencyUsers.length > 0) {
        for (const agencyUser of agencyUsers) {
          await supabase.from("notifications").insert({
            user_id: agencyUser.user_id,
            type: "payments_validated",
            source: "contratos",
            reference_id: contractId || analysisId,
            title: "Pagamentos validados - Contrato criado!",
            message: `O contrato de ${analysis.inquilino_nome} foi aprovado. Complete a documentação para ativar a garantia.`,
            metadata: {
              tenant_name: analysis.inquilino_nome,
              contract_id: contractId,
            },
          });
        }
      }

      console.log("Payments validated successfully:", { analysisId, contractId });

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "validated",
          contractId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "reject") {
      // Reject payments
      if (!rejectionReason) {
        throw new Error("Motivo da rejeição é obrigatório");
      }

      const { error: updateError } = await supabase
        .from("analyses")
        .update({
          payments_rejected_at: new Date().toISOString(),
          payments_rejection_reason: rejectionReason,
        })
        .eq("id", analysisId);

      if (updateError) {
        console.error("Error rejecting payments:", updateError);
        throw updateError;
      }

      // Log timeline event
      await supabase.rpc("log_analysis_timeline_event", {
        _analysis_id: analysisId,
        _event_type: "payments_rejected",
        _description: `Pagamentos rejeitados: ${rejectionReason}`,
        _metadata: { 
          rejected_by: userId,
          reason: rejectionReason,
        },
        _created_by: userId,
      });

      // Notify agency users
      const { data: agencyUsers } = await supabase
        .from("agency_users")
        .select("user_id")
        .eq("agency_id", analysis.agency_id);

      if (agencyUsers && agencyUsers.length > 0) {
        for (const agencyUser of agencyUsers) {
          await supabase.from("notifications").insert({
            user_id: agencyUser.user_id,
            type: "payments_rejected",
            source: "analises",
            reference_id: analysisId,
            title: "Pagamentos rejeitados",
            message: `Os pagamentos de ${analysis.inquilino_nome} foram rejeitados: ${rejectionReason}`,
            metadata: {
              tenant_name: analysis.inquilino_nome,
              rejection_reason: rejectionReason,
            },
          });
        }
      }

      console.log("Payments rejected:", { analysisId, reason: rejectionReason });

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "rejected",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("Error validating payments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
