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

    console.log("[check-and-notify-invoices] Starting scheduled job");

    const now = new Date();
    const results = {
      notified: 0,
      errors: 0,
    };

    // 1. Invoices RECENTLY GENERATED (status = 'gerada', no notifications sent yet)
    // Notificação "Fatura Disponível"
    const { data: generatedInvoices, error: generatedError } = await supabase
      .from('agency_invoices')
      .select('id, agency_id, reference_month, reference_year')
      .eq('status', 'gerada')
      .is('sent_at', null);

    if (!generatedError && generatedInvoices) {
      for (const invoice of generatedInvoices) {
        try {
          await supabase.functions.invoke('send-invoice-notification', {
            body: {
              invoiceId: invoice.id,
              agencyId: invoice.agency_id,
              notificationType: 'invoice_available'
            }
          });
          results.notified++;
          console.log(`[invoice_available] Notified for invoice ${invoice.id}`);
        } catch (error) {
          console.error(`[invoice_available] Error for invoice ${invoice.id}:`, error);
          results.errors++;
        }
      }
    }

    // 2. Invoices DUE IN 3 DAYS (status = 'enviada' or 'gerada', due_date = today + 3 days)
    // Notificação "Lembrete de Vencimento"
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split('T')[0];
    
    const { data: dueSoonInvoices, error: dueSoonError } = await supabase
      .from('agency_invoices')
      .select('id, agency_id, reference_month, reference_year')
      .in('status', ['enviada', 'gerada'])
      .eq('due_date', threeDaysFromNowStr)
      .not('sent_at', 'is', null);

    if (!dueSoonError && dueSoonInvoices) {
      for (const invoice of dueSoonInvoices) {
        try {
          await supabase.functions.invoke('send-invoice-notification', {
            body: {
              invoiceId: invoice.id,
              agencyId: invoice.agency_id,
              notificationType: 'due_reminder'
            }
          });
          results.notified++;
          console.log(`[due_reminder] Notified for invoice ${invoice.id}`);
        } catch (error) {
          console.error(`[due_reminder] Error for invoice ${invoice.id}:`, error);
          results.errors++;
        }
      }
    }

    // 3. Invoices OVERDUE BY 1 DAY (status = 'gerada' or 'enviada', due_date = yesterday)
    // Notificação "Aviso de Atraso"
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('agency_invoices')
      .select('id, agency_id, reference_month, reference_year')
      .in('status', ['gerada', 'enviada'])
      .eq('due_date', yesterdayStr);

    if (!overdueError && overdueInvoices) {
      for (const invoice of overdueInvoices) {
        try {
          // Update invoice status to 'atrasada'
          await supabase
            .from('agency_invoices')
            .update({ status: 'atrasada' })
            .eq('id', invoice.id);

          await supabase.functions.invoke('send-invoice-notification', {
            body: {
              invoiceId: invoice.id,
              agencyId: invoice.agency_id,
              notificationType: 'overdue'
            }
          });
          results.notified++;
          console.log(`[overdue] Notified for invoice ${invoice.id}`);
        } catch (error) {
          console.error(`[overdue] Error for invoice ${invoice.id}:`, error);
          results.errors++;
        }
      }
    }

    // 4. Invoices OVERDUE BY 2 DAYS (48 hours before blocking at 72h)
    // Notificação "Alerta Pré-Bloqueio"
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    const { data: preBlockInvoices, error: preBlockError } = await supabase
      .from('agency_invoices')
      .select('id, agency_id, reference_month, reference_year')
      .eq('status', 'atrasada')
      .eq('due_date', twoDaysAgoStr);

    if (!preBlockError && preBlockInvoices) {
      for (const invoice of preBlockInvoices) {
        try {
          await supabase.functions.invoke('send-invoice-notification', {
            body: {
              invoiceId: invoice.id,
              agencyId: invoice.agency_id,
              notificationType: 'pre_blocking'
            }
          });
          results.notified++;
          console.log(`[pre_blocking] Notified for invoice ${invoice.id}`);
        } catch (error) {
          console.error(`[pre_blocking] Error for invoice ${invoice.id}:`, error);
          results.errors++;
        }
      }
    }

    console.log(`[check-and-notify-invoices] Completed - notified: ${results.notified}, errors: ${results.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice notification check completed',
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[check-and-notify-invoices] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
