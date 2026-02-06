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

    const { contract_id } = await req.json();

    if (!contract_id) {
      return new Response(
        JSON.stringify({ error: "contract_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar dados do contrato e análise
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        id,
        agency_id,
        activated_at,
        payment_method,
        analysis:analyses!contracts_analysis_id_fkey (
          garantia_anual
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

    // 2. Verificar se é boleto_imobiliaria
    if (contract.payment_method !== 'boleto_imobiliaria') {
      return new Response(
        JSON.stringify({ error: "Contract is not boleto_imobiliaria", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Buscar billing_due_day da agência
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("billing_due_day")
      .eq("id", contract.agency_id)
      .single();

    if (agencyError || !agency?.billing_due_day) {
      console.error("Agency billing_due_day not configured:", agencyError);
      return new Response(
        JSON.stringify({ error: "Agency billing_due_day not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Verificar se já existem parcelas
    const { count } = await supabase
      .from("guarantee_installments")
      .select("*", { count: "exact", head: true })
      .eq("contract_id", contract_id);

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ error: "Installments already exist for this contract", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Calcular valor de cada parcela
    const garantiaAnual = contract.analysis?.garantia_anual || 0;
    const valorParcela = garantiaAnual / 12;

    // 6. Calcular primeira data de vencimento usando regra de corte
    const activationDate = new Date(contract.activated_at || new Date());
    const billingDueDay = agency.billing_due_day;
    const activationDay = activationDate.getDate();

    let firstDueDate: Date;
    if (activationDay < billingDueDay) {
      // Primeira parcela no mesmo mês
      firstDueDate = new Date(
        activationDate.getFullYear(),
        activationDate.getMonth(),
        billingDueDay
      );
    } else {
      // Primeira parcela no próximo mês
      firstDueDate = new Date(
        activationDate.getFullYear(),
        activationDate.getMonth() + 1,
        billingDueDay
      );
    }

    // Ajustar para próximo dia útil se cair em fim de semana
    const adjustToBusinessDay = (date: Date): Date => {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 6) { // Sábado
        date.setDate(date.getDate() + 2);
      } else if (dayOfWeek === 0) { // Domingo
        date.setDate(date.getDate() + 1);
      }
      return date;
    };

    firstDueDate = adjustToBusinessDay(firstDueDate);

    // 7. Gerar as 12 parcelas
    const installments: InstallmentData[] = [];
    
    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      // Recalcular dia útil para cada mês
      const adjustedDueDate = adjustToBusinessDay(new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        billingDueDay
      ));

      installments.push({
        contract_id: contract.id,
        agency_id: contract.agency_id,
        installment_number: i + 1,
        reference_month: adjustedDueDate.getMonth() + 1, // 1-12
        reference_year: adjustedDueDate.getFullYear(),
        value: valorParcela,
        due_date: adjustedDueDate.toISOString().split('T')[0],
        status: 'pendente'
      });
    }

    // 8. Inserir parcelas no banco
    const { data: createdInstallments, error: insertError } = await supabase
      .from("guarantee_installments")
      .insert(installments)
      .select();

    if (insertError) {
      console.error("Error inserting installments:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create installments", details: insertError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created ${createdInstallments?.length} installments for contract ${contract_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdInstallments?.length} installments`,
        installments: createdInstallments
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-installments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
