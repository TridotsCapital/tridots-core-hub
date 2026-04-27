import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ticketNotificationTemplate, sendEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  ticket_id: string;
  message_id?: string;
  event_type: 'new_ticket' | 'new_reply';
  direction?: 'tridots_to_agency' | 'agency_to_tridots'; // added for bidirectional support
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const body: NotificationRequest = await req.json();
    const { ticket_id, message_id, event_type, direction } = body;
    
    // Default direction to tridots_to_agency if not specified (legacy behavior)
    const notificationDirection = direction || 'tridots_to_agency';

    // Buscar dados do ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        subject,
        agency_id,
        assigned_to
      `)
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket not found:", ticketError);
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o ticket pertence a uma imobiliária
    if (!ticket.agency_id) {
      console.log("Ticket does not belong to an agency, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No agency associated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados da imobiliária separadamente
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, razao_social, nome_fantasia, responsavel_email, responsavel_nome')
      .eq('id', ticket.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error("Agency not found:", agencyError);
      return new Response(
        JSON.stringify({ error: "Agency not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar prévia da mensagem (se for nova resposta)
    let messagePreview: string | undefined;
    if (event_type === 'new_reply' && message_id) {
      const { data: message } = await supabase
        .from('ticket_messages')
        .select('content')
        .eq('id', message_id)
        .single();
      
      if (message?.content) {
        messagePreview = message.content;
      }
    }

    // Collect recipients based on notification direction
    const recipients: { email: string; name: string; user_id?: string }[] = [];

    if (notificationDirection === 'tridots_to_agency') {
      // Notify agency: all agency_users + responsavel_email
      // 1. Fetch all agency users with their emails
      const { data: agencyUsers } = await supabase
        .from('agency_users')
        .select('user_id')
        .eq('agency_id', ticket.agency_id);

      const agencyUserIds = agencyUsers?.map(u => u.user_id) || [];
      const agencyEmails = new Set<string>();

      if (agencyUserIds.length > 0) {
        const { data: agencyProfiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', agencyUserIds);

        if (agencyProfiles) {
          for (const profile of agencyProfiles) {
            if (profile.email) {
              agencyEmails.add(profile.email);
              recipients.push({
                email: profile.email,
                name: profile.full_name || 'Colaborador',
                user_id: profile.id
              });
            }
          }
        }
      }

      // 2. E-mail principal da imobiliária (se não já incluído via agency_users)
      if (agency.responsavel_email && !agencyEmails.has(agency.responsavel_email)) {
        recipients.push({
          email: agency.responsavel_email,
          name: agency.responsavel_nome || agency.nome_fantasia || agency.razao_social
        });
      }
    } else if (notificationDirection === 'agency_to_tridots') {
      // Notify GarantFácil: all active master/analyst users
      // First get user_ids from user_roles table (roles are NOT stored in profiles)
      const { data: roleEntries } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['master', 'analyst']);

      const tridotsUserIds = roleEntries?.map(r => r.user_id) || [];

      const { data: tridotsUsers } = tridotsUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', tridotsUserIds)
            .eq('active', true)
        : { data: [] };

      if (tridotsUsers) {
        for (const user of tridotsUsers) {
          if (user.email) {
            recipients.push({
              email: user.email,
              name: user.full_name || 'GarantFácil Team',
              user_id: user.id
            });
          }
        }
      }
    }

    if (recipients.length === 0) {
      console.log("No recipients found for notification");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construir URL do portal
    const portalUrl = `${supabaseUrl.replace('.supabase.co', '')}.lovable.app/${agency.id}/support`;

    // Enviar e-mails
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      const template = ticketNotificationTemplate({
        agencyName: agency.nome_fantasia || agency.razao_social,
        recipientName: recipient.name,
        ticketProtocol: ticket.id.slice(0, 8).toUpperCase(),
        ticketSubject: ticket.subject || 'Sem assunto',
        eventType: event_type,
        messagePreview,
        portalUrl
      });

      console.log(`Sending email to ${recipient.email}`);

      const result = await sendEmail(
        resendApiKey,
        recipient.email,
        template.subject,
        template.html
      );

      results.push({
        email: recipient.email,
        success: result.success,
        error: result.error
      });

      // In-app notifications are handled by database triggers
      // (create_new_ticket_notification / create_ticket_message_notification)
      // This edge function only handles EMAIL delivery

      if (!result.success) {
        console.error(`Failed to send email to ${recipient.email}:`, result.error);
      }
    }

    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-ticket-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
