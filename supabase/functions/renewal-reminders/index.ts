import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Days before expiration to send reminders
const REMINDER_DAYS = [30, 15, 10, 5, 2];

interface Contract {
  id: string;
  agency_id: string;
  data_fim_contrato: string;
  analysis: {
    inquilino_nome: string;
    inquilino_email: string | null;
    imovel_endereco: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting renewal reminders check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = {
      processed: 0,
      reminders_sent: 0,
      errors: [] as string[],
    };

    // Check each reminder threshold
    for (const days of REMINDER_DAYS) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      console.log(`Checking contracts expiring on ${targetDateStr} (${days} days from now)...`);

      // Find contracts expiring on this date that don't have an approved renewal
      const { data: contracts, error: fetchError } = await supabase
        .from('contracts')
        .select(`
          id,
          agency_id,
          data_fim_contrato,
          analysis:analyses!contracts_analysis_id_fkey (
            inquilino_nome,
            inquilino_email,
            imovel_endereco
          )
        `)
        .eq('status', 'ativo')
        .eq('data_fim_contrato', targetDateStr);

      if (fetchError) {
        console.error('Error fetching contracts:', fetchError);
        results.errors.push(`Fetch error for ${days} days: ${fetchError.message}`);
        continue;
      }

      if (!contracts || contracts.length === 0) {
        console.log(`No contracts expiring in ${days} days`);
        continue;
      }

      console.log(`Found ${contracts.length} contracts expiring in ${days} days`);

      for (const contract of contracts as unknown as Contract[]) {
        results.processed++;

        // Check if there's already an approved renewal for this contract
        const { data: existingRenewal } = await supabase
          .from('contract_renewals')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('status', 'approved')
          .gt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existingRenewal) {
          console.log(`Contract ${contract.id} already has an approved renewal, skipping...`);
          continue;
        }

        // Get agency users to notify
        const { data: agencyUsers } = await supabase
          .from('agency_users')
          .select('user_id')
          .eq('agency_id', contract.agency_id);

        if (!agencyUsers || agencyUsers.length === 0) {
          console.log(`No agency users found for contract ${contract.id}`);
          continue;
        }

        // Create in-app notifications for all agency users
        const notifications = agencyUsers.map(user => ({
          user_id: user.user_id,
          type: 'renewal_reminder',
          source: 'contratos',
          reference_id: contract.id,
          title: `Contrato expira em ${days} dias`,
          message: `O contrato de ${contract.analysis?.inquilino_nome || 'inquilino'} expira em ${days} dias. Considere solicitar renovação.`,
          metadata: {
            contract_id: contract.id,
            days_until_expiration: days,
            tenant_name: contract.analysis?.inquilino_nome,
            data_fim_contrato: contract.data_fim_contrato,
          },
        }));

        const { error: notifyError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifyError) {
          console.error(`Error creating notifications for contract ${contract.id}:`, notifyError);
          results.errors.push(`Notification error for ${contract.id}: ${notifyError.message}`);
          continue;
        }

        results.reminders_sent++;
        console.log(`Created ${notifications.length} reminders for contract ${contract.id}`);

        // Send email notification if Resend is configured and tenant has email
        if (resendApiKey && contract.analysis?.inquilino_email) {
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "Tridots <noreply@tridots.com.br>",
                to: [contract.analysis.inquilino_email],
                subject: `Seu contrato expira em ${days} dias`,
                html: `
                  <h2>Olá, ${contract.analysis.inquilino_nome}!</h2>
                  <p>Gostaríamos de informar que seu contrato de locação expira em <strong>${days} dias</strong>.</p>
                  <p><strong>Imóvel:</strong> ${contract.analysis.imovel_endereco}</p>
                  <p><strong>Data de vencimento:</strong> ${new Date(contract.data_fim_contrato).toLocaleDateString('pt-BR')}</p>
                  <p>Entre em contato com sua imobiliária para discutir a renovação do contrato.</p>
                  <br>
                  <p>Atenciosamente,<br>Equipe Tridots</p>
                `,
              }),
            });

            if (!emailResponse.ok) {
              console.error(`Failed to send email for contract ${contract.id}`);
            } else {
              console.log(`Email sent to tenant for contract ${contract.id}`);
            }
          } catch (emailError) {
            console.error(`Email error for contract ${contract.id}:`, emailError);
          }
        }
      }
    }

    console.log("Renewal reminders check completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in renewal reminders:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
