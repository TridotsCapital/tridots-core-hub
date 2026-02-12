import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Find all pending commissions where due_date <= today using indexed columns
    // This query leverages the due_date and status indexes we created for performance
    const { data: pendingCommissions, error: fetchError } = await supabase
      .from("commissions")
      .select("id, due_date, status", { count: 'exact' })
      .eq("status", "pendente")
      .lte("due_date", today)
      .limit(1000); // Apply limit to batch process if needed

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingCommissions || pendingCommissions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending commissions to process",
          updated: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update all matching commissions to 'a_pagar' status
    const ids = pendingCommissions.map(c => c.id);
    
    const { error: updateError } = await supabase
      .from("commissions")
      .update({ status: "a_pagar" })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    console.log(`Updated ${ids.length} commissions to 'a_pagar' status`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated ${ids.length} commissions to 'a_pagar' status`,
        updated: ids.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error processing commissions:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
