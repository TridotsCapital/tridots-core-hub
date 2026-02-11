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

// Plan commission rates (duplicated from frontend to avoid import issues)
const PLAN_COMMISSION_RATES: Record<string, number> = {
  start: 5,
  prime: 10,
  exclusive: 15,
};

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

    // For boleto_imobiliaria, guaranteePaymentDate is not required
    // We'll check this after fetching the analysis

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

    const isBoletoUnificado = analysis.forma_pagamento_preferida === 'boleto_imobiliaria';

    // Validate guaranteePaymentDate only if not boleto_imobiliaria
    if (action === "validate" && !isBoletoUnificado && !guaranteePaymentDate) {
      throw new Error("Data de pagamento da garantia é obrigatória");
    }

    if (action === "validate") {
      // Validate payments - move to approved and create contract
      
      // Update analysis status with payment dates
      const updateData: Record<string, any> = {
        status: "aprovada",
        approved_at: new Date().toISOString(),
        payments_validated_at: new Date().toISOString(),
        payments_validated_by: userId,
      };

      // Only set guarantee_payment_date if not boleto_imobiliaria
      if (!isBoletoUnificado && guaranteePaymentDate) {
        updateData.guarantee_payment_date = guaranteePaymentDate;
      }
      
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

      // Update contract with payment_method if boleto_imobiliaria
      if (contractId && isBoletoUnificado) {
        const { error: contractUpdateError } = await supabase
          .from("contracts")
          .update({ payment_method: 'boleto_imobiliaria' })
          .eq("id", contractId);

        if (contractUpdateError) {
          console.error("Error updating contract payment_method:", contractUpdateError);
        }

        // Generate installments for boleto_imobiliaria
        console.log('Generating installments for boleto_imobiliaria contract...');
        try {
          const { data: installmentsResult, error: installmentsError } = await supabase.functions.invoke('generate-installments', {
            body: { contract_id: contractId }
          });

          if (installmentsError) {
            console.error('Error generating installments:', installmentsError);
          } else {
            console.log('Installments generated successfully:', installmentsResult);
          }
        } catch (installmentsErr) {
          console.error('Exception generating installments:', installmentsErr);
        }
      }

      // Generate commissions for ALL contract types
      try {
        const commissionBaseDate = isBoletoUnificado 
          ? new Date().toISOString().split('T')[0] 
          : guaranteePaymentDate!;
        await generateCommissions(supabase, analysis, commissionBaseDate);
        console.log("Commissions generated successfully for analysis:", analysisId, { isBoletoUnificado });
      } catch (commissionError) {
        console.error("Error generating commissions:", commissionError);
        // Don't fail the whole operation, log it
      }

      // Log timeline event with payment dates
      const setupDateInfo = setupPaymentDate ? `, Setup: ${setupPaymentDate}` : '';
      const guaranteeDateInfo = !isBoletoUnificado && guaranteePaymentDate ? `Garantia: ${guaranteePaymentDate}` : 'Boleto Unificado';
      await supabase.rpc("log_analysis_timeline_event", {
        _analysis_id: analysisId,
        _event_type: "payments_validated",
        _description: `Pagamentos validados - ${guaranteeDateInfo}${setupDateInfo}`,
        _metadata: { 
          validated_by: userId,
          contract_id: contractId,
          setup_payment_date: setupPaymentDate || null,
          guarantee_payment_date: guaranteePaymentDate || null,
          is_boleto_unificado: isBoletoUnificado,
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

      console.log("Payments validated successfully:", { analysisId, contractId, isBoletoUnificado });

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

// Generate commissions for the agency
async function generateCommissions(supabase: any, analysis: any, validationDate: string) {
  const planoGarantia = analysis.plano_garantia || 'start';
  const commissionRate = PLAN_COMMISSION_RATES[planoGarantia] || 5;
  const garantiaAnual = analysis.garantia_anual || (analysis.valor_total * (analysis.taxa_garantia_percentual / 100) * 12);
  const comissaoAnual = garantiaAnual * (commissionRate / 100);
  const comissaoMensal = comissaoAnual / 12;
  const setupFee = analysis.setup_fee_exempt ? 0 : (analysis.setup_fee || 0);
  
  const startDate = new Date(validationDate);
  const commissions: any[] = [];

  // Helper: get day 10 of the month AFTER the given month/year
  function getDueDate10NextMonth(month: number, year: number): string {
    // month is 1-based (1=Jan, 12=Dec)
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const mm = String(nextMonth).padStart(2, '0');
    return `${nextYear}-${mm}-10`;
  }

  // Setup commission (if not exempt and has fee)
  if (setupFee > 0) {
    const setupMesRef = startDate.getMonth() + 1; // 1-based
    const setupAnoRef = startDate.getFullYear();
    commissions.push({
      analysis_id: analysis.id,
      agency_id: analysis.agency_id,
      type: 'setup',
      status: 'a_pagar', // Setup is immediately payable
      valor: setupFee * (analysis.agency?.percentual_comissao_setup || 100) / 100,
      base_calculo: setupFee,
      percentual_comissao: analysis.agency?.percentual_comissao_setup || 100,
      due_date: getDueDate10NextMonth(setupMesRef, setupAnoRef),
      mes_referencia: setupMesRef,
      ano_referencia: setupAnoRef,
    });
  }

  // 12 recurring monthly commissions
  for (let i = 0; i < 12; i++) {
    // Calculate mes_referencia: startDate month + i (the month of the installment)
    const refDate = new Date(startDate);
    refDate.setMonth(refDate.getMonth() + i);
    const mesRef = refDate.getMonth() + 1; // 1-based
    const anoRef = refDate.getFullYear();

    commissions.push({
      analysis_id: analysis.id,
      agency_id: analysis.agency_id,
      type: 'recorrente',
      status: 'pendente', // Recurring starts as pending until due date
      valor: comissaoMensal,
      base_calculo: garantiaAnual,
      percentual_comissao: commissionRate,
      due_date: getDueDate10NextMonth(mesRef, anoRef),
      mes_referencia: mesRef,
      ano_referencia: anoRef,
    });
  }

  console.log(`Inserting ${commissions.length} commissions for analysis ${analysis.id}`);
  
  const { error } = await supabase
    .from('commissions')
    .insert(commissions);

  if (error) {
    throw error;
  }

  console.log(`Successfully created ${commissions.length} commissions`);
}

serve(handler);
