import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * FALLBACK DE SEGURANÇA: Esta função agora serve como verificação de consistência.
 * O fluxo principal de criação de faturas acontece em generate-installments
 * (na ativação do contrato). Esta função apenas verifica e corrige parcelas
 * que por algum motivo não foram faturadas corretamente.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const backfillAll = body.backfill_all === true;
    const targetMonth = body.reference_month || body.month || new Date().getMonth() + 1;
    const targetYear = body.reference_year || body.year || new Date().getFullYear();
    const specificAgencyId = body.agency_id;

    console.log(backfillAll 
      ? `[BACKFILL] Processing ALL orphan installments across all months`
      : `[FALLBACK] Checking unfactured installments for ${targetMonth}/${targetYear}`);

    // Buscar parcelas pendentes que NÃO estão vinculadas a nenhuma fatura
    let query = supabase
      .from("guarantee_installments")
      .select(`
        id,
        contract_id,
        agency_id,
        installment_number,
        value,
        due_date,
        reference_month,
        reference_year,
        contract:contracts!guarantee_installments_contract_id_fkey (
          id,
          analysis:analyses!contracts_analysis_id_fkey (
            inquilino_nome,
            imovel_endereco,
            imovel_numero,
            imovel_bairro,
            imovel_cidade
          )
        )
      `)
      .in("status", ["pendente", "faturada"])
      .is("invoice_item_id", null);

    // Only filter by month/year if NOT backfilling all
    if (!backfillAll) {
      query = query.eq("reference_month", targetMonth).eq("reference_year", targetYear);
    }

    if (specificAgencyId) {
      query = query.eq("agency_id", specificAgencyId);
    }

    const { data: orphanInstallments, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching orphan installments:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch installments" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!orphanInstallments || orphanInstallments.length === 0) {
      console.log("[FALLBACK] No orphan installments found. All good.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No orphan installments found",
          invoices_created: 0,
          agencies_processed: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[FALLBACK] Found ${orphanInstallments.length} orphan installments to fix`);

    // Agrupar por agency_id + month/year
    const byAgencyMonth = new Map<string, typeof orphanInstallments>();
    for (const inst of orphanInstallments) {
      const key = `${inst.agency_id}__${inst.reference_month}__${inst.reference_year}`;
      const list = byAgencyMonth.get(key) || [];
      list.push(inst);
      byAgencyMonth.set(key, list);
    }

    let invoicesCreated = 0;
    let invoicesUpdated = 0;

    // Cache billing_due_day per agency
    const agencyBillingCache = new Map<string, number>();

    for (const [key, installments] of byAgencyMonth) {
      const [agencyId, refMonthStr, refYearStr] = key.split("__");
      const refMonth = parseInt(refMonthStr);
      const refYear = parseInt(refYearStr);

      // Buscar billing_due_day (cached)
      if (!agencyBillingCache.has(agencyId)) {
        const { data: agency } = await supabase
          .from("agencies")
          .select("billing_due_day")
          .eq("id", agencyId)
          .single();
        agencyBillingCache.set(agencyId, agency?.billing_due_day || 10);
      }
      const billingDueDay = agencyBillingCache.get(agencyId)!;

      // Verificar se já existe fatura para este mês
      const { data: existingInvoice } = await supabase
        .from("agency_invoices")
        .select("id, total_value")
        .eq("agency_id", agencyId)
        .eq("reference_month", refMonth)
        .eq("reference_year", refYear)
        .neq("status", "cancelada")
        .maybeSingle();

      let invoiceId: string;

      if (existingInvoice) {
        invoiceId = existingInvoice.id;
        const additionalValue = installments.reduce((sum, i) => sum + (i.value || 0), 0);
        await supabase
          .from("agency_invoices")
          .update({ 
            total_value: (existingInvoice.total_value || 0) + additionalValue,
            updated_at: new Date().toISOString()
          })
          .eq("id", invoiceId);
        invoicesUpdated++;
      } else {
        const totalValue = installments.reduce((sum, i) => sum + (i.value || 0), 0);
        const dueDate = new Date(refYear, refMonth - 1, billingDueDay);

        const { data: newInvoice, error: invoiceError } = await supabase
          .from("agency_invoices")
          .insert({
            agency_id: agencyId,
            reference_month: refMonth,
            reference_year: refYear,
            status: "rascunho",
            total_value: totalValue,
            due_date: dueDate.toISOString().split('T')[0]
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`[BACKFILL] Error creating invoice for agency ${agencyId} ${refMonth}/${refYear}:`, invoiceError);
          continue;
        }

        invoiceId = newInvoice.id;
        invoicesCreated++;

        await supabase
          .from("invoice_timeline")
          .insert({
            invoice_id: invoiceId,
            event_type: "created",
            description: `[BACKFILL] Fatura ${String(refMonth).padStart(2, '0')}/${refYear} criada pela verificação de consistência com ${installments.length} parcela(s) órfã(s)`
          });
      }

      // Criar invoice_items e vincular parcelas
      for (const inst of installments) {
        const analysis = inst.contract?.analysis;
        const address = [
          analysis?.imovel_endereco,
          analysis?.imovel_numero,
          analysis?.imovel_bairro,
          analysis?.imovel_cidade
        ].filter(Boolean).join(", ");

        const { data: invoiceItem, error: itemError } = await supabase
          .from("invoice_items")
          .insert({
            invoice_id: invoiceId,
            installment_id: inst.id,
            contract_id: inst.contract_id,
            tenant_name: analysis?.inquilino_nome || "N/A",
            property_address: address || "N/A",
            installment_number: inst.installment_number,
            value: inst.value
          })
          .select()
          .single();

        if (itemError) {
          console.error(`[FALLBACK] Error creating invoice item:`, itemError);
          continue;
        }

        await supabase
          .from("guarantee_installments")
          .update({
            status: "faturada",
            invoice_item_id: invoiceItem.id
          })
          .eq("id", inst.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: backfillAll ? "backfill_all" : "single_month",
        reference: backfillAll ? "all" : `${targetMonth}/${targetYear}`,
        groups_processed: byAgencyMonth.size,
        invoices_created: invoicesCreated,
        invoices_updated: invoicesUpdated,
        orphan_installments_fixed: orphanInstallments.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[FALLBACK] Error in generate-invoice-drafts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
