import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateLinkRequest {
  analysisId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { analysisId }: GenerateLinkRequest = await req.json();

    if (!analysisId) {
      throw new Error("analysisId is required");
    }

    // Verify analysis exists and is in correct status
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*, agency:agencies(*)")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Análise não encontrada");
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours expiration

    // Update analysis with token
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        acceptance_token: token,
        acceptance_token_expires_at: expiresAt.toISOString(),
        acceptance_token_used_at: null, // Reset if regenerating
      })
      .eq("id", analysisId);

    if (updateError) {
      throw updateError;
    }

    // Log timeline event
    await supabase.rpc("log_analysis_timeline_event", {
      _analysis_id: analysisId,
      _event_type: "acceptance_link_generated",
      _description: "Link de aceite gerado com validade de 72 horas",
      _metadata: { expires_at: expiresAt.toISOString() },
    });

    // Build acceptance URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://hsyjtujcedwafcviourl.lovable.app";
    const acceptanceUrl = `${baseUrl}/aceite/${token}`;

    console.log("Generated acceptance link:", {
      analysisId,
      token,
      expiresAt: expiresAt.toISOString(),
      url: acceptanceUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        url: acceptanceUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating acceptance link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
