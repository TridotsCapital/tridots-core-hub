import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitAcceptanceRequest {
  token: string;
  step: "terms" | "payer" | "setup_payment" | "guarantee_payment" | "acceptance_complete";
  identityPhotoPath?: string;
  payerData?: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    isTenant: boolean;
  };
  paymentConfirmation?: {
    type: "setup" | "guarantee";
    receiptPath?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: SubmitAcceptanceRequest = await req.json();
    const { token, step } = requestData;

    if (!token || !step) {
      throw new Error("Missing required fields: token and step");
    }

    console.log("Processing acceptance step:", { token: token.substring(0, 8) + "...", step });

    // Validate token and get analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("id, acceptance_token_expires_at, acceptance_token_used_at, setup_fee_exempt, setup_fee, forma_pagamento_preferida, inquilino_nome, agency_id, agency:agencies(nome_fantasia)")
      .eq("acceptance_token", token)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Token inválido");
    }

    if (analysis.acceptance_token_used_at) {
      throw new Error("Token já foi utilizado");
    }

    const expiresAt = new Date(analysis.acceptance_token_expires_at);
    if (expiresAt < new Date()) {
      throw new Error("Token expirado");
    }

    const isBoletoUnificado = analysis.forma_pagamento_preferida === 'boleto_imobiliaria';
    const isSetupExempt = analysis.setup_fee_exempt || (analysis.setup_fee || 0) <= 0;

    // Helper function to auto-activate analysis (Boleto Unificado + Setup Isento)
    const autoActivateAnalysis = async () => {
      console.log("Auto-activating analysis (Boleto Unificado + Setup Isento):", analysis.id);

      // 1. Update analysis status to aprovada
      const { error: updateError } = await supabase
        .from("analyses")
        .update({
          status: "aprovada",
          approved_at: new Date().toISOString(),
          payments_validated_at: new Date().toISOString(),
          acceptance_token_used_at: new Date().toISOString(),
        })
        .eq("id", analysis.id);

      if (updateError) {
        console.error("Error updating analysis for auto-activation:", updateError);
        throw updateError;
      }

      // 2. Create contract via RPC
      const { data: contractId, error: contractError } = await supabase.rpc(
        "create_contract_from_analysis",
        { _analysis_id: analysis.id }
      );

      if (contractError) {
        console.error("Error creating contract:", contractError);
      }

      // 3. Update contract payment_method and generate installments
      if (contractId) {
        const { error: contractUpdateError } = await supabase
          .from("contracts")
          .update({ payment_method: 'boleto_imobiliaria' })
          .eq("id", contractId);

        if (contractUpdateError) {
          console.error("Error updating contract payment_method:", contractUpdateError);
        }

        // Generate 12 installments
        console.log('Generating installments for auto-activated contract...');
        try {
          const { error: installmentsError } = await supabase.functions.invoke('generate-installments', {
            body: { contract_id: contractId }
          });
          if (installmentsError) {
            console.error('Error generating installments:', installmentsError);
          }
        } catch (installmentsErr) {
          console.error('Exception generating installments:', installmentsErr);
        }
      }

      // 4. Log timeline event
      await supabase.rpc("log_analysis_timeline_event", {
        _analysis_id: analysis.id,
        _event_type: "auto_activated",
        _description: "Contrato ativado automaticamente (Boleto Unificado, Setup Isento)",
        _metadata: { 
          contract_id: contractId,
          payment_method: "boleto_imobiliaria",
          auto_activated: true,
        },
      });

      // 5. Notify agency users
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
            reference_id: contractId || analysis.id,
            title: "Contrato ativado automaticamente!",
            message: `O contrato de ${analysis.inquilino_nome} foi ativado automaticamente (Boleto Unificado). Complete a documentação para ativar a garantia.`,
            metadata: {
              tenant_name: analysis.inquilino_nome,
              contract_id: contractId,
              auto_activated: true,
            },
          });
        }
      }

      console.log("Auto-activation completed:", { analysisId: analysis.id, contractId });
    };

    // Helper function to mark acceptance as complete (for non-auto-activate scenarios)
    const markAcceptanceComplete = async (description?: string) => {
      const { error: updateError } = await supabase
        .from("analyses")
        .update({
          acceptance_token_used_at: new Date().toISOString(),
        })
        .eq("id", analysis.id);

      if (updateError) throw updateError;

      await supabase.rpc("log_analysis_timeline_event", {
        _analysis_id: analysis.id,
        _event_type: "acceptance_completed",
        _description: description || "Aceite concluído - Aguardando validação da Tridots",
        _metadata: { payment_method: analysis.forma_pagamento_preferida },
      });

      // Create notification for masters about pending validation
      const { data: masters } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "master");

      if (masters && masters.length > 0) {
        for (const master of masters) {
          await supabase.from("notifications").insert({
            user_id: master.user_id,
            type: "payments_pending_validation",
            source: "analises",
            reference_id: analysis.id,
            title: "Aceite aguardando validação",
            message: `O inquilino ${analysis.inquilino_nome} completou o aceite e aguarda validação.`,
            metadata: {
              tenant_name: analysis.inquilino_nome,
              agency_name: analysis.agency?.nome_fantasia,
              is_boleto_unificado: isBoletoUnificado,
            },
          });
        }
      }
    };

    // Process based on step
    switch (step) {
      case "terms": {
        const { identityPhotoPath } = requestData;
        if (!identityPhotoPath) {
          throw new Error("Identity photo path is required for terms step");
        }

        const { error: updateError } = await supabase
          .from("analyses")
          .update({
            terms_accepted_at: new Date().toISOString(),
            identity_photo_path: identityPhotoPath,
          })
          .eq("id", analysis.id);

        if (updateError) throw updateError;

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "terms_accepted",
          _description: "Termos aceitos pelo inquilino",
          _metadata: {},
        });

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "identity_verified",
          _description: "Documento de identidade enviado para verificação",
          _metadata: { photo_path: identityPhotoPath },
        });

        // Auto-activate if Boleto Unificado + Setup Isento
        if (isBoletoUnificado && isSetupExempt) {
          await autoActivateAnalysis();
        }

        break;
      }

      case "payer": {
        const { payerData } = requestData;
        if (!payerData) {
          throw new Error("Payer data is required for payer step");
        }

        const { error: updateError } = await supabase
          .from("analyses")
          .update({
            payer_name: payerData.name,
            payer_cpf: payerData.cpf,
            payer_email: payerData.email,
            payer_phone: payerData.phone,
            payer_address: payerData.address,
            payer_number: payerData.number,
            payer_complement: payerData.complement || null,
            payer_neighborhood: payerData.neighborhood,
            payer_city: payerData.city,
            payer_state: payerData.state,
            payer_cep: payerData.cep,
            payer_is_tenant: payerData.isTenant,
          })
          .eq("id", analysis.id);

        if (updateError) throw updateError;

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "payer_confirmed",
          _description: payerData.isTenant 
            ? "Pagador confirmado como o próprio inquilino" 
            : `Pagador confirmado: ${payerData.name}`,
          _metadata: { is_tenant: payerData.isTenant },
        });

        // If boleto_imobiliaria and setup is exempt, mark acceptance as complete
        if (isBoletoUnificado && isSetupExempt) {
          await markAcceptanceComplete();
        }

        break;
      }

      case "setup_payment": {
        const { paymentConfirmation } = requestData;
        
        const { error: updateError } = await supabase
          .from("analyses")
          .update({
            setup_payment_confirmed_at: new Date().toISOString(),
            setup_payment_receipt_path: paymentConfirmation?.receiptPath || null,
          })
          .eq("id", analysis.id);

        if (updateError) throw updateError;

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "setup_payment_confirmed",
          _description: "Pagamento da taxa setup confirmado pelo inquilino",
          _metadata: { has_receipt: !!paymentConfirmation?.receiptPath },
        });

        // If boleto_imobiliaria, mark acceptance as complete after setup payment
        if (isBoletoUnificado) {
          await markAcceptanceComplete();
        }

        break;
      }

      case "guarantee_payment": {
        const { paymentConfirmation } = requestData;
        
        const updateData: Record<string, unknown> = {
          guarantee_payment_confirmed_at: new Date().toISOString(),
          guarantee_payment_receipt_path: paymentConfirmation?.receiptPath || null,
          acceptance_token_used_at: new Date().toISOString(), // Mark token as used
        };

        const { error: updateError } = await supabase
          .from("analyses")
          .update(updateData)
          .eq("id", analysis.id);

        if (updateError) throw updateError;

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "guarantee_payment_confirmed",
          _description: "Pagamento da garantia confirmado pelo inquilino",
          _metadata: { has_receipt: !!paymentConfirmation?.receiptPath },
        });

        await supabase.rpc("log_analysis_timeline_event", {
          _analysis_id: analysis.id,
          _event_type: "acceptance_completed",
          _description: "Aceite concluído - Aguardando validação da Tridots",
          _metadata: {},
        });

        // Create notification for masters about pending validation
        const { data: masters } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "master");

        if (masters && masters.length > 0) {
          for (const master of masters) {
            await supabase.from("notifications").insert({
              user_id: master.user_id,
              type: "payments_pending_validation",
              source: "analises",
              reference_id: analysis.id,
              title: "Pagamentos aguardando validação",
              message: `O inquilino ${analysis.inquilino_nome} confirmou os pagamentos e aguarda validação.`,
              metadata: {
                tenant_name: analysis.inquilino_nome,
                agency_name: analysis.agency?.nome_fantasia,
              },
            });
          }
        }

        break;
      }

      case "acceptance_complete": {
        // This step is called when boleto_imobiliaria completes without needing payment steps
        await markAcceptanceComplete();
        break;
      }

      default:
        throw new Error(`Unknown step: ${step}`);
    }

    console.log("Acceptance step completed:", { analysisId: analysis.id, step });

    return new Response(
      JSON.stringify({ success: true, analysisId: analysis.id, step }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error submitting acceptance:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
