import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if demo agency already exists
    const { data: existingAgency } = await supabaseAdmin
      .from("agencies")
      .select("id")
      .eq("cnpj", "12345678000190")
      .maybeSingle();

    if (existingAgency) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Imobiliária Demo já existe",
          agency_id: existingAgency.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create Demo Agency
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from("agencies")
      .insert({
        cnpj: "12345678000190",
        razao_social: "Demo Administradora de Imóveis Ltda",
        nome_fantasia: "Imobiliária Demo",
        email: "demo@imobiliaria.com",
        responsavel_nome: "Carlos Silva",
        responsavel_email: "carlos@imobiliaria.com",
        responsavel_telefone: "(11) 99999-0000",
        telefone: "(11) 3333-4444",
        endereco: "Av. Paulista, 1000",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01310-100",
        creci_numero: "12345-J",
        percentual_comissao_setup: 50,
        desconto_pix_percentual: 5,
        active: true,
        onboarding_completed: true,
        terms_accepted_at: new Date().toISOString(),
        internal_observations: "Imobiliária de demonstração para apresentações comerciais",
      })
      .select()
      .single();

    if (agencyError) throw agencyError;

    // 2. Create Demo User via Auth Admin
    const demoEmail = "demo@tridots.com.br";
    const demoPassword = "Demo@2025";

    // First, check if user already exists and delete it
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingDemoUser = existingUsers?.users?.find(u => u.email === demoEmail);
    
    if (existingDemoUser) {
      // Delete existing profile first
      await supabaseAdmin.from("profiles").delete().eq("id", existingDemoUser.id);
      // Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(existingDemoUser.id);
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: "Usuário Demo" },
      });

    if (authError) throw authError;

    // 3. Create Profile
    await supabaseAdmin.from("profiles").insert({
      id: authUser.user.id,
      email: demoEmail,
      full_name: "Usuário Demo",
      phone: "(11) 99999-1111",
      active: true,
    });

    // 4. Link User to Agency
    const { data: agencyUser } = await supabaseAdmin
      .from("agency_users")
      .insert({
        user_id: authUser.user.id,
        agency_id: agency.id,
        is_primary_contact: true,
      })
      .select()
      .single();

    // Add position
    if (agencyUser) {
      await supabaseAdmin.from("agency_user_positions").insert({
        agency_user_id: agencyUser.id,
        position: "diretor",
      });
    }

    // Helper functions
    const daysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };

    const monthsAgo = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d.toISOString();
    };

    const futureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };

    const generateCPF = (index: number) => {
      const base = String(10000000000 + index).slice(-11);
      return base;
    };

    // 5. Create 30 Analyses
    const analysesData = [
      // PENDENTE (5)
      { inquilino_nome: "Maria Santos", imovel_endereco: "Apt 101 - Av. Paulista, 1000", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Bela Vista", valor_aluguel: 2500, valor_condominio: 500, valor_iptu: 200, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "pendente", created_at: daysAgo(0), inquilino_profissao: "Analista de Marketing", inquilino_renda_mensal: 8000 },
      { inquilino_nome: "João Oliveira", imovel_endereco: "Casa - Rua das Flores, 45", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Vila Mariana", valor_aluguel: 3500, valor_condominio: 0, valor_iptu: 300, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "pendente", created_at: daysAgo(1), inquilino_profissao: "Engenheiro Civil", inquilino_renda_mensal: 12000 },
      { inquilino_nome: "Ana Costa", imovel_endereco: "Studio - Consolação, 200", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Consolação", valor_aluguel: 1800, valor_condominio: 400, valor_iptu: 100, plano_garantia: "start", taxa_garantia_percentual: 15, status: "pendente", created_at: daysAgo(2), inquilino_profissao: "Designer", inquilino_renda_mensal: 6000 },
      { inquilino_nome: "Pedro Lima", imovel_endereco: "Apt 202 - Moema, 350", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Moema", valor_aluguel: 4000, valor_condominio: 800, valor_iptu: 350, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "pendente", created_at: daysAgo(1), inquilino_profissao: "Advogado", inquilino_renda_mensal: 15000, conjuge_nome: "Laura Lima", conjuge_cpf: "98765432100", conjuge_renda_mensal: 8000 },
      { inquilino_nome: "Carla Mendes", imovel_endereco: "Cobertura - Itaim, 500", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Itaim Bibi", valor_aluguel: 8000, valor_condominio: 1500, valor_iptu: 600, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "pendente", created_at: daysAgo(0), inquilino_profissao: "Empresária", inquilino_renda_mensal: 35000 },

      // EM ANÁLISE (6)
      { inquilino_nome: "Lucas Souza", imovel_endereco: "Apt 303 - Pinheiros, 120", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Pinheiros", valor_aluguel: 2800, valor_condominio: 600, valor_iptu: 200, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "em_analise", created_at: daysAgo(3), inquilino_profissao: "Desenvolvedor", inquilino_renda_mensal: 10000 },
      { inquilino_nome: "Fernanda Reis", imovel_endereco: "Casa - Vila Madalena, 80", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Vila Madalena", valor_aluguel: 5500, valor_condominio: 0, valor_iptu: 400, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "em_analise", created_at: daysAgo(4), inquilino_profissao: "Arquiteta", inquilino_renda_mensal: 18000 },
      { inquilino_nome: "Roberto Alves", imovel_endereco: "Apt 404 - Jardins, 200", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Jardins", valor_aluguel: 6000, valor_condominio: 1200, valor_iptu: 450, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "em_analise", created_at: daysAgo(2), inquilino_profissao: "Consultor Autônomo", inquilino_renda_mensal: 20000 },
      { inquilino_nome: "Juliana Martins", imovel_endereco: "Studio - República, 50", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "República", valor_aluguel: 1500, valor_condominio: 350, valor_iptu: 80, plano_garantia: "start", taxa_garantia_percentual: 15, status: "em_analise", created_at: daysAgo(3), inquilino_profissao: "Estudante", inquilino_renda_mensal: 3000 },
      { inquilino_nome: "Marcos Pereira", imovel_endereco: "Apt 505 - Bela Vista, 180", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Bela Vista", valor_aluguel: 3200, valor_condominio: 700, valor_iptu: 250, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "em_analise", created_at: daysAgo(4), inquilino_profissao: "Gerente Comercial", inquilino_renda_mensal: 12000 },
      { inquilino_nome: "Patrícia Gomes", imovel_endereco: "Casa - Perdizes, 300", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Perdizes", valor_aluguel: 7000, valor_condominio: 0, valor_iptu: 500, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "em_analise", created_at: daysAgo(2), inquilino_profissao: "Diretora Financeira", inquilino_renda_mensal: 25000 },

      // AGUARDANDO PAGAMENTO (5)
      { inquilino_nome: "Thiago Santos", imovel_endereco: "Apt 606 - Vila Olímpia, 400", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Vila Olímpia", valor_aluguel: 4500, valor_condominio: 900, valor_iptu: 350, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "aguardando_pagamento", created_at: daysAgo(5), approved_at: daysAgo(1), inquilino_profissao: "Product Manager", inquilino_renda_mensal: 18000, inquilino_email: "thiago@email.com" },
      { inquilino_nome: "Camila Lima", imovel_endereco: "Casa - Alto de Pinheiros, 250", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Alto de Pinheiros", valor_aluguel: 9000, valor_condominio: 0, valor_iptu: 700, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "aguardando_pagamento", created_at: daysAgo(7), approved_at: daysAgo(2), inquilino_profissao: "Médica", inquilino_renda_mensal: 35000, inquilino_email: "camila@email.com" },
      { inquilino_nome: "Rafael Costa", imovel_endereco: "Studio - Liberdade, 30", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Liberdade", valor_aluguel: 1600, valor_condominio: 400, valor_iptu: 100, plano_garantia: "start", taxa_garantia_percentual: 15, status: "aguardando_pagamento", created_at: daysAgo(6), approved_at: daysAgo(3), inquilino_profissao: "Analista de Dados", inquilino_renda_mensal: 7000, inquilino_email: "rafael@email.com" },
      { inquilino_nome: "Amanda Oliveira", imovel_endereco: "Apt 707 - Brooklin, 280", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Brooklin", valor_aluguel: 5000, valor_condominio: 1000, valor_iptu: 400, plano_garantia: "prime", taxa_garantia_percentual: 13, status: "aguardando_pagamento", created_at: daysAgo(8), approved_at: daysAgo(2), inquilino_profissao: "Economista", inquilino_renda_mensal: 16000, inquilino_email: "amanda@email.com", rate_adjusted_by_tridots: true, original_taxa_garantia_percentual: 12 },
      { inquilino_nome: "Bruno Ferreira", imovel_endereco: "Apt 808 - Morumbi, 350", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Morumbi", valor_aluguel: 6500, valor_condominio: 1300, valor_iptu: 500, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "aguardando_pagamento", created_at: daysAgo(10), approved_at: daysAgo(4), inquilino_profissao: "CEO", inquilino_renda_mensal: 30000, inquilino_email: "bruno@email.com" },

      // ATIVO - virarão contratos (8)
      { inquilino_nome: "Daniela Rocha", imovel_endereco: "Apt 909 - Tatuapé, 150", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Tatuapé", valor_aluguel: 2200, valor_condominio: 500, valor_iptu: 150, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "ativo", created_at: monthsAgo(11), approved_at: monthsAgo(11), payments_validated_at: monthsAgo(11), inquilino_profissao: "Contadora", inquilino_renda_mensal: 9000, inquilino_email: "daniela@email.com" },
      { inquilino_nome: "Eduardo Nunes", imovel_endereco: "Casa - Santana, 200", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Santana", valor_aluguel: 4000, valor_condominio: 0, valor_iptu: 300, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "ativo", created_at: monthsAgo(6), approved_at: monthsAgo(6), payments_validated_at: monthsAgo(6), inquilino_profissao: "Engenheiro de Software", inquilino_renda_mensal: 15000, inquilino_email: "eduardo@email.com" },
      { inquilino_nome: "Fabiana Silva", imovel_endereco: "Studio - Barra Funda, 40", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Barra Funda", valor_aluguel: 1400, valor_condominio: 350, valor_iptu: 80, plano_garantia: "start", taxa_garantia_percentual: 15, status: "ativo", created_at: monthsAgo(3), approved_at: monthsAgo(3), payments_validated_at: monthsAgo(3), inquilino_profissao: "Publicitária", inquilino_renda_mensal: 6000, inquilino_email: "fabiana@email.com" },
      { inquilino_nome: "Gabriel Martins", imovel_endereco: "Apt 1010 - Lapa, 180", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Lapa", valor_aluguel: 3000, valor_condominio: 650, valor_iptu: 220, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "ativo", created_at: monthsAgo(1), approved_at: monthsAgo(1), payments_validated_at: monthsAgo(1), inquilino_profissao: "Vendedor", inquilino_renda_mensal: 10000, inquilino_email: "gabriel@email.com" },
      { inquilino_nome: "Helena Costa", imovel_endereco: "Cobertura - Higienópolis, 450", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Higienópolis", valor_aluguel: 12000, valor_condominio: 2500, valor_iptu: 900, plano_garantia: "exclusive", taxa_garantia_percentual: 10, status: "ativo", created_at: monthsAgo(8), approved_at: monthsAgo(8), payments_validated_at: monthsAgo(8), inquilino_profissao: "Empresária", inquilino_renda_mensal: 50000, inquilino_email: "helena@email.com" },
      { inquilino_nome: "Igor Almeida", imovel_endereco: "Apt 1111 - Paraíso, 200", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Paraíso", valor_aluguel: 3500, valor_condominio: 750, valor_iptu: 280, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "ativo", created_at: monthsAgo(5), approved_at: monthsAgo(5), payments_validated_at: monthsAgo(5), inquilino_profissao: "Analista de Sistemas", inquilino_renda_mensal: 12000, inquilino_email: "igor@email.com" },
      { inquilino_nome: "Jéssica Souza", imovel_endereco: "Casa - Butantã, 180", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Butantã", valor_aluguel: 2800, valor_condominio: 0, valor_iptu: 200, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "ativo", created_at: monthsAgo(4), approved_at: monthsAgo(4), payments_validated_at: monthsAgo(4), inquilino_profissao: "Professora", inquilino_renda_mensal: 8000, inquilino_email: "jessica@email.com" },
      { inquilino_nome: "Kevin Lima", imovel_endereco: "Apt 1212 - Aclimação, 120", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Aclimação", valor_aluguel: 2000, valor_condominio: 450, valor_iptu: 150, plano_garantia: "start", taxa_garantia_percentual: 15, status: "ativo", created_at: monthsAgo(2), approved_at: monthsAgo(2), payments_validated_at: monthsAgo(2), inquilino_profissao: "Músico", inquilino_renda_mensal: 7000, inquilino_email: "kevin@email.com" },

      // REPROVADA (4)
      { inquilino_nome: "Leonardo Dias", imovel_endereco: "Apt 1313 - Centro, 100", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Centro", valor_aluguel: 1800, valor_condominio: 400, valor_iptu: 120, plano_garantia: "start", taxa_garantia_percentual: 15, status: "reprovada", created_at: daysAgo(15), rejected_at: daysAgo(12), rejection_reason: "Renda insuficiente para o valor do aluguel solicitado. Comprometimento de renda acima de 35%.", inquilino_profissao: "Auxiliar Administrativo", inquilino_renda_mensal: 3500 },
      { inquilino_nome: "Mariana Ferreira", imovel_endereco: "Casa - Ipiranga, 150", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Ipiranga", valor_aluguel: 3500, valor_condominio: 0, valor_iptu: 250, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "reprovada", created_at: daysAgo(20), rejected_at: daysAgo(17), rejection_reason: "Restrição cadastral identificada em órgãos de proteção ao crédito.", inquilino_profissao: "Vendedora", inquilino_renda_mensal: 8000 },
      { inquilino_nome: "Nicolas Gomes", imovel_endereco: "Studio - Brás, 30", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Brás", valor_aluguel: 1200, valor_condominio: 300, valor_iptu: 60, plano_garantia: "start", taxa_garantia_percentual: 15, status: "reprovada", created_at: daysAgo(10), rejected_at: daysAgo(7), rejection_reason: "Documentação incompleta. Não foram apresentados comprovantes de renda dos últimos 3 meses.", inquilino_profissao: "Freelancer", inquilino_renda_mensal: 4000 },
      { inquilino_nome: "Olivia Ramos", imovel_endereco: "Apt 1414 - Cambuci, 80", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Cambuci", valor_aluguel: 2500, valor_condominio: 550, valor_iptu: 180, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "reprovada", created_at: daysAgo(14), rejected_at: daysAgo(11), rejection_reason: "Score de crédito abaixo do mínimo exigido para aprovação.", inquilino_profissao: "Recepcionista", inquilino_renda_mensal: 5000 },

      // CANCELADA (2)
      { inquilino_nome: "Paulo Henrique", imovel_endereco: "Apt 1515 - Penha, 90", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Penha", valor_aluguel: 2000, valor_condominio: 400, valor_iptu: 140, plano_garantia: "start", taxa_garantia_percentual: 15, status: "cancelada", created_at: daysAgo(25), canceled_at: daysAgo(20), inquilino_profissao: "Motorista", inquilino_renda_mensal: 6000, observacoes: "Cancelado a pedido da imobiliária. Inquilino desistiu do imóvel." },
      { inquilino_nome: "Renata Vieira", imovel_endereco: "Casa - Tucuruvi, 200", imovel_cidade: "São Paulo", imovel_estado: "SP", imovel_bairro: "Tucuruvi", valor_aluguel: 3000, valor_condominio: 0, valor_iptu: 220, plano_garantia: "prime", taxa_garantia_percentual: 12, status: "cancelada", created_at: daysAgo(18), canceled_at: daysAgo(15), inquilino_profissao: "Enfermeira", inquilino_renda_mensal: 9000, observacoes: "Cancelado: imóvel já foi alugado para outro interessado." },
    ];

    const createdAnalyses: any[] = [];

    for (let i = 0; i < analysesData.length; i++) {
      const a = analysesData[i];
      const valorTotal = a.valor_aluguel + (a.valor_condominio || 0) + (a.valor_iptu || 0);
      const garantiaAnual = valorTotal * (a.taxa_garantia_percentual / 100) * 12;

      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from("analyses")
        .insert({
          agency_id: agency.id,
          inquilino_nome: a.inquilino_nome,
          inquilino_cpf: generateCPF(i + 1),
          inquilino_email: a.inquilino_email || `inquilino${i + 1}@email.com`,
          inquilino_telefone: `(11) 9${String(8000 + i).padStart(4, "0")}-${String(1000 + i).padStart(4, "0")}`,
          inquilino_profissao: a.inquilino_profissao,
          inquilino_renda_mensal: a.inquilino_renda_mensal,
          inquilino_data_nascimento: "1990-05-15",
          imovel_endereco: a.imovel_endereco,
          imovel_cidade: a.imovel_cidade,
          imovel_estado: a.imovel_estado,
          imovel_bairro: a.imovel_bairro,
          imovel_cep: "01310-100",
          valor_aluguel: a.valor_aluguel,
          valor_condominio: a.valor_condominio,
          valor_iptu: a.valor_iptu,
          plano_garantia: a.plano_garantia,
          taxa_garantia_percentual: a.taxa_garantia_percentual,
          garantia_anual: garantiaAnual,
          setup_fee: 200,
          status: a.status as any,
          created_at: a.created_at,
          approved_at: a.approved_at || null,
          rejected_at: a.rejected_at || null,
          rejection_reason: a.rejection_reason || null,
          canceled_at: a.canceled_at || null,
          payments_validated_at: a.payments_validated_at || null,
          conjuge_nome: a.conjuge_nome || null,
          conjuge_cpf: a.conjuge_cpf || null,
          conjuge_renda_mensal: a.conjuge_renda_mensal || null,
          rate_adjusted_by_tridots: a.rate_adjusted_by_tridots || false,
          original_taxa_garantia_percentual: a.original_taxa_garantia_percentual || null,
          observacoes: a.observacoes || null,
        })
        .select()
        .single();

      if (analysisError) {
        console.error("Error creating analysis:", analysisError);
        continue;
      }

      createdAnalyses.push(analysis);

      // Create timeline event for each analysis
      await supabaseAdmin.from("analysis_timeline").insert({
        analysis_id: analysis.id,
        event_type: "status_change",
        description: "Análise criada pela imobiliária",
        created_at: a.created_at,
      });

      if (a.status === "em_analise" || a.status === "aguardando_pagamento" || a.status === "ativo") {
        await supabaseAdmin.from("analysis_timeline").insert({
          analysis_id: analysis.id,
          event_type: "status_change",
          description: "Análise iniciada pela equipe Tridots",
          created_at: daysAgo(Math.floor(Math.random() * 3) + 1),
        });
      }

      if (a.approved_at) {
        await supabaseAdmin.from("analysis_timeline").insert({
          analysis_id: analysis.id,
          event_type: "status_change",
          description: "Análise aprovada",
          created_at: a.approved_at,
        });
      }

      if (a.rejected_at) {
        await supabaseAdmin.from("analysis_timeline").insert({
          analysis_id: analysis.id,
          event_type: "status_change",
          description: `Análise reprovada: ${a.rejection_reason}`,
          created_at: a.rejected_at,
        });
      }
    }

    // 6. Create Contracts for "ativo" analyses (indices 16-23)
    const activeAnalyses = createdAnalyses.filter((a) => a.status === "ativo");
    const createdContracts: any[] = [];
    const contractConfigs = [
      { monthsActive: 11, docsComplete: true, status: "ativo" }, // Daniela - renovação próxima
      { monthsActive: 6, docsComplete: true, status: "ativo" }, // Eduardo
      { monthsActive: 3, docsComplete: true, status: "ativo" }, // Fabiana
      { monthsActive: 1, docsComplete: false, status: "documentacao_pendente" }, // Gabriel
      { monthsActive: 8, docsComplete: true, status: "ativo" }, // Helena
      { monthsActive: 5, docsComplete: true, status: "ativo" }, // Igor - com claim
      { monthsActive: 4, docsComplete: false, status: "documentacao_pendente" }, // Jéssica
      { monthsActive: 2, docsComplete: true, status: "ativo" }, // Kevin
    ];

    for (let i = 0; i < activeAnalyses.length && i < contractConfigs.length; i++) {
      const analysis = activeAnalyses[i];
      const config = contractConfigs[i];
      const contractEndDate = futureDate(config.monthsActive === 11 ? 30 : 365 - config.monthsActive * 30);

      const { data: contract, error: contractError } = await supabaseAdmin
        .from("contracts")
        .insert({
          agency_id: agency.id,
          analysis_id: analysis.id,
          status: config.status as any,
          data_fim_contrato: contractEndDate,
          created_at: monthsAgo(config.monthsActive),
          activated_at: config.docsComplete ? monthsAgo(config.monthsActive - 1) : null,
          doc_contrato_locacao_status: config.docsComplete ? "aprovado" : "pendente",
          doc_contrato_locacao_name: config.docsComplete ? "contrato_locacao.pdf" : null,
          doc_contrato_locacao_uploaded_at: config.docsComplete ? monthsAgo(config.monthsActive) : null,
          doc_contrato_administrativo_status: config.docsComplete ? "aprovado" : i === 3 ? "pendente" : "aprovado",
          doc_contrato_administrativo_name: config.docsComplete || i === 6 ? "contrato_administrativo.pdf" : null,
          doc_vistoria_inicial_status: config.docsComplete ? "aprovado" : "pendente",
          doc_vistoria_inicial_name: config.docsComplete ? "vistoria_inicial.pdf" : null,
          doc_seguro_incendio_status: config.docsComplete ? "aprovado" : i === 6 ? "rejeitado" : "pendente",
          doc_seguro_incendio_name: config.docsComplete || i === 6 ? "seguro_incendio.pdf" : null,
          doc_seguro_incendio_feedback: i === 6 ? "Documento vencido. Por favor, envie a apólice atualizada." : null,
          payer_name: analysis.inquilino_nome,
          payer_cpf: analysis.inquilino_cpf,
          payer_email: analysis.inquilino_email,
          payer_is_tenant: true,
        })
        .select()
        .single();

      if (contractError) {
        console.error("Error creating contract:", contractError);
        continue;
      }

      createdContracts.push(contract);

      // Create commissions for active contracts
      if (config.status === "ativo") {
        const valorTotal = analysis.valor_aluguel + (analysis.valor_condominio || 0) + (analysis.valor_iptu || 0);
        const setupValue = valorTotal * (analysis.taxa_garantia_percentual / 100) * 12 * 0.5; // 50% setup

        // Setup commission
        await supabaseAdmin.from("commissions").insert({
          agency_id: agency.id,
          analysis_id: analysis.id,
          type: "setup",
          valor: setupValue,
          base_calculo: valorTotal * 12,
          percentual_comissao: 50,
          status: "paga",
          data_pagamento: monthsAgo(config.monthsActive - 1),
          mes_referencia: new Date(monthsAgo(config.monthsActive)).getMonth() + 1,
          ano_referencia: new Date(monthsAgo(config.monthsActive)).getFullYear(),
        });

        // Recurring commissions
        for (let m = 1; m <= config.monthsActive; m++) {
          const recurringValue = valorTotal * (analysis.taxa_garantia_percentual / 100) * 0.1; // 10% recurring
          const commissionDate = monthsAgo(config.monthsActive - m);
          const isPaid = m <= config.monthsActive - 1;

          await supabaseAdmin.from("commissions").insert({
            agency_id: agency.id,
            analysis_id: analysis.id,
            type: "recorrente",
            valor: recurringValue,
            base_calculo: valorTotal,
            percentual_comissao: 10,
            status: isPaid ? "paga" : "pendente",
            data_pagamento: isPaid ? commissionDate : null,
            mes_referencia: new Date(commissionDate).getMonth() + 1,
            ano_referencia: new Date(commissionDate).getFullYear(),
          });
        }
      }
    }

    // 7. Create Chat Messages for some analyses
    const analysisWithChat = createdAnalyses.find((a) => a.inquilino_nome === "Marcos Pereira");
    if (analysisWithChat) {
      await supabaseAdmin.from("internal_chat").insert([
        { analysis_id: analysisWithChat.id, sender_id: authUser.user.id, message: "Bom dia, há previsão de conclusão da análise?", created_at: daysAgo(2) },
        { analysis_id: analysisWithChat.id, sender_id: authUser.user.id, message: "Obrigado pela atualização!", created_at: daysAgo(0) },
      ]);
    }

    const analysisAguardando = createdAnalyses.find((a) => a.inquilino_nome === "Thiago Santos");
    if (analysisAguardando) {
      await supabaseAdmin.from("internal_chat").insert([
        { analysis_id: analysisAguardando.id, sender_id: authUser.user.id, message: "O inquilino disse que não recebeu o email com o link.", created_at: daysAgo(1) },
      ]);
    }

    // 8. Create Tickets
    const ticketsData = [
      { subject: "Dúvida sobre taxa de garantia", category: "financeiro", priority: "normal", status: "aberto", analysis_id: null, contract_id: null, claim_id: null },
      { subject: "Não consigo fazer upload de documento", category: "tecnico", priority: "alta", status: "em_atendimento", analysis_id: analysisWithChat?.id, contract_id: null, claim_id: null },
      { subject: "Preciso de 2ª via do boleto", category: "comercial", priority: "normal", status: "aguardando_cliente", analysis_id: null, contract_id: createdContracts[1]?.id, claim_id: null },
      { subject: "Inquilino não recebeu o link de aceite", category: "urgente", priority: "urgente", status: "em_atendimento", analysis_id: analysisAguardando?.id, contract_id: null, claim_id: null },
      { subject: "Como funciona a renovação de contrato?", category: "comercial", priority: "baixa", status: "resolvido", analysis_id: null, contract_id: null, claim_id: null },
      { subject: "Erro ao acessar área de documentos", category: "tecnico", priority: "normal", status: "aberto", analysis_id: null, contract_id: createdContracts[3]?.id, claim_id: null },
      { subject: "Solicitar aditivo contratual", category: "comercial", priority: "normal", status: "resolvido", analysis_id: null, contract_id: createdContracts[0]?.id, claim_id: null },
    ];

    const createdTickets: any[] = [];
    for (const t of ticketsData) {
      const { data: ticket } = await supabaseAdmin
        .from("tickets")
        .insert({
          agency_id: agency.id,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          created_by: authUser.user.id,
          analysis_id: t.analysis_id,
          contract_id: t.contract_id,
          claim_id: t.claim_id,
          created_at: daysAgo(Math.floor(Math.random() * 10)),
        })
        .select()
        .single();

      if (ticket) {
        createdTickets.push(ticket);

        // Add initial message
        await supabaseAdmin.from("ticket_messages").insert({
          ticket_id: ticket.id,
          sender_id: authUser.user.id,
          message: `Olá, ${t.subject.toLowerCase()}. Podem me ajudar?`,
          created_at: ticket.created_at,
        });

        if (t.status !== "aberto") {
          await supabaseAdmin.from("ticket_messages").insert({
            ticket_id: ticket.id,
            sender_id: authUser.user.id,
            message: "Obrigado pelo retorno!",
            created_at: daysAgo(Math.floor(Math.random() * 3)),
          });
        }
      }
    }

    // 9. Create Claims
    const igorContract = createdContracts.find((c) => {
      const analysis = activeAnalyses.find((a) => a.id === c.analysis_id);
      return analysis?.inquilino_nome === "Igor Almeida";
    });

    const eduardoContract = createdContracts.find((c) => {
      const analysis = activeAnalyses.find((a) => a.id === c.analysis_id);
      return analysis?.inquilino_nome === "Eduardo Nunes";
    });

    const danielaContract = createdContracts.find((c) => {
      const analysis = activeAnalyses.find((a) => a.id === c.analysis_id);
      return analysis?.inquilino_nome === "Daniela Rocha";
    });

    const fabianaContract = createdContracts.find((c) => {
      const analysis = activeAnalyses.find((a) => a.id === c.analysis_id);
      return analysis?.inquilino_nome === "Fabiana Silva";
    });

    const claimsData = [
      { contract: igorContract, public_status: "solicitado", internal_status: "triagem", total: 7000 },
      { contract: eduardoContract, public_status: "em_analise_tecnica", internal_status: "coleta_documentos", total: 12500 },
      { contract: danielaContract, public_status: "pagamento_programado", internal_status: "aguardando_pagamento", total: 4400 },
      { contract: fabianaContract, public_status: "finalizado", internal_status: "encerrado", total: 2800 },
    ];

    const createdClaims: any[] = [];
    for (const c of claimsData) {
      if (!c.contract) continue;

      const { data: claim } = await supabaseAdmin
        .from("claims")
        .insert({
          agency_id: agency.id,
          contract_id: c.contract.id,
          created_by: authUser.user.id,
          public_status: c.public_status as any,
          internal_status: c.internal_status as any,
          total_claimed_value: c.total,
          observations: "Solicitação de garantia por inadimplência do inquilino.",
          created_at: daysAgo(c.public_status === "finalizado" ? 60 : c.public_status === "pagamento_programado" ? 30 : 10),
        })
        .select()
        .single();

      if (claim) {
        createdClaims.push(claim);

        // Create claim items
        const numMonths = Math.ceil(c.total / 3500);
        for (let m = 0; m < numMonths; m++) {
          await supabaseAdmin.from("claim_items").insert({
            claim_id: claim.id,
            category: "aluguel",
            amount: m === numMonths - 1 ? c.total - 3500 * m : 3500,
            reference_period: `${new Date().getFullYear()}-${String(new Date().getMonth() - m).padStart(2, "0")}`,
            due_date: daysAgo(30 + m * 30).split("T")[0],
          });
        }

        // Create claim timeline
        await supabaseAdmin.from("claim_timeline").insert({
          claim_id: claim.id,
          event_type: "created",
          description: "Solicitação de garantia criada",
          created_at: claim.created_at,
        });
      }
    }

    // Add ticket linked to claim
    if (createdClaims[0]) {
      const { data: claimTicket } = await supabaseAdmin
        .from("tickets")
        .insert({
          agency_id: agency.id,
          subject: "Dúvida sobre cobertura do sinistro",
          category: "financeiro",
          priority: "alta",
          status: "em_atendimento",
          created_by: authUser.user.id,
          claim_id: createdClaims[0].id,
          created_at: daysAgo(5),
        })
        .select()
        .single();

      if (claimTicket) {
        await supabaseAdmin.from("ticket_messages").insert({
          ticket_id: claimTicket.id,
          sender_id: authUser.user.id,
          message: "Gostaria de saber quais valores estão cobertos pela garantia neste sinistro.",
          created_at: claimTicket.created_at,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Imobiliária Demo criada com sucesso!",
        data: {
          agency: { id: agency.id, nome: agency.nome_fantasia },
          user: { email: demoEmail, password: demoPassword },
          analyses: createdAnalyses.length,
          contracts: createdContracts.length,
          tickets: createdTickets.length + 1,
          claims: createdClaims.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in seed-demo-agency:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
