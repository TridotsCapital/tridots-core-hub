import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const event = JSON.parse(body);
    console.log(`Received Stripe event: ${event.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        
        const analysisId = session.metadata?.analysis_id;
        
        if (analysisId) {
          // Mark token as used
          await supabase
            .from("analyses")
            .update({ 
              acceptance_token_used_at: new Date().toISOString(),
              stripe_subscription_id: session.subscription,
              payment_confirmed_at: new Date().toISOString(),
              status: "aprovada"
            })
            .eq("id", analysisId);
          
          console.log(`Analysis ${analysisId} payment confirmed, status changed to aprovada`);

          // Log timeline event
          await supabase.rpc("log_analysis_timeline_event", {
            _analysis_id: analysisId,
            _event_type: "payment_completed",
            _description: "Pagamento confirmado via Stripe",
            _metadata: { 
              checkout_session_id: session.id,
              subscription_id: session.subscription,
            },
          });

          // Create contract (check for existing first to prevent duplicates)
          const { data: existingContract } = await supabase
            .from("contracts")
            .select("id")
            .eq("analysis_id", analysisId)
            .maybeSingle();

          if (!existingContract) {
            const { data: contractId, error: contractError } = await supabase
              .rpc("create_contract_from_analysis", { _analysis_id: analysisId });
            
            if (contractError) {
              console.error("Error creating contract:", contractError);
            } else {
              console.log(`Contract created: ${contractId}`);
            }
          } else {
            console.log(`Contract already exists for analysis ${analysisId}, skipping creation`);
          }

          // Create setup commission if applicable
          const { data: analysis } = await supabase
            .from("analyses")
            .select("*, agency:agencies(*)")
            .eq("id", analysisId)
            .single();

          if (analysis && analysis.setup_fee > 0 && !analysis.setup_fee_exempt) {
            const setupCommissionValue = analysis.setup_fee * (analysis.agency.percentual_comissao_setup / 100);
            
            await supabase.from("commissions").insert({
              analysis_id: analysisId,
              agency_id: analysis.agency_id,
              type: "setup",
              status: "pendente",
              valor: setupCommissionValue,
              observacoes: "Comissão de setup gerada automaticamente",
            });
            console.log(`Setup commission created: ${setupCommissionValue}`);
          }

          // Create first recurring commission
          if (analysis) {
            const valorTotal = analysis.valor_total || analysis.valor_aluguel;
            const garantiaMensal = (valorTotal * analysis.taxa_garantia_percentual / 100) / 12;
            const recurringCommissionValue = garantiaMensal * (analysis.agency.percentual_comissao_recorrente / 100);
            
            const now = new Date();
            await supabase.from("commissions").insert({
              analysis_id: analysisId,
              agency_id: analysis.agency_id,
              type: "recorrente",
              status: "pendente",
              valor: recurringCommissionValue,
              mes_referencia: now.getMonth() + 1,
              ano_referencia: now.getFullYear(),
              observacoes: "Primeira comissão recorrente",
            });
            console.log(`First recurring commission created: ${recurringCommissionValue}`);
          }

          // TODO: Send notification emails to agency and internal team
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        console.log(`Invoice paid: ${invoice.id}`);
        
        const analysisId = invoice.metadata?.analysis_id || 
                          invoice.subscription_details?.metadata?.analysis_id;
        
        if (analysisId) {
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          
          // Check if commission already exists for this month
          const { data: existingCommission } = await supabase
            .from("commissions")
            .select("id")
            .eq("analysis_id", analysisId)
            .eq("type", "recorrente")
            .eq("mes_referencia", month)
            .eq("ano_referencia", year)
            .single();

          if (existingCommission) {
            // Mark as paid
            await supabase
              .from("commissions")
              .update({ 
                status: "paga",
                data_pagamento: new Date().toISOString()
              })
              .eq("id", existingCommission.id);
            
            console.log(`Recurring commission for ${month}/${year} marked as paid`);
          } else {
            // Create and mark as paid (for subsequent months)
            const { data: analysis } = await supabase
              .from("analyses")
              .select("*, agency:agencies(*)")
              .eq("id", analysisId)
              .single();

            if (analysis) {
              const valorTotal = analysis.valor_total || analysis.valor_aluguel;
              const garantiaMensal = (valorTotal * analysis.taxa_garantia_percentual / 100) / 12;
              const recurringCommissionValue = garantiaMensal * (analysis.agency.percentual_comissao_recorrente / 100);
              
              await supabase.from("commissions").insert({
                analysis_id: analysisId,
                agency_id: analysis.agency_id,
                type: "recorrente",
                status: "paga",
                valor: recurringCommissionValue,
                mes_referencia: month,
                ano_referencia: year,
                data_pagamento: new Date().toISOString(),
              });
              console.log(`Recurring commission created and paid: ${recurringCommissionValue}`);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log(`Invoice payment failed: ${invoice.id}`);
        
        const analysisId = invoice.metadata?.analysis_id || 
                          invoice.subscription_details?.metadata?.analysis_id;
        
        if (analysisId) {
          // Increment retry count
          const { data: analysis } = await supabase
            .from("analyses")
            .select("payment_retry_count")
            .eq("id", analysisId)
            .single();

          const retryCount = (analysis?.payment_retry_count || 0) + 1;
          
          await supabase
            .from("analyses")
            .update({ 
              payment_failed_at: new Date().toISOString(),
              payment_retry_count: retryCount,
            })
            .eq("id", analysisId);

          // Log timeline event
          await supabase.rpc("log_analysis_timeline_event", {
            _analysis_id: analysisId,
            _event_type: "payment_failed",
            _description: `Falha no pagamento (tentativa ${retryCount}/3)`,
            _metadata: { invoice_id: invoice.id, attempt: retryCount },
          });

          console.log(`Payment failed for analysis ${analysisId} (attempt ${retryCount})`);

          // TODO: Send urgent notification if retry_count >= 3
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(`Subscription cancelled: ${subscription.id}`);
        
        const analysisId = subscription.metadata?.analysis_id;
        
        if (analysisId) {
          // Cancel future pending commissions
          await supabase
            .from("commissions")
            .update({ 
              status: "cancelada",
              observacoes: "Cancelada automaticamente - assinatura encerrada"
            })
            .eq("analysis_id", analysisId)
            .eq("status", "pendente");
          
          console.log(`Future commissions for analysis ${analysisId} cancelled`);

          // Update contract status if exists
          await supabase
            .from("contracts")
            .update({ 
              status: "encerrado",
              canceled_at: new Date().toISOString(),
            })
            .eq("analysis_id", analysisId);

          // Log timeline event
          await supabase.rpc("log_analysis_timeline_event", {
            _analysis_id: analysisId,
            _event_type: "subscription_cancelled",
            _description: "Assinatura cancelada - contrato encerrado",
            _metadata: { subscription_id: subscription.id },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
