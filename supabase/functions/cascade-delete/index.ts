import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type SupaClient = ReturnType<typeof createClient>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth - use getUser (stable API)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }
    const userId = user.id;

    // Validate master role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!roleData || roleData.role !== 'master') {
      return jsonResponse({ error: 'Apenas Masters podem executar esta ação' }, 403);
    }

    const { entity_type, entity_id, dry_run = false } = await req.json();

    if (!entity_type || !entity_id) {
      return jsonResponse({ error: 'entity_type e entity_id são obrigatórios' }, 400);
    }

    // Get user name for audit
    const { data: userProfile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    const userName = userProfile?.full_name || 'Usuário';

    const summary: Record<string, number> = {};

    if (entity_type === 'claim') {
      return await handleClaimDelete(supabase, entity_id, dry_run, userId, userName, summary);
    } else if (entity_type === 'contract') {
      return await handleContractDelete(supabase, entity_id, dry_run, userId, userName, summary);
    } else if (entity_type === 'analysis') {
      return await handleAnalysisDelete(supabase, entity_id, dry_run, userId, userName, summary);
    }

    return jsonResponse({ error: 'entity_type inválido' }, 400);

  } catch (error) {
    console.error('Cascade delete FATAL error:', error, JSON.stringify(error));
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro interno' }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ===== HELPERS: Delete children of each entity type =====

async function deleteClaimChildren(supabase: SupaClient, claimId: string) {
  // Storage files
  const { data: claimFiles } = await supabase.from('claim_files').select('file_path').eq('claim_id', claimId);
  if (claimFiles?.length) {
    await supabase.storage.from('claim-files').remove(claimFiles.map((f: any) => f.file_path));
  }

  // Delete all child records in parallel
  await Promise.all([
    supabase.from('claim_files').delete().eq('claim_id', claimId),
    supabase.from('claim_items').delete().eq('claim_id', claimId),
    supabase.from('claim_notes').delete().eq('claim_id', claimId),
    supabase.from('claim_status_history').delete().eq('claim_id', claimId),
    supabase.from('claim_timeline').delete().eq('claim_id', claimId),
  ]);
}

async function deleteContractChildren(supabase: SupaClient, contractId: string, userName: string, tenantName: string) {
  // 1. Delete all claims linked to this contract
  const { data: allClaims } = await supabase.from('claims').select('id').eq('contract_id', contractId);
  for (const c of allClaims || []) {
    await deleteClaimChildren(supabase, c.id);
    await markTicketsDeleted(supabase, 'claim_id', c.id, 'contract', contractId, userName, tenantName);
    await supabase.from('claims').delete().eq('id', c.id);
  }

  // 2. Handle invoice items: remove items linked via installments, recalculate or delete invoices
  const { data: contractInstallments } = await supabase
    .from('guarantee_installments')
    .select('invoice_item_id')
    .eq('contract_id', contractId)
    .not('invoice_item_id', 'is', null);
  
  const invoiceItemIds = contractInstallments?.map((i: any) => i.invoice_item_id).filter(Boolean) || [];

  if (invoiceItemIds.length > 0) {
    const { data: invoiceItems } = await supabase.from('invoice_items').select('id, invoice_id').in('id', invoiceItemIds);
    const invoiceIds = [...new Set(invoiceItems?.map((i: any) => i.invoice_id) || [])];

    // Clear installment refs first so FK doesn't block
    await supabase.from('guarantee_installments').update({ invoice_item_id: null }).eq('contract_id', contractId);

    // Delete invoice items
    if (invoiceItemIds.length > 0) {
      await supabase.from('invoice_items').delete().in('id', invoiceItemIds);
    }

    // Check if invoices are now empty → delete; otherwise recalculate total
    for (const invId of invoiceIds) {
      const { count } = await supabase.from('invoice_items').select('id', { count: 'exact' }).eq('invoice_id', invId);
      if (count === 0) {
        await supabase.from('agency_invoices').delete().eq('id', invId);
      } else {
        const { data: remainingItems } = await supabase.from('invoice_items').select('value').eq('invoice_id', invId);
        const newTotal = remainingItems?.reduce((sum: number, i: any) => sum + (i.value || 0), 0) || 0;
        await supabase.from('agency_invoices').update({ total_value: newTotal }).eq('id', invId);
      }
    }
  }

  // 3. Delete other contract children in parallel
  await Promise.all([
    supabase.from('guarantee_installments').delete().eq('contract_id', contractId),
    supabase.from('renewal_notifications').delete().eq('contract_id', contractId),
    supabase.from('contract_renewals').delete().eq('contract_id', contractId),
  ]);

  // 4. Mark contract tickets
  await markTicketsDeleted(supabase, 'contract_id', contractId, 'contract', contractId, userName, tenantName);
}

async function deleteAnalysisChildren(supabase: SupaClient, analysisId: string, userName: string, tenantName: string) {
  // Storage files
  const { data: analysisDocs } = await supabase.from('analysis_documents').select('file_path').eq('analysis_id', analysisId);
  if (analysisDocs?.length) {
    await supabase.storage.from('analysis-documents').remove(analysisDocs.map((d: any) => d.file_path));
  }

  // Delete all analysis children in parallel
  await Promise.all([
    supabase.from('analysis_documents').delete().eq('analysis_id', analysisId),
    supabase.from('analysis_timeline').delete().eq('analysis_id', analysisId),
    supabase.from('commissions').delete().eq('analysis_id', analysisId),
    supabase.from('digital_acceptances').delete().eq('analysis_id', analysisId),
    supabase.from('internal_notes').delete().eq('reference_id', analysisId),
  ]);

  // Clean up orphaned notifications referencing this analysis
  await supabase.from('notifications').delete().eq('reference_id', analysisId);

  // Mark analysis tickets
  await markTicketsDeleted(supabase, 'analysis_id', analysisId, 'analysis', analysisId, userName, tenantName);
}

async function markTicketsDeleted(
  supabase: SupaClient,
  filterColumn: string,
  filterValue: string,
  entityType: string,
  entityId: string,
  deletedBy: string,
  tenantName: string
) {
  // Get tickets before marking them
  const { data: tickets } = await supabase.from('tickets').select('id').eq(filterColumn, filterValue);

  if (tickets?.length) {
    const ticketIds = tickets.map((t: any) => t.id);

    // Delete satisfaction surveys linked to these tickets
    await supabase.from('satisfaction_surveys').delete().in('ticket_id', ticketIds);

    // Delete ticket notifications
    await supabase.from('ticket_notifications').delete().in('ticket_id', ticketIds);

    // Mark tickets with deleted link info
    const deletedLinkInfo = {
      entity_type: entityType,
      entity_id: entityId,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      tenant_name: tenantName,
    };

    await supabase
      .from('tickets')
      .update({ deleted_link_info: deletedLinkInfo })
      .eq(filterColumn, filterValue);
  }
}

// ===== CLAIM DELETE =====
async function handleClaimDelete(
  supabase: SupaClient,
  claimId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: claim, error } = await supabase
    .from('claims')
    .select('*, contract:contracts(analysis:analyses(inquilino_nome))')
    .eq('id', claimId)
    .single();
  if (error || !claim) return jsonResponse({ error: 'Garantia não encontrada' }, 404);

  const tenantName = (claim as any).contract?.analysis?.inquilino_nome || 'Desconhecido';

  // Count children in parallel
  const [files, items, notes, history, timeline, tickets] = await Promise.all([
    supabase.from('claim_files').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_items').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_notes').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_status_history').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_timeline').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('tickets').select('id', { count: 'exact' }).eq('claim_id', claimId),
  ]);

  summary.arquivos = files.count || 0;
  summary.itens = items.count || 0;
  summary.notas = notes.count || 0;
  summary.historico = history.count || 0;
  summary.timeline = timeline.count || 0;
  summary.chamados_preservados = tickets.count || 0;

  if (dryRun) {
    return jsonResponse({ summary, entity_type: 'claim', entity_id: claimId, tenant_name: tenantName });
  }

  console.log(`[CASCADE-DELETE] Deleting claim ${claimId} (${tenantName})`);

  await deleteClaimChildren(supabase, claimId);
  await markTicketsDeleted(supabase, 'claim_id', claimId, 'claim', claimId, userName, tenantName);

  // Audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'claims',
    record_id: claimId,
    action: 'CASCADE_DELETE',
    old_data: claim,
    new_data: { deleted_by: userName, summary },
  });

  // Clean up orphaned notifications
  await supabase.from('notifications').delete().eq('reference_id', claimId);

  const { error: delErr } = await supabase.from('claims').delete().eq('id', claimId);
  if (delErr) {
    console.error(`[CASCADE-DELETE] Failed to delete claim ${claimId}:`, delErr);
    return jsonResponse({ error: 'Erro ao excluir garantia: ' + delErr.message }, 500);
  }

  console.log(`[CASCADE-DELETE] Claim ${claimId} deleted successfully`);
  return jsonResponse({ success: true, summary, entity_type: 'claim' });
}

// ===== CONTRACT DELETE =====
// Deletes contract + linked analysis + all children
async function handleContractDelete(
  supabase: SupaClient,
  contractId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, analysis:analyses(id, inquilino_nome)')
    .eq('id', contractId)
    .single();
  if (error || !contract) return jsonResponse({ error: 'Contrato não encontrado' }, 404);

  const analysisId = (contract as any).analysis?.id;
  const tenantName = (contract as any).analysis?.inquilino_nome || 'Desconhecido';

  // Count all children in parallel
  const [installments, renewals, renewalNotifs, allClaimsCount, activeClaims, contractTickets] = await Promise.all([
    supabase.from('guarantee_installments').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('contract_renewals').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('renewal_notifications').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('claims').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('claims').select('id').eq('contract_id', contractId).is('canceled_at', null).neq('public_status', 'finalizado'),
    supabase.from('tickets').select('id', { count: 'exact' }).eq('contract_id', contractId),
  ]);

  // Count invoice items
  const { data: instWithInvoice } = await supabase.from('guarantee_installments').select('invoice_item_id').eq('contract_id', contractId).not('invoice_item_id', 'is', null);
  const invoiceItemIds = instWithInvoice?.map((i: any) => i.invoice_item_id).filter(Boolean) || [];
  let invoiceCount = 0;
  if (invoiceItemIds.length > 0) {
    const { data: items } = await supabase.from('invoice_items').select('invoice_id').in('id', invoiceItemIds);
    invoiceCount = new Set(items?.map((i: any) => i.invoice_id)).size;
  }

  // Count analysis children if analysis exists
  let analysisSummary: Record<string, number> = {};
  if (analysisId) {
    const [docs, atl, comms, accepts, notes, analysisTickets] = await Promise.all([
      supabase.from('analysis_documents').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
      supabase.from('analysis_timeline').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
      supabase.from('commissions').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
      supabase.from('digital_acceptances').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
      supabase.from('internal_notes').select('id', { count: 'exact' }).eq('reference_id', analysisId),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    ]);
    analysisSummary = {
      documentos_analise: docs.count || 0,
      timeline_analise: atl.count || 0,
      comissoes: comms.count || 0,
      aceites_digitais: accepts.count || 0,
      notas_internas: notes.count || 0,
      chamados_analise: analysisTickets.count || 0,
    };
  }

  summary.parcelas = installments.count || 0;
  summary.renovacoes = renewals.count || 0;
  summary.lembretes_renovacao = renewalNotifs.count || 0;
  summary.garantias = allClaimsCount.count || 0;
  summary.garantias_ativas = activeClaims.data?.length || 0;
  summary.faturas_afetadas = invoiceCount;
  summary.chamados_contrato = contractTickets.count || 0;
  summary.analise_vinculada = analysisId ? 1 : 0;
  Object.assign(summary, analysisSummary);

  if (dryRun) {
    return jsonResponse({ summary, entity_type: 'contract', entity_id: contractId, tenant_name: tenantName });
  }

  console.log(`[CASCADE-DELETE] Deleting contract ${contractId} + analysis ${analysisId} (${tenantName})`);

  // Step 1: Delete contract children (claims, installments, invoices, renewals, tickets)
  await deleteContractChildren(supabase, contractId, userName, tenantName);

  // Step 2: Audit for contract
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'contracts',
    record_id: contractId,
    action: 'CASCADE_DELETE',
    old_data: contract,
    new_data: { deleted_by: userName, summary },
  });

  // Clean orphaned notifications for contract
  await supabase.from('notifications').delete().eq('reference_id', contractId);

  // Step 3: Delete the contract itself
  const { error: contractDelError } = await supabase.from('contracts').delete().eq('id', contractId);
  if (contractDelError) {
    console.error(`[CASCADE-DELETE] Failed to delete contract ${contractId}:`, contractDelError);
    return jsonResponse({ error: 'Erro ao excluir contrato: ' + contractDelError.message }, 500);
  }

  // Step 4: Delete linked analysis and its children
  if (analysisId) {
    await deleteAnalysisChildren(supabase, analysisId, userName, tenantName);

    await supabase.from('audit_logs').insert({
      user_id: userId,
      table_name: 'analyses',
      record_id: analysisId,
      action: 'CASCADE_DELETE',
      old_data: (contract as any).analysis,
      new_data: { deleted_by: userName, deleted_via: 'contract_cascade', contract_id: contractId },
    });

    const { error: analysisDelError } = await supabase.from('analyses').delete().eq('id', analysisId);
    if (analysisDelError) {
      console.error(`[CASCADE-DELETE] Failed to delete analysis ${analysisId}:`, analysisDelError);
      // Don't fail the whole operation - contract is already deleted
    }
  }

  console.log(`[CASCADE-DELETE] Contract ${contractId} + analysis ${analysisId} deleted successfully`);
  return jsonResponse({ success: true, summary, entity_type: 'contract' });
}

// ===== ANALYSIS DELETE =====
// Deletes analysis + linked contract (if any) + all children
async function handleAnalysisDelete(
  supabase: SupaClient,
  analysisId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*, agency:agencies(nome_fantasia)')
    .eq('id', analysisId)
    .single();
  if (error || !analysis) return jsonResponse({ error: 'Análise não encontrada' }, 404);

  const tenantName = analysis.inquilino_nome || 'Desconhecido';

  // Check linked contract
  const { data: contract } = await supabase.from('contracts').select('id').eq('analysis_id', analysisId).maybeSingle();

  // Count analysis children
  const [docs, timeline, commissions, acceptances, notes, analysisTickets] = await Promise.all([
    supabase.from('analysis_documents').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('analysis_timeline').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('commissions').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('digital_acceptances').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('internal_notes').select('id', { count: 'exact' }).eq('reference_id', analysisId),
    supabase.from('tickets').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
  ]);

  summary.documentos = docs.count || 0;
  summary.timeline = timeline.count || 0;
  summary.comissoes = commissions.count || 0;
  summary.aceites_digitais = acceptances.count || 0;
  summary.notas_internas = notes.count || 0;
  summary.contrato = contract ? 1 : 0;
  summary.chamados_analise = analysisTickets.count || 0;

  if (dryRun) {
    if (contract) {
      const contractDryRun = await getContractSummary(supabase, contract.id);
      summary.parcelas_contrato = contractDryRun.parcelas || 0;
      summary.renovacoes_contrato = contractDryRun.renovacoes || 0;
      summary.faturas_afetadas = contractDryRun.faturas || 0;
      summary.garantias = contractDryRun.garantias || 0;
    }
    return jsonResponse({ summary, entity_type: 'analysis', entity_id: analysisId, tenant_name: tenantName });
  }

  console.log(`[CASCADE-DELETE] Deleting analysis ${analysisId} (${tenantName}), has contract: ${!!contract}`);

  // Step 1: Delete contract and its children first (if exists)
  if (contract) {
    await deleteContractChildren(supabase, contract.id, userName, tenantName);

    await supabase.from('audit_logs').insert({
      user_id: userId,
      table_name: 'contracts',
      record_id: contract.id,
      action: 'CASCADE_DELETE',
      old_data: contract,
      new_data: { deleted_by: userName, deleted_via: 'analysis_cascade', analysis_id: analysisId },
    });

    // Clean orphaned notifications for contract
    await supabase.from('notifications').delete().eq('reference_id', contract.id);

    const { error: contractDelError } = await supabase.from('contracts').delete().eq('id', contract.id);
    if (contractDelError) {
      console.error(`[CASCADE-DELETE] Failed to delete contract ${contract.id}:`, contractDelError);
      return jsonResponse({ error: 'Erro ao excluir contrato vinculado: ' + contractDelError.message }, 500);
    }
  }

  // Step 2: Delete analysis children
  await deleteAnalysisChildren(supabase, analysisId, userName, tenantName);

  // Step 3: Audit for analysis
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'analyses',
    record_id: analysisId,
    action: 'CASCADE_DELETE',
    old_data: analysis,
    new_data: { deleted_by: userName, summary },
  });

  // Step 4: Delete the analysis itself
  const { error: analysisDelError } = await supabase.from('analyses').delete().eq('id', analysisId);
  if (analysisDelError) {
    console.error(`[CASCADE-DELETE] Failed to delete analysis ${analysisId}:`, analysisDelError);
    return jsonResponse({ error: 'Erro ao excluir análise: ' + analysisDelError.message }, 500);
  }

  console.log(`[CASCADE-DELETE] Analysis ${analysisId} deleted successfully`);
  return jsonResponse({ success: true, summary, entity_type: 'analysis' });
}

// ===== SUMMARY HELPER =====
async function getContractSummary(supabase: SupaClient, contractId: string) {
  const [installments, renewals, claims] = await Promise.all([
    supabase.from('guarantee_installments').select('id, invoice_item_id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('contract_renewals').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('claims').select('id', { count: 'exact' }).eq('contract_id', contractId),
  ]);

  const itemIds = installments.data?.map((i: any) => i.invoice_item_id).filter(Boolean) || [];
  let faturas = 0;
  if (itemIds.length > 0) {
    const { data: items } = await supabase.from('invoice_items').select('invoice_id').in('id', itemIds);
    faturas = new Set(items?.map((i: any) => i.invoice_id)).size;
  }

  return {
    parcelas: installments.count || 0,
    renovacoes: renewals.count || 0,
    garantias: claims.count || 0,
    faturas,
  };
}
