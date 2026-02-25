import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar contratos com inconsistência: análise = boleto mas contrato != boleto OU sem parcelas
    const { data: contracts, error: fetchError } = await supabase
      .from("contracts")
      .select(`
        id,
        agency_id,
        payment_method,
        status,
        analysis:analyses!contracts_analysis_id_fkey (
          id,
          forma_pagamento_preferida,
          inquilino_nome
        )
      `)
      .not("status", "in", '("cancelado","encerrado")');

    if (fetchError) {
      console.error("Error fetching contracts:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch contracts", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filtrar: análise diz boleto MAS contrato não tem payment_method correto OU não tem parcelas
    const candidates = [];
    for (const contract of contracts || []) {
      const analysisPagamento = contract.analysis?.forma_pagamento_preferida;
      if (analysisPagamento !== 'boleto_imobiliaria') continue;

      // Check if contract needs fix: wrong payment_method OR no installments
      const needsPaymentSync = contract.payment_method !== 'boleto_imobiliaria';

      const { count } = await supabase
        .from("guarantee_installments")
        .select("*", { count: "exact", head: true })
        .eq("contract_id", contract.id);

      const hasNoInstallments = !count || count === 0;

      if (needsPaymentSync || hasNoInstallments) {
        candidates.push({
          contract_id: contract.id,
          agency_id: contract.agency_id,
          tenant_name: contract.analysis?.inquilino_nome || 'N/A',
          analysis_id: contract.analysis?.id,
          current_payment_method: contract.payment_method,
          needs_payment_sync: needsPaymentSync,
          has_no_installments: hasNoInstallments,
          installment_count: count || 0,
        });
      }
    }

    console.log(`Found ${candidates.length} contracts to reconcile`);

    const results: { contract_id: string; tenant: string; status: string; error?: string }[] = [];

    for (const candidate of candidates) {
      try {
        // Sync payment_method if needed
        if (candidate.needs_payment_sync) {
          const { error: syncError } = await supabase
            .from("contracts")
            .update({ payment_method: 'boleto_imobiliaria' })
            .eq("id", candidate.contract_id);

          if (syncError) {
            results.push({ contract_id: candidate.contract_id, tenant: candidate.tenant_name, status: 'error', error: `Sync failed: ${syncError.message}` });
            continue;
          }
        }

        // Generate installments by invoking the function
        if (candidate.has_no_installments) {
          const { data: genResult, error: genError } = await supabase.functions.invoke("generate-installments", {
            body: { contract_id: candidate.contract_id }
          });

          if (genError) {
            results.push({ contract_id: candidate.contract_id, tenant: candidate.tenant_name, status: 'error', error: `Generate failed: ${genError.message}` });
            continue;
          }

          console.log(`Generate result for ${candidate.contract_id}:`, genResult);
        }

        // Log timeline event
        if (candidate.analysis_id) {
          await supabase.from("analysis_timeline").insert({
            analysis_id: candidate.analysis_id,
            event_type: "reconciliation",
            description: `Reparo automático: payment_method sincronizado para boleto_imobiliaria${candidate.has_no_installments ? ' e parcelas/faturas geradas' : ''}`,
            metadata: {
              reconciled_at: new Date().toISOString(),
              previous_payment_method: candidate.current_payment_method,
              installments_generated: candidate.has_no_installments,
            }
          });
        }

        results.push({ contract_id: candidate.contract_id, tenant: candidate.tenant_name, status: 'fixed' });
      } catch (err) {
        results.push({ contract_id: candidate.contract_id, tenant: candidate.tenant_name, status: 'error', error: err.message });
      }
    }

    const fixed = results.filter(r => r.status === 'fixed').length;
    const failed = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        total_found: candidates.length,
        fixed,
        failed,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in reconcile-boleto-contracts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
