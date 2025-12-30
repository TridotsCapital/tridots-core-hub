-- =============================================
-- FASE 1: FUNDAÇÃO DO BANCO DE DADOS TRIDOTS GARANTIA
-- =============================================

-- 1.1 ENUMS
-- -----------------------------------------

-- Roles do sistema interno
CREATE TYPE public.app_role AS ENUM ('master', 'analyst');

-- Status das análises
CREATE TYPE public.analysis_status AS ENUM ('pendente', 'em_analise', 'aprovada', 'reprovada', 'cancelada');

-- Status das comissões
CREATE TYPE public.commission_status AS ENUM ('pendente', 'paga', 'cancelada', 'estornada');

-- Tipo de comissão
CREATE TYPE public.commission_type AS ENUM ('setup', 'recorrente');

-- 1.2 TABELAS
-- -----------------------------------------

-- Perfis de usuários internos (equipe TRIDOTS)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles separada (segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Imobiliárias
CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    responsavel_nome TEXT NOT NULL,
    responsavel_email TEXT,
    responsavel_telefone TEXT,
    percentual_comissao_recorrente DECIMAL(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Análises de crédito
CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    analyst_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status analysis_status NOT NULL DEFAULT 'pendente',
    
    -- Dados do Inquilino
    inquilino_nome TEXT NOT NULL,
    inquilino_cpf TEXT NOT NULL,
    inquilino_rg TEXT,
    inquilino_data_nascimento DATE,
    inquilino_email TEXT,
    inquilino_telefone TEXT,
    inquilino_profissao TEXT,
    inquilino_renda_mensal DECIMAL(12,2),
    inquilino_empresa TEXT,
    
    -- Dados do Cônjuge (quando aplicável)
    conjuge_nome TEXT,
    conjuge_cpf TEXT,
    conjuge_rg TEXT,
    conjuge_data_nascimento DATE,
    conjuge_profissao TEXT,
    conjuge_renda_mensal DECIMAL(12,2),
    conjuge_empresa TEXT,
    
    -- Dados do Imóvel
    imovel_endereco TEXT NOT NULL,
    imovel_numero TEXT,
    imovel_complemento TEXT,
    imovel_bairro TEXT,
    imovel_cidade TEXT NOT NULL,
    imovel_estado TEXT NOT NULL,
    imovel_cep TEXT,
    imovel_tipo TEXT,
    imovel_proprietario_nome TEXT,
    imovel_proprietario_cpf_cnpj TEXT,
    
    -- Valores
    valor_aluguel DECIMAL(12,2) NOT NULL,
    valor_condominio DECIMAL(12,2) DEFAULT 0,
    valor_iptu DECIMAL(12,2) DEFAULT 0,
    valor_outros_encargos DECIMAL(12,2) DEFAULT 0,
    valor_total DECIMAL(12,2) GENERATED ALWAYS AS (valor_aluguel + COALESCE(valor_condominio, 0) + COALESCE(valor_iptu, 0) + COALESCE(valor_outros_encargos, 0)) STORED,
    
    -- Setup Fee (valor absoluto definido pela imobiliária)
    setup_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Observações
    observacoes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ
);

-- Comissões
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE RESTRICT,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
    type commission_type NOT NULL,
    status commission_status NOT NULL DEFAULT 'pendente',
    valor DECIMAL(12,2) NOT NULL,
    mes_referencia INTEGER, -- 1-12 para recorrentes
    ano_referencia INTEGER,
    data_pagamento TIMESTAMPTZ,
    data_estorno TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bucket de storage para anexos do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('chat-attachments', 'chat-attachments', false, 5368709120);

-- Chat interno
CREATE TABLE public.internal_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 ÍNDICES
-- -----------------------------------------

CREATE INDEX idx_analyses_agency ON public.analyses(agency_id);
CREATE INDEX idx_analyses_analyst ON public.analyses(analyst_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

CREATE INDEX idx_commissions_analysis ON public.commissions(analysis_id);
CREATE INDEX idx_commissions_agency ON public.commissions(agency_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_type ON public.commissions(type);

CREATE INDEX idx_chat_analysis ON public.internal_chat(analysis_id);
CREATE INDEX idx_chat_created_at ON public.internal_chat(created_at DESC);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 1.4 FUNÇÕES
-- -----------------------------------------

-- Função para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para verificar se é master
CREATE OR REPLACE FUNCTION public.is_master(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'master')
$$;

-- Função para verificar se tem alguma role (autenticado no sistema)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
    )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- 1.5 TRIGGERS
-- -----------------------------------------

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON public.agencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 1.6 RLS POLICIES
-- -----------------------------------------

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Team members can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- USER_ROLES (apenas master pode gerenciar)
CREATE POLICY "Team members can view roles"
    ON public.user_roles FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Masters can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_master(auth.uid()));

-- AGENCIES (apenas master pode criar/editar, todos da equipe podem ver)
CREATE POLICY "Team members can view agencies"
    ON public.agencies FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Masters can manage agencies"
    ON public.agencies FOR ALL
    USING (public.is_master(auth.uid()));

-- ANALYSES (todos da equipe podem ver e gerenciar)
CREATE POLICY "Team members can view analyses"
    ON public.analyses FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can create analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can update analyses"
    ON public.analyses FOR UPDATE
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Masters can delete analyses"
    ON public.analyses FOR DELETE
    USING (public.is_master(auth.uid()));

-- COMMISSIONS (master tem controle total, analyst pode visualizar)
CREATE POLICY "Team members can view commissions"
    ON public.commissions FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Masters can manage commissions"
    ON public.commissions FOR ALL
    USING (public.is_master(auth.uid()));

-- INTERNAL_CHAT (equipe pode ver e enviar, não pode editar/deletar)
CREATE POLICY "Team members can view chat"
    ON public.internal_chat FOR SELECT
    USING (public.has_any_role(auth.uid()));

CREATE POLICY "Team members can send messages"
    ON public.internal_chat FOR INSERT
    WITH CHECK (public.has_any_role(auth.uid()) AND sender_id = auth.uid());

-- AUDIT_LOGS (apenas inserção, master pode visualizar)
CREATE POLICY "Masters can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_master(auth.uid()));

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- STORAGE POLICIES para chat-attachments
CREATE POLICY "Team members can view attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-attachments' AND public.has_any_role(auth.uid()));

CREATE POLICY "Team members can upload attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'chat-attachments' AND public.has_any_role(auth.uid()));

-- Enable realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chat;