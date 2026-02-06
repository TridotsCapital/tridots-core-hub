import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  invoice_id: string;
  installment_id: string;
  contract_id: string;
  tenant_name: string;
  property_address: string;
  installment_number: number;
  value: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parâmetros opcionais para rodar manualmente para um mês específico
    const body = await req.json().catch(() => ({}));
    const targetMonth = body.month || new Date().getMonth() + 1; // 1-12
    const targetYear = body.year || new Date().getFullYear();
    const specificAgencyId = body.agency_id; // Opcional: gerar só para uma imobiliária

    console.log(`Generating invoice drafts for ${targetMonth}/${targetYear}`);

    // 1. Buscar todas as agências que usam boleto unificado (têm billing_due_day configurado)
    let agenciesQuery = supabase
      .from("agencies")
      .select("id, razao_social, billing_due_day")
      .not("billing_due_day", "is", null)
      .eq("active", true);

    if (specificAgencyId) {
      agenciesQuery = agenciesQuery.eq("id", specificAgencyId);
    }

    const { data: agencies, error: agenciesError } = await agenciesQuery;

    if (agenciesError) {
      console.error("Error fetching agencies:", agenciesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch agencies" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!agencies || agencies.length === 0) {
      return new Response(
        JSON.stringify({ message: "No agencies with billing_due_day configured", invoices_created: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { agency_id: string; agency_name: string; invoice_id?: string; items_count: number; total: number; error?: string }[] = [];

    for (const agency of agencies) {
      try {
        // 2. Verificar se já existe fatura para este mês/ano/agência
        const { data: existingInvoice } = await supabase
          .from("agency_invoices")
          .select("id")
          .eq("agency_id", agency.id)
          .eq("reference_month", targetMonth)
          .eq("reference_year", targetYear)
          .neq("status", "cancelada")
          .maybeSingle();

        if (existingInvoice) {
          results.push({
            agency_id: agency.id,
            agency_name: agency.razao_social,
            invoice_id: existingInvoice.id,
            items_count: 0,
            total: 0,
            error: "Invoice already exists"
          });
          continue;
        }

        // 3. Buscar parcelas pendentes para o mês/ano
        const { data: installments, error: installmentsError } = await supabase
          .from("guarantee_installments")
          .select(`
            id,
            contract_id,
            installment_number,
            value,
            due_date,
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
          .eq("agency_id", agency.id)
          .eq("reference_month", targetMonth)
          .eq("reference_year", targetYear)
          .eq("status", "pendente");

        if (installmentsError) {
          console.error(`Error fetching installments for agency ${agency.id}:`, installmentsError);
          results.push({
            agency_id: agency.id,
            agency_name: agency.razao_social,
            items_count: 0,
            total: 0,
            error: installmentsError.message
          });
          continue;
        }

        // 4. Calcular data de vencimento
        const dueDate = new Date(targetYear, targetMonth - 1, agency.billing_due_day);
        
        // Ajustar para próximo dia útil se necessário
        const dayOfWeek = dueDate.getDay();
        if (dayOfWeek === 6) dueDate.setDate(dueDate.getDate() + 2);
        else if (dayOfWeek === 0) dueDate.setDate(dueDate.getDate() + 1);

        // 5. Calcular total
        const totalValue = installments?.reduce((sum, inst) => sum + (inst.value || 0), 0) || 0;

        // 6. Criar fatura (mesmo se zerada)
        const { data: invoice, error: invoiceError } = await supabase
          .from("agency_invoices")
          .insert({
            agency_id: agency.id,
            reference_month: targetMonth,
            reference_year: targetYear,
            status: "rascunho",
            total_value: totalValue,
            due_date: dueDate.toISOString().split('T')[0]
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`Error creating invoice for agency ${agency.id}:`, invoiceError);
          results.push({
            agency_id: agency.id,
            agency_name: agency.razao_social,
            items_count: 0,
            total: 0,
            error: invoiceError.message
          });
          continue;
        }

        // 7. Criar itens da fatura e atualizar parcelas
        if (installments && installments.length > 0) {
          const invoiceItems: InvoiceItem[] = installments.map(inst => {
            const analysis = inst.contract?.analysis;
            const address = [
              analysis?.imovel_endereco,
              analysis?.imovel_numero,
              analysis?.imovel_bairro,
              analysis?.imovel_cidade
            ].filter(Boolean).join(", ");

            return {
              invoice_id: invoice.id,
              installment_id: inst.id,
              contract_id: inst.contract_id,
              tenant_name: analysis?.inquilino_nome || "N/A",
              property_address: address || "N/A",
              installment_number: inst.installment_number,
              value: inst.value
            };
          });

          const { data: createdItems, error: itemsError } = await supabase
            .from("invoice_items")
            .insert(invoiceItems)
            .select();

          if (itemsError) {
            console.error(`Error creating invoice items for agency ${agency.id}:`, itemsError);
          }

          // 8. Atualizar status das parcelas para "faturada" e vincular ao item
          if (createdItems) {
            for (const item of createdItems) {
              await supabase
                .from("guarantee_installments")
                .update({
                  status: "faturada",
                  invoice_item_id: item.id
                })
                .eq("id", item.installment_id);
            }
          }
        }

        // 9. Registrar evento na timeline
        await supabase
          .from("invoice_timeline")
          .insert({
            invoice_id: invoice.id,
            event_type: "created",
            description: `Fatura ${targetMonth.toString().padStart(2, '0')}/${targetYear} criada automaticamente com ${installments?.length || 0} parcela(s)`
          });

        results.push({
          agency_id: agency.id,
          agency_name: agency.razao_social,
          invoice_id: invoice.id,
          items_count: installments?.length || 0,
          total: totalValue
        });

        console.log(`Created invoice for ${agency.razao_social}: ${invoice.id} with ${installments?.length || 0} items, total: ${totalValue}`);

      } catch (agencyError) {
        console.error(`Error processing agency ${agency.id}:`, agencyError);
        results.push({
          agency_id: agency.id,
          agency_name: agency.razao_social,
          items_count: 0,
          total: 0,
          error: agencyError.message
        });
      }
    }

    const successCount = results.filter(r => r.invoice_id && !r.error).length;

    return new Response(
      JSON.stringify({
        success: true,
        reference: `${targetMonth}/${targetYear}`,
        total_agencies: agencies.length,
        invoices_created: successCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-invoice-drafts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
