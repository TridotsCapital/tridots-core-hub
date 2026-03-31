import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;

    // Validate master role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!roleData || roleData.role !== 'master') {
      return new Response(JSON.stringify({ error: 'Apenas Masters podem executar esta ação' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { entity_type, entity_id, dry_run = false } = await req.json();

    if (!entity_type || !entity_id) {
      return new Response(JSON.stringify({ error: 'entity_type e entity_id são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get user name for audit
    const { data: userProfile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    const userName = userProfile?.full_name || 'Usuário';

    const summary: Record<string, number> = {};
    const blocked_by: { type: string; id: string; label: string } | null = null;

    if (entity_type === 'claim') {
      return await handleClaimDelete(supabase, entity_id, dry_run, userId, userName, summary);
    } else if (entity_type === 'contract') {
      return await handleContractDelete(supabase, entity_id, dry_run, userId, userName, summary);
    } else if (entity_type === 'analysis') {
      return await handleAnalysisDelete(supabase, entity_id, dry_run, userId, userName, summary);
    }

    return new Response(JSON.stringify({ error: 'entity_type inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Cascade delete error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ===== CLAIM DELETE =====
async function handleClaimDelete(
  supabase: ReturnType<typeof createClient>,
  claimId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: claim, error } = await supabase.from('claims').select('*, contract:contracts(analysis:analyses(inquilino_nome))').eq('id', claimId).single();
  if (error || !claim) return jsonResponse({ error: 'Garantia não encontrada' }, 404);

  const tenantName = (claim as any).contract?.analysis?.inquilino_nome || 'Desconhecido';

  // Count children
  const [files, items, notes, history, timeline] = await Promise.all([
    supabase.from('claim_files').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_items').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_notes').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_status_history').select('id', { count: 'exact' }).eq('claim_id', claimId),
    supabase.from('claim_timeline').select('id', { count: 'exact' }).eq('claim_id', claimId),
  ]);

  // Count tickets linked to this claim
  const { count: ticketCount } = await supabase.from('tickets').select('id', { count: 'exact' }).eq('claim_id', claimId);

  summary.arquivos = files.count || 0;
  summary.itens = items.count || 0;
  summary.notas = notes.count || 0;
  summary.historico = history.count || 0;
  summary.timeline = timeline.count || 0;
  summary.chamados_preservados = ticketCount || 0;

  if (dryRun) {
    return jsonResponse({ summary, entity_type: 'claim', entity_id: claimId, tenant_name: tenantName });
  }

  // Delete storage files
  const { data: claimFiles } = await supabase.from('claim_files').select('file_path').eq('claim_id', claimId);
  if (claimFiles?.length) {
    await supabase.storage.from('claim-files').remove(claimFiles.map(f => f.file_path));
  }

  // Delete children
  await supabase.from('claim_files').delete().eq('claim_id', claimId);
  await supabase.from('claim_items').delete().eq('claim_id', claimId);
  await supabase.from('claim_notes').delete().eq('claim_id', claimId);
  await supabase.from('claim_status_history').delete().eq('claim_id', claimId);
  await supabase.from('claim_timeline').delete().eq('claim_id', claimId);

  // Mark tickets
  await markTicketsDeleted(supabase, { claim_id: claimId }, 'claim', claimId, userName, tenantName);

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'claims',
    record_id: claimId,
    action: 'CASCADE_DELETE',
    old_data: claim,
    new_data: { deleted_by: userName, summary },
  });

  // Delete claim
  await supabase.from('claims').delete().eq('id', claimId);

  return jsonResponse({ success: true, summary, entity_type: 'claim' });
}

// ===== CONTRACT DELETE =====
async function handleContractDelete(
  supabase: ReturnType<typeof createClient>,
  contractId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: contract, error } = await supabase.from('contracts').select('*, analysis:analyses(inquilino_nome, id)').eq('id', contractId).single();
  if (error || !contract) return jsonResponse({ error: 'Contrato não encontrado' }, 404);

  const tenantName = (contract as any).analysis?.inquilino_nome || 'Desconhecido';

  // Count active claims (will be deleted in cascade)
  const { data: activeClaims } = await supabase
    .from('claims')
    .select('id, public_status')
    .eq('contract_id', contractId)
    .is('canceled_at', null)
    .neq('public_status', 'finalizado');

  const activeClaimsCount = activeClaims?.length || 0;

  // Count children
  const [installments, renewals, renewalNotifs] = await Promise.all([
    supabase.from('guarantee_installments').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('contract_renewals').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('renewal_notifications').select('id', { count: 'exact' }).eq('contract_id', contractId),
  ]);

  // Count finalized claims
  const { count: finalizedClaimsCount } = await supabase.from('claims').select('id', { count: 'exact' }).eq('contract_id', contractId);

  // Count invoice items for this contract
  const { data: contractInstallments } = await supabase.from('guarantee_installments').select('invoice_item_id').eq('contract_id', contractId).not('invoice_item_id', 'is', null);
  const invoiceItemIds = contractInstallments?.map(i => i.invoice_item_id).filter(Boolean) || [];

  // Count affected invoices
  let invoiceCount = 0;
  if (invoiceItemIds.length > 0) {
    // Find which invoices these items belong to
    const { data: invoiceItems } = await supabase.from('invoice_items').select('invoice_id').in('id', invoiceItemIds);
    const invoiceIds = [...new Set(invoiceItems?.map(i => i.invoice_id) || [])];
    invoiceCount = invoiceIds.length;
  }

  // Tickets linked to contract
  const { count: ticketCount } = await supabase.from('tickets').select('id', { count: 'exact' }).eq('contract_id', contractId);

  summary.parcelas = installments.count || 0;
  summary.renovacoes = renewals.count || 0;
  summary.lembretes_renovacao = renewalNotifs.count || 0;
  summary.garantias_finalizadas = finalizedClaimsCount || 0;
  summary.garantias_ativas = activeClaimsCount;
  summary.faturas_afetadas = invoiceCount;
  summary.chamados_preservados = ticketCount || 0;

  if (dryRun) {
    return jsonResponse({ summary, entity_type: 'contract', entity_id: contractId, tenant_name: tenantName });
  }

  // Delete finalized claims cascade
  const { data: allClaims } = await supabase.from('claims').select('id').eq('contract_id', contractId);
  for (const c of allClaims || []) {
    await deleteClaimChildren(supabase, c.id);
    await markTicketsDeleted(supabase, { claim_id: c.id }, 'contract', contractId, userName, tenantName);
    await supabase.from('claims').delete().eq('id', c.id);
  }

  // Handle invoices: remove items, delete invoice if empty
  if (invoiceItemIds.length > 0) {
    const { data: invoiceItems } = await supabase.from('invoice_items').select('id, invoice_id').in('id', invoiceItemIds);
    const invoiceIds = [...new Set(invoiceItems?.map(i => i.invoice_id) || [])];

    // Clear installment refs first
    await supabase.from('guarantee_installments').update({ invoice_item_id: null }).eq('contract_id', contractId);

    // Delete invoice items
    for (const itemId of invoiceItemIds) {
      await supabase.from('invoice_items').delete().eq('id', itemId);
    }

    // Check if invoices are now empty and delete them
    for (const invId of invoiceIds) {
      const { count } = await supabase.from('invoice_items').select('id', { count: 'exact' }).eq('invoice_id', invId);
      if (count === 0) {
        await supabase.from('agency_invoices').delete().eq('id', invId);
      } else {
        // Recalculate total
        const { data: remainingItems } = await supabase.from('invoice_items').select('value').eq('invoice_id', invId);
        const newTotal = remainingItems?.reduce((sum, i) => sum + (i.value || 0), 0) || 0;
        await supabase.from('agency_invoices').update({ total_value: newTotal }).eq('id', invId);
      }
    }
  }

  // Delete contract children
  await supabase.from('guarantee_installments').delete().eq('contract_id', contractId);
  await supabase.from('renewal_notifications').delete().eq('contract_id', contractId);
  await supabase.from('contract_renewals').delete().eq('contract_id', contractId);

  // Mark tickets
  await markTicketsDeleted(supabase, { contract_id: contractId }, 'contract', contractId, userName, tenantName);

  // Audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'contracts',
    record_id: contractId,
    action: 'CASCADE_DELETE',
    old_data: contract,
    new_data: { deleted_by: userName, summary },
  });

  await supabase.from('contracts').delete().eq('id', contractId);

  return jsonResponse({ success: true, summary, entity_type: 'contract' });
}

// ===== ANALYSIS DELETE =====
async function handleAnalysisDelete(
  supabase: ReturnType<typeof createClient>,
  analysisId: string,
  dryRun: boolean,
  userId: string,
  userName: string,
  summary: Record<string, number>
) {
  const { data: analysis, error } = await supabase.from('analyses').select('*, agency:agencies(nome_fantasia)').eq('id', analysisId).single();
  if (error || !analysis) return jsonResponse({ error: 'Análise não encontrada' }, 404);

  const tenantName = analysis.inquilino_nome || 'Desconhecido';

  // Check linked contract
  const { data: contract } = await supabase.from('contracts').select('id').eq('analysis_id', analysisId).maybeSingle();

  if (contract) {
    // Check for active claims on the contract
    // Active claims will be deleted in cascade via handleContractDelete
  }

  // Count analysis children
  const [docs, timeline, commissions, acceptances, notes] = await Promise.all([
    supabase.from('analysis_documents').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('analysis_timeline').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('commissions').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('digital_acceptances').select('id', { count: 'exact' }).eq('analysis_id', analysisId),
    supabase.from('internal_notes').select('id', { count: 'exact' }).eq('reference_id', analysisId),
  ]);

  const { count: ticketCount } = await supabase.from('tickets').select('id', { count: 'exact' }).eq('analysis_id', analysisId);

  summary.documentos = docs.count || 0;
  summary.timeline = timeline.count || 0;
  summary.comissoes = commissions.count || 0;
  summary.aceites_digitais = acceptances.count || 0;
  summary.notas_internas = notes.count || 0;
  summary.contrato = contract ? 1 : 0;
  summary.chamados_preservados = ticketCount || 0;

  if (dryRun) {
    // If has contract, also get contract summary
    if (contract) {
      const contractDryRun = await getContractSummary(supabase, contract.id);
      summary.parcelas_contrato = contractDryRun.parcelas || 0;
      summary.renovacoes_contrato = contractDryRun.renovacoes || 0;
      summary.faturas_afetadas = contractDryRun.faturas || 0;
      summary.garantias_finalizadas = contractDryRun.garantias || 0;
    }
    return jsonResponse({ summary, entity_type: 'analysis', entity_id: analysisId, tenant_name: tenantName });
  }

  // Delete contract first if exists
  if (contract) {
    // Re-use contract delete logic without dry_run
    const fakeResp = await handleContractDelete(supabase, contract.id, false, userId, userName, {});
    // Check if it was blocked
    const respBody = await fakeResp.json();
    if (respBody.error) {
      return jsonResponse({ error: respBody.error }, fakeResp.status);
    }
  }

  // Delete storage files
  const { data: analysisDocs } = await supabase.from('analysis_documents').select('file_path').eq('analysis_id', analysisId);
  if (analysisDocs?.length) {
    await supabase.storage.from('analysis-documents').remove(analysisDocs.map(d => d.file_path));
  }

  // Delete analysis children
  await supabase.from('analysis_documents').delete().eq('analysis_id', analysisId);
  await supabase.from('analysis_timeline').delete().eq('analysis_id', analysisId);
  await supabase.from('commissions').delete().eq('analysis_id', analysisId);
  await supabase.from('digital_acceptances').delete().eq('analysis_id', analysisId);
  await supabase.from('internal_notes').delete().eq('reference_id', analysisId);

  // Delete ticket messages + notifications for analysis tickets, then mark tickets
  const { data: analysisTickets } = await supabase.from('tickets').select('id').eq('analysis_id', analysisId);
  if (analysisTickets?.length) {
    for (const t of analysisTickets) {
      // Don't delete tickets, just mark them
    }
  }
  await markTicketsDeleted(supabase, { analysis_id: analysisId }, 'analysis', analysisId, userName, tenantName);

  // Audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    table_name: 'analyses',
    record_id: analysisId,
    action: 'CASCADE_DELETE',
    old_data: analysis,
    new_data: { deleted_by: userName, summary },
  });

  await supabase.from('analyses').delete().eq('id', analysisId);

  return jsonResponse({ success: true, summary, entity_type: 'analysis' });
}

// ===== HELPERS =====

async function deleteClaimChildren(supabase: ReturnType<typeof createClient>, claimId: string) {
  const { data: claimFiles } = await supabase.from('claim_files').select('file_path').eq('claim_id', claimId);
  if (claimFiles?.length) {
    await supabase.storage.from('claim-files').remove(claimFiles.map(f => f.file_path));
  }
  await supabase.from('claim_files').delete().eq('claim_id', claimId);
  await supabase.from('claim_items').delete().eq('claim_id', claimId);
  await supabase.from('claim_notes').delete().eq('claim_id', claimId);
  await supabase.from('claim_status_history').delete().eq('claim_id', claimId);
  await supabase.from('claim_timeline').delete().eq('claim_id', claimId);
}

async function markTicketsDeleted(
  supabase: ReturnType<typeof createClient>,
  filter: Record<string, string>,
  entityType: string,
  entityId: string,
  deletedBy: string,
  tenantName: string
) {
  const deletedLinkInfo = {
    entity_type: entityType,
    entity_id: entityId,
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
    tenant_name: tenantName,
  };

  const key = Object.keys(filter)[0];
  const val = Object.values(filter)[0];

  await supabase
    .from('tickets')
    .update({ deleted_link_info: deletedLinkInfo })
    .eq(key, val);
}

async function getContractSummary(supabase: ReturnType<typeof createClient>, contractId: string) {
  const [installments, renewals, claims] = await Promise.all([
    supabase.from('guarantee_installments').select('id, invoice_item_id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('contract_renewals').select('id', { count: 'exact' }).eq('contract_id', contractId),
    supabase.from('claims').select('id', { count: 'exact' }).eq('contract_id', contractId),
  ]);

  const itemIds = installments.data?.map(i => i.invoice_item_id).filter(Boolean) || [];
  let faturas = 0;
  if (itemIds.length > 0) {
    const { data: items } = await supabase.from('invoice_items').select('invoice_id').in('id', itemIds);
    faturas = new Set(items?.map(i => i.invoice_id)).size;
  }

  return {
    parcelas: installments.count || 0,
    renovacoes: renewals.count || 0,
    garantias: claims.count || 0,
    faturas,
  };
}
