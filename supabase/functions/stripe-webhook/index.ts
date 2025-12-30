import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw body
    const body = await req.text();
    
    // TODO: Verify the webhook signature with Stripe
    // For now, we'll parse the event directly
    // In production, use stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    
    const event = JSON.parse(body);
    console.log(`Received Stripe event: ${event.type}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        
        // Extract analysis_id from metadata if present
        const analysisId = paymentIntent.metadata?.analysis_id;
        
        if (analysisId) {
          // Update analysis status to active
          const { error: analysisError } = await supabase
            .from("analyses")
            .update({ status: "ativo" })
            .eq("id", analysisId);
          
          if (analysisError) {
            console.error("Error updating analysis:", analysisError);
          } else {
            console.log(`Analysis ${analysisId} marked as active`);
          }

          // Update pending commissions for this analysis to "paga"
          // Only update commissions for the current month (setup) 
          // Recurring commissions will be marked as paid through monthly cycles
          const { error: commissionError } = await supabase
            .from("commissions")
            .update({ 
              status: "paga",
              data_pagamento: new Date().toISOString()
            })
            .eq("analysis_id", analysisId)
            .eq("type", "setup")
            .eq("status", "pendente");
          
          if (commissionError) {
            console.error("Error updating commissions:", commissionError);
          } else {
            console.log(`Setup commission for analysis ${analysisId} marked as paid`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent failed: ${paymentIntent.id}`);
        
        const analysisId = paymentIntent.metadata?.analysis_id;
        if (analysisId) {
          // Log the failure but don't change status - keep in "aguardando_pagamento"
          console.log(`Payment failed for analysis ${analysisId}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        console.log(`Charge refunded: ${charge.id}`);
        
        // Note: Based on business rules, we don't reverse commissions after release
        // This is just logging the event
        console.log("Refund received - no commission reversal per business rules");
        break;
      }

      case "invoice.paid": {
        // For subscription-based recurring payments
        const invoice = event.data.object;
        console.log(`Invoice paid: ${invoice.id}`);
        
        // Extract analysis_id from metadata or subscription
        const analysisId = invoice.metadata?.analysis_id || 
                          invoice.subscription_details?.metadata?.analysis_id;
        
        if (analysisId) {
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          
          // Mark recurring commission for this month as paid
          const { error } = await supabase
            .from("commissions")
            .update({ 
              status: "paga",
              data_pagamento: new Date().toISOString()
            })
            .eq("analysis_id", analysisId)
            .eq("type", "recorrente")
            .eq("mes_referencia", month)
            .eq("ano_referencia", year)
            .eq("status", "pendente");
          
          if (error) {
            console.error("Error updating recurring commission:", error);
          } else {
            console.log(`Recurring commission for ${month}/${year} marked as paid`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Contract termination - cancel future commissions
        const subscription = event.data.object;
        console.log(`Subscription cancelled: ${subscription.id}`);
        
        const analysisId = subscription.metadata?.analysis_id;
        
        if (analysisId) {
          // Cancel all future pending commissions (not already paid)
          const { error } = await supabase
            .from("commissions")
            .update({ 
              status: "cancelada",
              observacoes: "Cancelada automaticamente - contrato encerrado"
            })
            .eq("analysis_id", analysisId)
            .eq("status", "pendente");
          
          if (error) {
            console.error("Error cancelling future commissions:", error);
          } else {
            console.log(`Future commissions for analysis ${analysisId} cancelled`);
          }

          // Update analysis status
          const { error: analysisError } = await supabase
            .from("analyses")
            .update({ 
              status: "cancelada",
              canceled_at: new Date().toISOString()
            })
            .eq("id", analysisId);
          
          if (analysisError) {
            console.error("Error updating analysis status:", analysisError);
          }
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
