// generate-approval-letter
//
// Gera carta de aprovação de garantia locatícia em HTML/PDF-ready.
// Usado quando análise é aprovada — documento "oficial" pra imobiliária
// mostrar ao proprietário do imóvel como prova de cobertura GarantFácil.
//
// Auth: caller precisa estar autenticado + (master OU agency dona da análise).
//
// Body: { analysis_id: UUID }
// Resp: { success, html, fileName }  — front converte pra PDF via window.print
//                                       ou usa lib browser-side (pdfmake/jsPDF).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escape = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatBRL = (v: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (s: string | null): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { analysis_id } = await req.json();
    if (!analysis_id) {
      return new Response(JSON.stringify({ error: "analysis_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca análise + agency
    const { data: analysis, error: aErr } = await supabase
      .from("analyses")
      .select("*, agency:agencies(razao_social, nome_fantasia, cnpj, cidade, estado)")
      .eq("id", analysis_id)
      .maybeSingle();
    if (aErr || !analysis) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tenant guard
    const { data: callerRole } = await supabase
      .from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    const isMaster = callerRole?.role === "master";
    if (!isMaster) {
      const { data: links } = await supabase
        .from("agency_users").select("agency_id").eq("user_id", caller.id);
      const allowed = (links ?? []).map((l) => l.agency_id);
      if (!allowed.includes(analysis.agency_id)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (analysis.status !== "aprovada") {
      return new Response(JSON.stringify({ error: "Análise ainda não aprovada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agency = (analysis.agency as { razao_social: string; nome_fantasia?: string; cnpj: string; cidade?: string; estado?: string });
    const valorTotal = Number(analysis.valor_total ?? analysis.valor_aluguel ?? 0);
    const coberturaMaxima = valorTotal * 20; // política GarantFácil padrão (20x aluguel)
    const validadeAprovacao = new Date();
    validadeAprovacao.setDate(validadeAprovacao.getDate() + 30);

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Carta de Aprovação — ${escape(analysis.inquilino_nome)}</title>
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
  .highlight { background: #fff8e1; padding: 20px; border-left: 4px solid #f9a825; margin: 24px 0; border-radius: 4px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 11px; color: #666; }
  .signature-area { margin-top: 60px; }
  .signature-line { border-top: 1px solid #333; width: 280px; margin: 60px 0 5px 0; }
  .stamp { display: inline-block; border: 3px solid #2e7d32; color: #2e7d32; padding: 8px 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-3deg); margin: 20px 0; }
</style></head><body>

<div class="brand">
  <h1>GARANTFÁCIL</h1>
  <p>A garantia locatícia mais segura e completa do Brasil</p>
</div>

<p style="text-align: right; font-size: 13px;">
  <strong>${escape(agency.cidade ?? "São Paulo")}, ${formatDate(new Date().toISOString())}</strong><br>
  Documento nº: ${escape(analysis_id.substring(0, 8).toUpperCase())}
</p>

<h2>Carta de Aprovação de Garantia Locatícia</h2>

<p>
  Pela presente, a <strong>GarantFácil</strong> declara que <strong>APROVOU</strong>
  a análise de crédito do candidato a inquilino abaixo, autorizando a contratação
  da modalidade Garantia Locatícia para o imóvel indicado.
</p>

<div class="stamp">APROVADO</div>

<h2>Dados do Inquilino</h2>
<div class="info-grid">
  <div class="info-row"><div class="label">Nome</div><div class="value">${escape(analysis.inquilino_nome)}</div></div>
  <div class="info-row"><div class="label">CPF</div><div class="value">${escape(analysis.inquilino_cpf)}</div></div>
  ${analysis.inquilino_email ? `<div class="info-row"><div class="label">E-mail</div><div class="value">${escape(analysis.inquilino_email)}</div></div>` : ""}
  ${analysis.inquilino_telefone ? `<div class="info-row"><div class="label">Telefone</div><div class="value">${escape(analysis.inquilino_telefone)}</div></div>` : ""}
</div>

<h2>Dados do Imóvel</h2>
<div class="info-grid">
  <div class="info-row" style="grid-column: 1 / -1;"><div class="label">Endereço</div><div class="value">${escape(analysis.imovel_endereco)}</div></div>
  ${analysis.imovel_bairro ? `<div class="info-row"><div class="label">Bairro</div><div class="value">${escape(analysis.imovel_bairro)}</div></div>` : ""}
  <div class="info-row"><div class="label">Cidade / UF</div><div class="value">${escape(analysis.imovel_cidade)} / ${escape(analysis.imovel_estado)}</div></div>
</div>

<div class="highlight">
  <h2 style="margin-top: 0;">Valores</h2>
  <div class="info-grid">
    <div class="info-row"><div class="label">Aluguel</div><div class="value">${formatBRL(Number(analysis.valor_aluguel ?? 0))}</div></div>
    <div class="info-row"><div class="label">Condomínio</div><div class="value">${formatBRL(Number(analysis.valor_condominio ?? 0))}</div></div>
    <div class="info-row"><div class="label">IPTU</div><div class="value">${formatBRL(Number(analysis.valor_iptu ?? 0))}</div></div>
    <div class="info-row"><div class="label">Outros encargos</div><div class="value">${formatBRL(Number(analysis.valor_outros_encargos ?? 0))}</div></div>
    <div class="info-row" style="grid-column: 1 / -1;"><div class="label">Valor total mensal coberto</div><div class="value" style="font-size: 20px; color: #1a1a2e;">${formatBRL(valorTotal)}</div></div>
    <div class="info-row" style="grid-column: 1 / -1;"><div class="label">Cobertura máxima da garantia (até 20x o aluguel mensal)</div><div class="value" style="font-size: 20px; color: #2e7d32;">${formatBRL(coberturaMaxima)}</div></div>
  </div>
</div>

<h2>Imobiliária Parceira</h2>
<p>
  <strong>${escape(agency.nome_fantasia ?? agency.razao_social)}</strong><br>
  ${escape(agency.razao_social)}<br>
  CNPJ: ${escape(agency.cnpj)}
</p>

<h2>Validade desta Aprovação</h2>
<p>
  Esta carta de aprovação é válida até <strong>${formatDate(validadeAprovacao.toISOString())}</strong>
  (30 dias a partir de hoje). Após esse prazo, será necessária revalidação caso o
  contrato de locação ainda não tenha sido firmado.
</p>

<div class="signature-area">
  <div class="signature-line"></div>
  <p style="margin: 0; font-size: 12px;">
    <strong>GarantFácil</strong><br>
    Equipe de Análise de Crédito<br>
    contato@garantfacil.com.br
  </p>
</div>

<div class="footer">
  <p>Documento gerado eletronicamente em ${new Date().toLocaleString("pt-BR")}.
     Para verificar a autenticidade, contate a GarantFácil informando o número
     do documento (${escape(analysis_id.substring(0, 8).toUpperCase())}).</p>
</div>

</body></html>`;

    const fileName = `carta_aprovacao_${analysis.inquilino_cpf.replace(/\D/g, "")}_${new Date().toISOString().slice(0, 10)}.html`;

    return new Response(
      JSON.stringify({ success: true, html, fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[generate-approval-letter]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
