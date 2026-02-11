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
          id,
          garantia_anual,
          inquilino_nome,
          imovel_endereco,
          imovel_numero,
          imovel_bairro,
          imovel_cidade
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

    let firstMonth: number;
    let firstYear: number;
    
    if (activationDay < billingDueDay) {
      // Primeira parcela no mesmo mês
      firstMonth = activationDate.getMonth();
      firstYear = activationDate.getFullYear();
    } else {
      // Primeira parcela no próximo mês
      firstMonth = activationDate.getMonth() + 1;
      firstYear = activationDate.getFullYear();
      if (firstMonth > 11) {
        firstMonth = 0;
        firstYear++;
      }
    }

    // 7. Gerar as 12 parcelas (SEM ajuste de dia útil conforme regra de negócio)
    const installments: InstallmentData[] = [];
    
    for (let i = 0; i < 12; i++) {
      let m = firstMonth + i;
      let y = firstYear;
      while (m > 11) {
        m -= 12;
        y++;
      }

      const dueDate = new Date(y, m, billingDueDay);
      const refMonth = m + 1; // 1-12
      const refYear = y;

      installments.push({
        contract_id: contract.id,
        agency_id: contract.agency_id,
        installment_number: i + 1,
        reference_month: refMonth,
        reference_year: refYear,
        value: valorParcela,
        due_date: dueDate.toISOString().split('T')[0],
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

    // 9. CRIAR FATURAS AUTOMATICAMENTE para cada parcela
    const analysis = contract.analysis;
    const tenantName = analysis?.inquilino_nome || "N/A";
    const propertyAddress = [
      analysis?.imovel_endereco,
      analysis?.imovel_numero,
      analysis?.imovel_bairro,
      analysis?.imovel_cidade
    ].filter(Boolean).join(", ") || "N/A";

    const invoicesCreated: string[] = [];
    const invoicesUpdated: string[] = [];

    for (const installment of createdInstallments || []) {
      try {
        // Verificar se já existe fatura para este mês/ano/agência
        const { data: existingInvoice } = await supabase
          .from("agency_invoices")
          .select("id, total_value")
          .eq("agency_id", contract.agency_id)
          .eq("reference_month", installment.reference_month)
          .eq("reference_year", installment.reference_year)
          .neq("status", "cancelada")
          .maybeSingle();

        let invoiceId: string;

        if (existingInvoice) {
          // Fatura já existe: atualizar total_value
          invoiceId = existingInvoice.id;
          const newTotal = (existingInvoice.total_value || 0) + installment.value;

          await supabase
            .from("agency_invoices")
            .update({ 
              total_value: newTotal,
              updated_at: new Date().toISOString()
            })
            .eq("id", invoiceId);

          invoicesUpdated.push(invoiceId);
        } else {
          // Criar nova fatura
          const dueDate = new Date(
            installment.reference_year,
            installment.reference_month - 1,
            billingDueDay
          );

          const { data: newInvoice, error: invoiceError } = await supabase
            .from("agency_invoices")
            .insert({
              agency_id: contract.agency_id,
              reference_month: installment.reference_month,
              reference_year: installment.reference_year,
              status: "rascunho",
              total_value: installment.value,
              due_date: dueDate.toISOString().split('T')[0]
            })
            .select()
            .single();

          if (invoiceError) {
            console.error(`Error creating invoice for ${installment.reference_month}/${installment.reference_year}:`, invoiceError);
            continue;
          }

          invoiceId = newInvoice.id;
          invoicesCreated.push(invoiceId);

          // Registrar evento na timeline
          await supabase
            .from("invoice_timeline")
            .insert({
              invoice_id: invoiceId,
              event_type: "created",
              description: `Fatura ${String(installment.reference_month).padStart(2, '0')}/${installment.reference_year} criada automaticamente na ativação do contrato`
            });
        }

        // Criar invoice_item vinculando parcela à fatura
        const { data: invoiceItem, error: itemError } = await supabase
          .from("invoice_items")
          .insert({
            invoice_id: invoiceId,
            installment_id: installment.id,
            contract_id: contract.id,
            tenant_name: tenantName,
            property_address: propertyAddress,
            installment_number: installment.installment_number,
            value: installment.value
          })
          .select()
          .single();

        if (itemError) {
          console.error(`Error creating invoice item for installment ${installment.id}:`, itemError);
          continue;
        }

        // Atualizar parcela para "faturada" com vínculo ao invoice_item
        await supabase
          .from("guarantee_installments")
          .update({
            status: "faturada",
            invoice_item_id: invoiceItem.id
          })
          .eq("id", installment.id);

      } catch (invoiceErr) {
        console.error(`Error processing invoice for installment ${installment.id}:`, invoiceErr);
      }
    }

    console.log(`Invoices created: ${invoicesCreated.length}, updated: ${invoicesUpdated.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdInstallments?.length} installments, ${invoicesCreated.length} new invoices, ${invoicesUpdated.length} invoices updated`,
        installments: createdInstallments,
        invoicesCreated,
        invoicesUpdated
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
