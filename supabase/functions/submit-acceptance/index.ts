import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitAcceptanceRequest {
  token: string;
  step: "terms" | "payer" | "setup_payment" | "guarantee_payment";
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

    // Validate token
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("id, acceptance_token_expires_at, acceptance_token_used_at, setup_fee_exempt")
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
          const { data: analysisDetails } = await supabase
            .from("analyses")
            .select("inquilino_nome, agency:agencies(nome_fantasia)")
            .eq("id", analysis.id)
            .single();

          for (const master of masters) {
            await supabase.from("notifications").insert({
              user_id: master.user_id,
              type: "payments_pending_validation",
              source: "analises",
              reference_id: analysis.id,
              title: "Pagamentos aguardando validação",
              message: `O inquilino ${analysisDetails?.inquilino_nome} confirmou os pagamentos e aguarda validação.`,
              metadata: {
                tenant_name: analysisDetails?.inquilino_nome,
                agency_name: analysisDetails?.agency?.nome_fantasia,
              },
            });
          }
        }

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
