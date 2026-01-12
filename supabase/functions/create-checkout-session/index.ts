import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCheckoutRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: CreateCheckoutRequest = await req.json();

    if (!token) {
      throw new Error("Token is required");
    }

    // Get analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select(`
        *,
        agency:agencies(id, razao_social, nome_fantasia)
      `)
      .eq("acceptance_token", token)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Análise não encontrada");
    }

    // Verify terms were accepted
    if (!analysis.terms_accepted_at) {
      throw new Error("Termos não foram aceitos");
    }

    // Calculate values (in centavos for Stripe)
    const valorTotal = analysis.valor_total || analysis.valor_aluguel;
    const garantiaMensal = Math.round((valorTotal * analysis.taxa_garantia_percentual / 100) * 100);
    const setupFee = analysis.setup_fee_exempt ? 0 : Math.round(analysis.setup_fee * 100);

    // Create or get Stripe customer
    let customerId = analysis.stripe_customer_id;

    if (!customerId) {
      // Search for existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: analysis.payer_email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: analysis.payer_email,
          name: analysis.payer_name,
          phone: analysis.payer_phone,
          address: {
            line1: `${analysis.payer_address}, ${analysis.payer_number}`,
            line2: analysis.payer_complement || undefined,
            city: analysis.payer_city,
            state: analysis.payer_state,
            postal_code: analysis.payer_cep,
            country: "BR",
          },
          metadata: {
            analysis_id: analysis.id,
            agency_id: analysis.agency_id,
            payer_cpf: analysis.payer_cpf,
          },
        });
        customerId = customer.id;
      }

      // Save customer ID
      await supabase
        .from("analyses")
        .update({ stripe_customer_id: customerId })
        .eq("id", analysis.id);
    }

    // Create or get price for subscription
    const productName = `Garantia Locatícia - ${analysis.inquilino_nome}`;
    
    // Create ad-hoc price for this specific subscription
    const recurringPrice = await stripe.prices.create({
      currency: "brl",
      unit_amount: garantiaMensal,
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      product_data: {
        name: productName,
        metadata: {
          analysis_id: analysis.id,
        },
      },
    });

    // Build checkout session options
    const baseUrl = Deno.env.get("SITE_URL") || "https://hsyjtujcedwafcviourl.lovable.app";
    
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: recurringPrice.id,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          analysis_id: analysis.id,
          agency_id: analysis.agency_id,
        },
      },
      success_url: `${baseUrl}/aceite/${token}/sucesso`,
      cancel_url: `${baseUrl}/aceite/${token}?canceled=true`,
      locale: "pt-BR",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
      metadata: {
        analysis_id: analysis.id,
        agency_id: analysis.agency_id,
        token: token,
      },
    };

    // Add setup fee as invoice item if applicable
    if (setupFee > 0) {
      // Create one-time price for setup fee
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: setupFee,
        currency: "brl",
        description: "Taxa de Setup - Garantia Locatícia",
        metadata: {
          analysis_id: analysis.id,
          type: "setup_fee",
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Save checkout session ID
    await supabase
      .from("analyses")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", analysis.id);

    // Log timeline event
    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysis.id,
      _event_type: "payment_initiated",
      _description: "Checkout de pagamento iniciado",
      _metadata: { checkout_session_id: session.id },
    });

    console.log("Checkout session created:", {
      analysisId: analysis.id,
      sessionId: session.id,
      setupFee: setupFee / 100,
      monthlyAmount: garantiaMensal / 100,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
