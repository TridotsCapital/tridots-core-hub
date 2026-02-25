import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  invoiceAvailableTemplate,
  invoiceDueReminderTemplate,
  invoiceOverdueTemplate,
  preBlockingAlertTemplate,
  blockingConfirmationTemplate,
  boletoUploadedTemplate,
  sendEmail,
  LOGO_BASE64
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceNotificationRequest {
  invoiceId: string;
  agencyId: string;
  notificationType: 'invoice_available' | 'due_reminder' | 'overdue' | 'pre_blocking' | 'blocking_confirmation' | 'boleto_uploaded';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { invoiceId, agencyId, notificationType }: InvoiceNotificationRequest = await req.json();

    console.log(`[send-invoice-notification] Processing: invoice=${invoiceId}, type=${notificationType}`);

    // Buscar dados da fatura (include boleto fields for boleto_uploaded)
    const { data: invoice, error: invoiceError } = await supabase
      .from('agency_invoices')
      .select('id, reference_month, reference_year, total_value, due_date, status, boleto_url, boleto_barcode, boleto_observations')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice not found:", invoiceError);
      throw new Error('Fatura não encontrada');
    }

    // Buscar dados da agência
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, razao_social, nome_fantasia, email, responsavel_email, responsavel_nome, billing_blocked_at')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      console.error("Agency not found:", agencyError);
      throw new Error('Agência não encontrada');
    }

    // Determinar destinatário
    const recipientEmail = agency.responsavel_email || agency.email;
    const recipientName = agency.responsavel_nome || agency.nome_fantasia || agency.razao_social;

    if (!recipientEmail) {
      console.log("No recipient email found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No recipient email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatar datas
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const invoiceMonth = months[invoice.reference_month - 1] || `Mês ${invoice.reference_month}`;
    const dueDate = new Date(invoice.due_date).toLocaleDateString('pt-BR');
    
    // Calcular dias até/em atraso
    const today = new Date();
    const dueDateObj = new Date(invoice.due_date);
    const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.abs(daysUntilDue);

    // Buscar valor total em atraso para notificações de bloqueio
    let totalOverdueValue = 0;
    if (notificationType === 'pre_blocking' || notificationType === 'blocking_confirmation') {
      const { data: overdueInvoices } = await supabase
        .from('agency_invoices')
        .select('total_value')
        .eq('agency_id', agencyId)
        .eq('status', 'atrasada');
      
      totalOverdueValue = overdueInvoices?.reduce((sum, inv) => sum + (inv.total_value || 0), 0) || 0;
    }

    // Generate signed URL for boleto_uploaded
    let boletoSignedUrl: string | null = null;
    if (notificationType === 'boleto_uploaded' && invoice.boleto_url) {
      try {
        const url = invoice.boleto_url as string;
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/invoices\/(.*)/);
        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          const { data: signedData, error: signedError } = await supabase.storage
            .from('invoices')
            .createSignedUrl(filePath, 86400); // 24h
          if (!signedError && signedData?.signedUrl) {
            boletoSignedUrl = signedData.signedUrl;
          }
        }
      } catch (e) {
        console.error("Failed to generate signed URL:", e);
      }
    }

    let template;
    switch (notificationType) {
      case 'invoice_available':
        template = invoiceAvailableTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          invoiceMonth,
          invoiceYear: invoice.reference_year,
          totalValue: invoice.total_value,
          dueDate
        });
        break;

      case 'due_reminder':
        template = invoiceDueReminderTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          invoiceMonth,
          invoiceYear: invoice.reference_year,
          totalValue: invoice.total_value,
          dueDate,
          daysUntilDue: Math.max(1, daysUntilDue)
        });
        break;

      case 'overdue':
        template = invoiceOverdueTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          invoiceMonth,
          invoiceYear: invoice.reference_year,
          totalValue: invoice.total_value,
          dueDate,
          daysOverdue
        });
        break;

      case 'pre_blocking':
        template = preBlockingAlertTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          hoursUntilBlock: 48,
          totalOverdueValue
        });
        break;

      case 'blocking_confirmation':
        const blockedDate = new Date().toLocaleDateString('pt-BR');
        template = blockingConfirmationTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          blockedDate,
          totalOverdueValue
        });
        break;

      case 'boleto_uploaded':
        template = boletoUploadedTemplate({
          agencyName: agency.nome_fantasia || agency.razao_social,
          invoiceMonth,
          invoiceYear: invoice.reference_year,
          totalValue: invoice.total_value,
          dueDate,
          boletoUrl: boletoSignedUrl || invoice.boleto_url || '',
          observations: invoice.boleto_observations || undefined,
        });
        break;

      default:
        throw new Error('Tipo de notificação inválido');
    }

    // Enviar e-mail
    console.log(`Sending email to ${recipientEmail}`);
    const result = await sendEmail(
      resendApiKey,
      recipientEmail,
      template.subject,
      template.html,
      [{
        filename: 'tridots-logo.png',
        content: LOGO_BASE64,
      }]
    );

    if (!result.success) {
      console.error(`Failed to send email: ${result.error}`);
      throw new Error(result.error);
    }

    // Registrar na tabela de logs de e-mail
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: recipientEmail,
        subject: template.subject,
        template_type: `invoice_${notificationType}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          invoiceId,
          agencyId,
          invoiceMonth,
          invoiceYear: invoice.reference_year,
          totalValue: invoice.total_value
        }
      });

    // Criar notificação in-app para usuários Tridots
    await supabase.rpc('create_email_sent_notification', {
      p_template_type: `invoice_${notificationType}`,
      p_recipient_email: recipientEmail,
      p_recipient_name: recipientName,
      p_reference_id: invoiceId,
      p_success: true
    });

    // For boleto_uploaded, also create in-app notifications for agency users
    if (notificationType === 'boleto_uploaded') {
      const monthStr = String(invoice.reference_month).padStart(2, '0');
      const { data: agencyUsers } = await supabase
        .from('agency_users')
        .select('user_id')
        .eq('agency_id', agencyId);

      if (agencyUsers && agencyUsers.length > 0) {
        const notifications = agencyUsers.map((au) => ({
          user_id: au.user_id,
          ticket_id: invoiceId, // using ticket_id field as reference
          type: 'boleto_available' as const,
          title: 'Boleto disponível',
          message: `O boleto da fatura de ${monthStr}/${invoice.reference_year} está disponível para download`,
        }));

        await supabase.from('ticket_notifications').insert(notifications);
      }
    }

    console.log(`[send-invoice-notification] Success for invoice ${invoiceId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso',
        notificationType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-invoice-notification] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
