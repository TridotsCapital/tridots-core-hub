import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  invoiceId?: string;
  month?: number;
  year?: number;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ─────────────────────────────────────────────────────────────────
    // AUTH GUARD — TR-AUTH-003 fix (mesma família do TR-AUTH-002 em PDF)
    // ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();
    const isMaster = callerRole?.role === "master";

    let allowedAgencyIds: string[] | null = null;
    if (!isMaster) {
      const { data: links } = await supabase
        .from("agency_users")
        .select("agency_id")
        .eq("user_id", caller.id);
      allowedAgencyIds = (links ?? []).map((l: { agency_id: string }) => l.agency_id);
      if (allowedAgencyIds.length === 0) {
        return new Response(
          JSON.stringify({ error: "Forbidden: caller has no agency link" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────

    const { invoiceId, month, year, startMonth, startYear, endMonth, endYear }: ExportRequest = await req.json();

    console.log("[generate-invoice-excel] caller=", caller.id, "isMaster=", isMaster);

    // Build query based on parameters
    let query = supabase
      .from('agency_invoices')
      .select(`
        id,
        reference_month,
        reference_year,
        total_value,
        due_date,
        status,
        agency:agencies(
          id,
          razao_social,
          nome_fantasia,
          cnpj,
          email,
          responsavel_nome,
          responsavel_email
        )
      `);

    if (invoiceId) {
      query = query.eq('id', invoiceId);
    } else if (month && year) {
      query = query.eq('reference_month', month).eq('reference_year', year);
    } else if (startMonth && startYear && endMonth && endYear) {
      // Range query
      query = query
        .or(
          `and(reference_year.eq.${startYear},reference_month.gte.${startMonth}),and(reference_year.gt.${startYear},reference_year.lt.${endYear}),and(reference_year.eq.${endYear},reference_month.lte.${endMonth})`
        );
    }

    // Tenant guard
    if (allowedAgencyIds) {
      query = query.in("agency_id", allowedAgencyIds);
    }

    const { data: invoices, error: invoiceError } = await query;

    if (invoiceError || !invoices || invoices.length === 0) {
      console.error("No invoices found:", invoiceError);
      throw new Error('Nenhuma fatura encontrada para os parâmetros fornecidos');
    }

    // Generate CSV (Excel-compatible)
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    let csv = 'ID da Fatura,Período,Agência,CNPJ,Valor Total,Data Vencimento,Status\n';

    for (const invoice of invoices) {
      const agency = invoice.agency as any;
      const monthName = months[invoice.reference_month - 1];
      const dueDate = new Date(invoice.due_date).toLocaleDateString('pt-BR');
      const statusLabel = invoice.status === 'gerada' ? 'Gerada' : 
                         invoice.status === 'enviada' ? 'Enviada' : 
                         invoice.status === 'paga' ? 'Paga' : 'Atrasada';

      csv += `"${invoice.id.substring(0, 8)}","${monthName}/${invoice.reference_year}","${agency.nome_fantasia || agency.razao_social}","${agency.cnpj}","R$ ${(invoice.total_value / 100).toFixed(2)}","${dueDate}","${statusLabel}"\n`;
    }

    // Return as base64-encoded CSV (can be opened as Excel)
    const csvBase64 = btoa(unescape(encodeURIComponent(csv)));
    const fileName = invoiceId 
      ? `fatura_${months[invoices[0].reference_month - 1].toLowerCase()}_${invoices[0].reference_year}.csv`
      : month && year
      ? `faturas_${months[month - 1].toLowerCase()}_${year}.csv`
      : `faturas_${startMonth}_${startYear}_a_${endMonth}_${endYear}.csv`;

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: `data:text/csv;charset=utf-8;base64,${csvBase64}`,
        fileName: fileName,
        rowCount: invoices.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-invoice-excel] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
