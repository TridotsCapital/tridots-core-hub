import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting expired contracts check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Find active contracts that have expired (data_fim_contrato < today)
    const { data: expiredContracts, error: fetchError } = await supabase
      .from('contracts')
      .select(`
        id,
        agency_id,
        data_fim_contrato,
        analysis:analyses!contracts_analysis_id_fkey (
          inquilino_nome
        )
      `)
      .eq('status', 'ativo')
      .lt('data_fim_contrato', todayStr);

    if (fetchError) {
      console.error('Error fetching expired contracts:', fetchError);
      throw fetchError;
    }

    if (!expiredContracts || expiredContracts.length === 0) {
      console.log("No expired contracts found");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          updated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${expiredContracts.length} expired contracts`);

    const results = {
      processed: expiredContracts.length,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const contract of expiredContracts) {
      // Check if there's an approved renewal with completed acceptance
      const { data: completedRenewal } = await supabase
        .from('contract_renewals')
        .select('id, terms_accepted_at, guarantee_payment_validated_at')
        .eq('contract_id', contract.id)
        .eq('status', 'approved')
        .not('terms_accepted_at', 'is', null)
        .maybeSingle();

      if (completedRenewal) {
        // Has a completed renewal - should be renewed, not expired
        console.log(`Contract ${contract.id} has completed renewal, skipping...`);
        results.skipped++;
        continue;
      }

      // Update contract status to 'vencido'
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'vencido' })
        .eq('id', contract.id);

      if (updateError) {
        console.error(`Error updating contract ${contract.id}:`, updateError);
        results.errors.push(`Update error for ${contract.id}: ${updateError.message}`);
        continue;
      }

      results.updated++;
      console.log(`Contract ${contract.id} marked as expired`);

      // Notify agency users
      const { data: agencyUsers } = await supabase
        .from('agency_users')
        .select('user_id')
        .eq('agency_id', contract.agency_id);

      if (agencyUsers && agencyUsers.length > 0) {
        const tenantName = (contract.analysis as any)?.inquilino_nome || 'inquilino';
        
        const notifications = agencyUsers.map(user => ({
          user_id: user.user_id,
          type: 'contract_expired',
          source: 'contratos',
          reference_id: contract.id,
          title: 'Contrato vencido',
          message: `O contrato de ${tenantName} venceu sem renovação aprovada.`,
          metadata: {
            contract_id: contract.id,
            tenant_name: tenantName,
            data_fim_contrato: contract.data_fim_contrato,
          },
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    console.log("Expired contracts check completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error checking expired contracts:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
