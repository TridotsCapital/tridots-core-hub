// Shared notification utilities for Edge Functions
// Eliminates boilerplate repeated across all send-* functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "./email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export { corsHeaders };

/**
 * Initialize Supabase client with service role key.
 * Returns client + common env vars.
 */
export function initNotificationContext() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const testEmail = Deno.env.get('TRIDOTS_NOTIFICATIONS_EMAIL') || 'testes@tridots.com.br';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  return { supabase, supabaseUrl, resendApiKey, testEmail };
}

/**
 * Validates that RESEND_API_KEY is configured.
 * Returns a Response if not configured, null otherwise.
 */
export function validateResendKey(resendApiKey: string | undefined): Response | null {
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'RESEND_API_KEY não configurada' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

/**
 * Log email send result to email_logs table and create in-app notification.
 */
export async function logEmailAndNotify(
  supabase: ReturnType<typeof createClient>,
  params: {
    recipientEmail: string;
    originalRecipient?: string | null;
    templateType: string;
    subject: string;
    success: boolean;
    metadata?: Record<string, unknown>;
    errorMessage?: string;
    referenceId: string;
    recipientName: string;
    testMode?: boolean;
    testEmail?: string;
  }
) {
  const finalRecipient = params.testMode ? (params.testEmail || params.recipientEmail) : params.recipientEmail;

  // Log to email_logs
  await supabase.from('email_logs').insert({
    recipient_email: finalRecipient,
    recipient_original: params.testMode ? params.recipientEmail : null,
    template_type: params.templateType,
    subject: params.subject,
    status: params.success ? 'sent' : 'failed',
    metadata: params.metadata || {},
    error_message: params.errorMessage || null,
    sent_at: params.success ? new Date().toISOString() : null,
  });

  // Create in-app notification for GarantFácil users
  await supabase.rpc('create_email_sent_notification', {
    p_template_type: params.templateType,
    p_recipient_email: finalRecipient,
    p_recipient_name: params.recipientName,
    p_reference_id: params.referenceId,
    p_success: params.success,
  });
}

/**
 * Send email using shared sendEmail + log + notify in one call.
 * Returns the sendEmail result.
 */
export async function sendAndLog(
  supabase: ReturnType<typeof createClient>,
  params: {
    resendApiKey: string;
    recipientEmail: string;
    subject: string;
    html: string;
    templateType: string;
    referenceId: string;
    recipientName: string;
    testMode?: boolean;
    testEmail?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const result = await sendEmail(
    params.resendApiKey,
    params.recipientEmail,
    params.subject,
    params.html,
    params.testMode || false,
    params.testEmail || 'testes@tridots.com.br'
  );

  await logEmailAndNotify(supabase, {
    recipientEmail: params.recipientEmail,
    templateType: params.templateType,
    subject: params.subject,
    success: result.success,
    metadata: params.metadata,
    errorMessage: result.error,
    referenceId: params.referenceId,
    recipientName: params.recipientName,
    testMode: params.testMode,
    testEmail: params.testEmail,
  });

  return result;
}

/**
 * Standard error response wrapper.
 */
export function errorResponse(error: unknown, context: string): Response {
  console.error(`Erro em ${context}:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  return new Response(
    JSON.stringify({ success: false, error: errorMessage }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Standard success response wrapper.
 */
export function successResponse(data: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Standard not-found response wrapper.
 */
export function notFoundResponse(message: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
