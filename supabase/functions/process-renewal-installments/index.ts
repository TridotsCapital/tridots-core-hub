import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstallmentData {
  contract_id: string;
  agency_id: string;
  installment_number: number;
  reference_month: number;
  reference_year: number;
  value: number;
  due_date: string;
  status: 'pendente';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { renewal_id, contract_id, new_payment_method } = await req.json();

    if (!renewal_id || !contract_id) {
      return new Response(
        JSON.stringify({ error: "renewal_id and contract_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing renewal installments for renewal ${renewal_id}, contract ${contract_id}`);

    // 1. Fetch renewal data
    const { data: renewal, error: renewalError } = await supabase
      .from("contract_renewals")
      .select("*")
      .eq("id", renewal_id)
      .single();

    if (renewalError || !renewal) {
      console.error("Renewal not found:", renewalError);
      return new Response(
        JSON.stringify({ error: "Renewal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (renewal.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: "Renewal is not approved", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch contract and agency data
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        id,
        agency_id,
        payment_method,
        data_fim_contrato,
        analysis:analyses!contracts_analysis_id_fkey (
          id,
          taxa_garantia_percentual,
          valor_aluguel,
          valor_condominio,
          valor_iptu,
          valor_outros_encargos
        )
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      console.error("Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch agency billing config
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("billing_due_day")
      .eq("id", contract.agency_id)
      .single();

    // Determine the payment method to use (either new_payment_method from request or existing)
    const finalPaymentMethod = new_payment_method || contract.payment_method;

    // 4. Calculate new values from renewal
    const newValorTotal = renewal.new_valor_aluguel + 
                         (renewal.new_valor_condominio || 0) + 
                         (renewal.new_valor_iptu || 0) + 
                         (renewal.new_valor_outros_encargos || 0);
    const taxaGarantia = renewal.new_taxa_garantia_percentual || contract.analysis?.taxa_garantia_percentual || 10;
    const garantiaAnual = newValorTotal * (taxaGarantia / 100) * 12;

    // 5. Calculate new end date
    const durationMonths = renewal.renewal_duration_months || 12;
    const currentEndDate = contract.data_fim_contrato ? new Date(contract.data_fim_contrato) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

    // 6. Update the contract with new values
    const updateData: Record<string, unknown> = {
      data_fim_contrato: newEndDate.toISOString().split('T')[0],
      renewal_count: (contract as any).renewal_count ? (contract as any).renewal_count + 1 : 1,
      last_renewal_id: renewal_id,
      updated_at: new Date().toISOString()
    };

    // If changing payment method, update it
    if (new_payment_method && new_payment_method !== contract.payment_method) {
      updateData.payment_method = new_payment_method;
      console.log(`Changing payment method from ${contract.payment_method} to ${new_payment_method}`);
    }

    const { error: updateContractError } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contract_id);

    if (updateContractError) {
      console.error("Error updating contract:", updateContractError);
      return new Response(
        JSON.stringify({ error: "Failed to update contract", details: updateContractError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Update the analysis with new values
    const { error: updateAnalysisError } = await supabase
      .from("analyses")
      .update({
        valor_aluguel: renewal.new_valor_aluguel,
        valor_condominio: renewal.new_valor_condominio,
        valor_iptu: renewal.new_valor_iptu,
        valor_outros_encargos: renewal.new_valor_outros_encargos,
        taxa_garantia_percentual: renewal.new_taxa_garantia_percentual,
        valor_total: newValorTotal,
        garantia_anual: garantiaAnual,
        updated_at: new Date().toISOString()
      })
      .eq("id", contract.analysis?.id);

    if (updateAnalysisError) {
      console.error("Error updating analysis:", updateAnalysisError);
      // Non-critical, continue
    }

    // 8. Update the renewal with new end date
    const { error: updateRenewalError } = await supabase
      .from("contract_renewals")
      .update({
        new_data_fim_contrato: newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq("id", renewal_id);

    if (updateRenewalError) {
      console.error("Error updating renewal:", updateRenewalError);
    }

    // 9. If payment method is boleto_imobiliaria, generate new installments
    if (finalPaymentMethod === 'boleto_imobiliaria') {
      if (!agency?.billing_due_day) {
        console.warn("Agency billing_due_day not configured, skipping installment generation");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Renewal processed but installments not generated (no billing_due_day)",
            contract_updated: true,
            new_end_date: newEndDate.toISOString().split('T')[0]
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const valorParcela = garantiaAnual / 12;
      const billingDueDay = agency.billing_due_day;

      // Start from the current end date (which is the renewal start)
      const renewalStartDate = new Date(currentEndDate);
      const startDay = renewalStartDate.getDate();

      let firstDueDate: Date;
      if (startDay < billingDueDay) {
        firstDueDate = new Date(
          renewalStartDate.getFullYear(),
          renewalStartDate.getMonth(),
          billingDueDay
        );
      } else {
        firstDueDate = new Date(
          renewalStartDate.getFullYear(),
          renewalStartDate.getMonth() + 1,
          billingDueDay
        );
      }

      // Adjust to business day
      const adjustToBusinessDay = (date: Date): Date => {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 6) {
          date.setDate(date.getDate() + 2);
        } else if (dayOfWeek === 0) {
          date.setDate(date.getDate() + 1);
        }
        return date;
      };

      firstDueDate = adjustToBusinessDay(firstDueDate);

      // Find the max installment number for this contract to continue numbering
      const { data: existingInstallments } = await supabase
        .from("guarantee_installments")
        .select("installment_number")
        .eq("contract_id", contract_id)
        .order("installment_number", { ascending: false })
        .limit(1);

      const startingNumber = existingInstallments && existingInstallments.length > 0 
        ? existingInstallments[0].installment_number + 1 
        : 1;

      // Generate 12 new installments
      const installments: InstallmentData[] = [];
      
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const adjustedDueDate = adjustToBusinessDay(new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          billingDueDay
        ));

        installments.push({
          contract_id: contract.id,
          agency_id: contract.agency_id,
          installment_number: startingNumber + i,
          reference_month: adjustedDueDate.getMonth() + 1,
          reference_year: adjustedDueDate.getFullYear(),
          value: valorParcela,
          due_date: adjustedDueDate.toISOString().split('T')[0],
          status: 'pendente'
        });
      }

      const { data: createdInstallments, error: insertError } = await supabase
        .from("guarantee_installments")
        .insert(installments)
        .select();

      if (insertError) {
        console.error("Error inserting renewal installments:", insertError);
        return new Response(
          JSON.stringify({ 
            success: true,
            warning: "Contract updated but failed to create installments",
            error_details: insertError 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Created ${createdInstallments?.length} renewal installments for contract ${contract_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Renewal processed with ${createdInstallments?.length} new installments`,
          new_end_date: newEndDate.toISOString().split('T')[0],
          installments_created: createdInstallments?.length,
          new_garantia_anual: garantiaAnual,
          new_valor_parcela: valorParcela
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For non-boleto_imobiliaria contracts, just return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Renewal processed successfully",
        new_end_date: newEndDate.toISOString().split('T')[0],
        payment_method: finalPaymentMethod
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in process-renewal-installments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
