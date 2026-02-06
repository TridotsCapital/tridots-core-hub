import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[process-delinquency-blocking] Starting scheduled job");

    const now = new Date();
    const results = {
      blocked: 0,
      errors: 0,
    };

    // Find agencies with overdue invoices for 72+ hours
    // Invoices with status 'atrasada' and due_date <= 3 days ago
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    const { data: delinquentInvoices, error: queryError } = await supabase
      .from('agency_invoices')
      .select('agency_id')
      .eq('status', 'atrasada')
      .lte('due_date', threeDaysAgoStr);

    if (queryError) {
      console.error("[process-delinquency-blocking] Query error:", queryError);
      throw queryError;
    }

    // Get unique agency IDs
    const agenciesToBlock = new Set(
      delinquentInvoices?.map(inv => inv.agency_id) || []
    );

    console.log(`[process-delinquency-blocking] Found ${agenciesToBlock.size} agencies to block`);

    // Block each agency
    for (const agencyId of agenciesToBlock) {
      try {
        // Check if already blocked
        const { data: agency } = await supabase
          .from('agencies')
          .select('id, billing_blocked_at, nome_fantasia, razao_social, responsavel_email, responsavel_nome')
          .eq('id', agencyId)
          .single();

        if (!agency) {
          console.warn(`[process-delinquency-blocking] Agency ${agencyId} not found`);
          results.errors++;
          continue;
        }

        // Only block if not already blocked
        if (!agency.billing_blocked_at) {
          const blockedAt = new Date().toISOString();

          // Update agency with blocking info
          const { error: updateError } = await supabase
            .from('agencies')
            .update({
              billing_blocked_at: blockedAt,
              billing_status: 'bloqueada'
            })
            .eq('id', agencyId);

          if (updateError) {
            console.error(`[process-delinquency-blocking] Error blocking agency ${agencyId}:`, updateError);
            results.errors++;
            continue;
          }

          // Send blocking confirmation email
          try {
            // Get overdue invoice for reference
            const { data: overdueInvoices } = await supabase
              .from('agency_invoices')
              .select('id')
              .eq('agency_id', agencyId)
              .eq('status', 'atrasada')
              .limit(1);

            const overdueInvoiceId = overdueInvoices?.[0]?.id;

            if (overdueInvoiceId) {
              await supabase.functions.invoke('send-invoice-notification', {
                body: {
                  invoiceId: overdueInvoiceId,
                  agencyId: agencyId,
                  notificationType: 'blocking_confirmation'
                }
              });
            }
          } catch (emailError) {
            console.error(`[process-delinquency-blocking] Error sending blocking email for ${agencyId}:`, emailError);
          }

          results.blocked++;
          console.log(`[process-delinquency-blocking] Blocked agency ${agencyId}`);
        } else {
          console.log(`[process-delinquency-blocking] Agency ${agencyId} already blocked`);
        }

      } catch (error) {
        console.error(`[process-delinquency-blocking] Error processing agency ${agencyId}:`, error);
        results.errors++;
      }
    }

    console.log(`[process-delinquency-blocking] Completed - blocked: ${results.blocked}, errors: ${results.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Delinquency blocking process completed',
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[process-delinquency-blocking] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
