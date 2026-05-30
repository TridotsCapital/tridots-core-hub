// generate-activation-letter
//
// Gera carta de ativação de contrato de garantia. Usado quando o contrato
// passa pra status="ativo". Documenta oficialmente o início da cobertura.
//
// Body: { contract_id: UUID }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escape = (s: unknown): string => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const formatBRL = (v: number): string => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatDate = (s: string | null): string => { if (!s) return "—"; try { return new Date(s).toLocaleDateString("pt-BR"); } catch { return s; } };

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { contract_id } = await req.json();
    if (!contract_id) return new Response(JSON.stringify({ error: "contract_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Busca contrato + analise + agency + parcelas
    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select(`
        *,
        analysis:analyses(*),
        agency:agencies(razao_social, nome_fantasia, cnpj, cidade, estado)
      `)
      .eq("id", contract_id)
      .maybeSingle();
    if (cErr || !contract) return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Tenant guard
    const { data: callerRole } = await supabase.from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    const isMaster = callerRole?.role === "master";
    if (!isMaster) {
      const { data: links } = await supabase.from("agency_users").select("agency_id").eq("user_id", caller.id);
      const allowed = (links ?? []).map((l) => l.agency_id);
      if (!allowed.includes(contract.agency_id)) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (contract.status !== "ativo") {
      return new Response(JSON.stringify({ error: "Contrato ainda não ativado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Conta parcelas
    const { data: parcelas } = await supabase
      .from("guarantee_installments")
      .select("id, value, due_date, status, paid_at")
      .eq("contract_id", contract_id)
      .order("due_date", { ascending: true });

    const analysis = contract.analysis as Record<string, unknown>;
    const agency = contract.agency as { razao_social: string; nome_fantasia?: string; cnpj: string; cidade?: string; estado?: string };
    const valorTotal = Number((analysis.valor_total as number) ?? (analysis.valor_aluguel as number) ?? 0);
    const coberturaMaxima = valorTotal * 20;
    const totalParcelas = parcelas?.length ?? 0;
    const valorAnual = (parcelas ?? []).reduce((acc, p) => acc + Number(p.value), 0);
    const proximaParcela = (parcelas ?? []).find((p) => !p.paid_at);

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Carta de Ativação — ${escape((analysis as { inquilino_nome: string }).inquilino_nome)}</title>
<style>
  @page { size: A4; margin: 25mm 20mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a2e; max-width: 800px; margin: 0 auto; line-height: 1.6; }
  .brand { text-align: center; padding-bottom: 20px; border-bottom: 3px solid #1a1a2e; margin-bottom: 30px; }
  .brand h1 { margin: 0; font-size: 32px; letter-spacing: 4px; color: #1a1a2e; }
  .brand p { margin: 5px 0 0 0; font-size: 13px; color: #666; font-style: italic; }
  h2 { font-size: 18px; margin-top: 30px; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 20px 0; }
  .info-row { padding: 8px 0; border-bottom: 1px dotted #ddd; }
  .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
  .stamp { display: inline-block; border: 3px solid #1565c0; color: #1565c0; padding: 8px 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-3deg); margin: 20px 0; }
  .highlight { background: #e3f2fd; padding: 20px; border-left: 4px solid #1565c0; margin: 24px 0; border-radius: 4px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 11px; color: #666; }
  .signature-area { margin-top: 60px; }
  .signature-line { border-top: 1px solid #333; width: 280px; margin: 60px 0 5px 0; }
  table.parcelas { width: 100%; border-collapse: collapse; margin: 15px 0; }
  table.parcelas th, table.parcelas td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
  table.parcelas th { background: #f5f5f5; text-transform: uppercase; }
</style></head><body>

<div class="brand">
  <h1>GARANTFÁCIL</h1>
  <p>A garantia locatícia mais segura e completa do Brasil</p>
</div>

<p style="text-align: right; font-size: 13px;">
  <strong>${escape(agency.cidade ?? "São Paulo")}, ${formatDate(new Date().toISOString())}</strong><br>
  Contrato nº: ${escape(contract_id.substring(0, 8).toUpperCase())}
</p>

<h2>Carta de Ativação de Garantia Locatícia</h2>

<p>
  A <strong>GarantFácil</strong> declara que o contrato de Garantia Locatícia
  abaixo foi <strong>ATIVADO</strong> e está em vigor a partir desta data.
</p>

<div class="stamp">ATIVO</div>

<h2>Dados do Inquilino</h2>
<div class="info-grid">
  <div class="info-row"><div class="label">Nome</div><div class="value">${escape((analysis as { inquilino_nome: string }).inquilino_nome)}</div></div>
  <div class="info-row"><div class="label">CPF</div><div class="value">${escape((analysis as { inquilino_cpf: string }).inquilino_cpf)}</div></div>
</div>

<h2>Dados do Imóvel</h2>
<div class="info-grid">
  <div class="info-row" style="grid-column: 1 / -1;"><div class="label">Endereço</div><div class="value">${escape((analysis as { imovel_endereco: string }).imovel_endereco)}</div></div>
  <div class="info-row"><div class="label">Cidade / UF</div><div class="value">${escape((analysis as { imovel_cidade: string }).imovel_cidade)} / ${escape((analysis as { imovel_estado: string }).imovel_estado)}</div></div>
</div>

<div class="highlight">
  <h2 style="margin-top: 0;">Cobertura</h2>
  <div class="info-grid">
    <div class="info-row"><div class="label">Valor mensal coberto</div><div class="value">${formatBRL(valorTotal)}</div></div>
    <div class="info-row"><div class="label">Cobertura máxima</div><div class="value" style="color: #1565c0;">${formatBRL(coberturaMaxima)}</div></div>
    <div class="info-row"><div class="label">Data de ativação</div><div class="value">${formatDate((contract as { activated_at: string }).activated_at as string)}</div></div>
    <div class="info-row"><div class="label">Total de parcelas</div><div class="value">${totalParcelas}</div></div>
    <div class="info-row" style="grid-column: 1 / -1;"><div class="label">Valor total anual da garantia</div><div class="value" style="font-size: 18px; color: #1565c0;">${formatBRL(valorAnual)}</div></div>
  </div>
</div>

${proximaParcela ? `
<h2>Próximo Vencimento</h2>
<p>
  Sua próxima parcela vence em <strong>${formatDate(proximaParcela.due_date)}</strong>
  no valor de <strong>${formatBRL(Number(proximaParcela.value))}</strong>.
</p>` : ""}

<h2>Imobiliária Parceira</h2>
<p>
  <strong>${escape(agency.nome_fantasia ?? agency.razao_social)}</strong><br>
  ${escape(agency.razao_social)} — CNPJ: ${escape(agency.cnpj)}
</p>

<div class="signature-area">
  <div class="signature-line"></div>
  <p style="margin: 0; font-size: 12px;">
    <strong>GarantFácil</strong><br>
    Equipe de Operações<br>
    contato@garantfacil.com.br
  </p>
</div>

<div class="footer">
  <p>Documento gerado eletronicamente em ${new Date().toLocaleString("pt-BR")}.
     Em caso de inadimplência do inquilino, acionar a garantia pelo portal:
     https://tridotscapital.com</p>
</div>

</body></html>`;

    const fileName = `carta_ativacao_${(analysis as { inquilino_cpf: string }).inquilino_cpf.replace(/\D/g, "")}_${new Date().toISOString().slice(0, 10)}.html`;
    return new Response(
      JSON.stringify({ success: true, html, fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[generate-activation-letter]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
