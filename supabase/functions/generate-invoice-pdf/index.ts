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

    const { invoiceId, month, year, startMonth, startYear, endMonth, endYear }: ExportRequest = await req.json();

    console.log("[generate-invoice-pdf] Processing export request");

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
      // Range query - fetch all invoices in range
      query = query
        .or(
          `and(reference_year.eq.${startYear},reference_month.gte.${startMonth}),and(reference_year.gt.${startYear},reference_year.lt.${endYear}),and(reference_year.eq.${endYear},reference_month.lte.${endMonth})`
        );
    }

    const { data: invoices, error: invoiceError } = await query;

    if (invoiceError || !invoices || invoices.length === 0) {
      console.error("No invoices found:", invoiceError);
      throw new Error('Nenhuma fatura encontrada para os parâmetros fornecidos');
    }

    // For single invoice: generate PDF
    if (invoiceId && invoices.length === 1) {
      const invoice = invoices[0];
      const agency = invoice.agency as any;

      // Build PDF HTML (simplified - you'll want to enhance this)
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthName = months[invoice.reference_month - 1];

      const pdfHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - ${monthName}/${invoice.reference_year}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { border-bottom: 2px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #1a1a2e; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; }
    .info-box p { margin: 5px 0; }
    .invoice-details { margin: 30px 0; }
    .invoice-table { width: 100%; border-collapse: collapse; }
    .invoice-table th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
    .invoice-table td { border: 1px solid #ddd; padding: 10px; }
    .total-row { font-weight: bold; background-color: #f9f9f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TRIDOTS CAPITAL</h1>
    <p>A garantia locatícia mais segura e completa do Brasil</p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Fatura</h3>
      <p><strong>${monthName}/${invoice.reference_year}</strong></p>
      <p>ID: ${invoice.id.substring(0, 8).toUpperCase()}</p>
    </div>
    <div class="info-box">
      <h3>Imobiliária</h3>
      <p><strong>${agency.nome_fantasia || agency.razao_social}</strong></p>
      <p>CNPJ: ${agency.cnpj}</p>
    </div>
  </div>

  <div class="invoice-details">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th style="text-align: right; width: 150px;">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Fatura Consolidada de Garantias - ${monthName}/${invoice.reference_year}</td>
          <td style="text-align: right;">R$ ${(invoice.total_value / 100).toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>TOTAL A PAGAR</td>
          <td style="text-align: right;">R$ ${(invoice.total_value / 100).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="invoice-details">
    <h3>Informações de Pagamento</h3>
    <p><strong>Data de Vencimento:</strong> ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}</p>
    <p><strong>Status:</strong> ${invoice.status === 'gerada' ? 'Gerada' : invoice.status === 'enviada' ? 'Enviada' : invoice.status === 'paga' ? 'Paga' : 'Atrasada'}</p>
  </div>

  <div class="footer">
    <p>Este é um documento eletrônico gerado automaticamente pelo sistema Tridots Capital</p>
    <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>
</body>
</html>
      `;

      // For now, return HTML as base64 (in production, use a PDF library)
      // Using a workaround: return the HTML as a downloadable file
      const fileName = `fatura_${monthName.toLowerCase()}_${invoice.reference_year}.pdf`;
      const htmlBase64 = btoa(unescape(encodeURIComponent(pdfHtml)));

      return new Response(
        JSON.stringify({
          success: true,
          downloadUrl: `data:application/octet-stream;base64,${htmlBase64}`,
          fileName: fileName,
          data: pdfHtml
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For multiple invoices: return summary
      throw new Error('Relatório multi-fatura ainda não implementado. Use exportação individual.');
    }

  } catch (error) {
    console.error("[generate-invoice-pdf] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
