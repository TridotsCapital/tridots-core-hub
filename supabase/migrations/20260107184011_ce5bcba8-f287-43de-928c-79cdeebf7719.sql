-- Fase 1: Corrigir RLS de agency_users para permitir ver todos os colaboradores da mesma agência
CREATE POLICY "Agency users can view all members of their agency"
ON public.agency_users
FOR SELECT
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fase 2: Criar enum e tabela de funções de colaboradores
CREATE TYPE public.agency_position AS ENUM ('dono', 'gerente', 'auxiliar');

CREATE TABLE public.agency_user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES public.agency_users(id) ON DELETE CASCADE,
  position public.agency_position NOT NULL DEFAULT 'auxiliar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_user_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_agency_user_positions_updated_at
  BEFORE UPDATE ON public.agency_user_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS na tabela de posições
ALTER TABLE public.agency_user_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view positions in their agency"
ON public.agency_user_positions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.id = agency_user_positions.agency_user_id
    AND au.agency_id = get_user_agency_id(auth.uid())
  )
);

CREATE POLICY "Agency users can update their own position"
ON public.agency_user_positions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.id = agency_user_positions.agency_user_id
    AND au.user_id = auth.uid()
  )
);

CREATE POLICY "Agency users can insert their own position"
ON public.agency_user_positions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agency_users au
    WHERE au.id = agency_user_positions.agency_user_id
    AND au.user_id = auth.uid()
  )
);

CREATE POLICY "Masters can manage all positions"
ON public.agency_user_positions FOR ALL
USING (is_master(auth.uid()));

-- Fase 3: Adicionar campo de telefone na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN phone TEXT;

-- Fase 4: Criar bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

-- Políticas de storage para avatares
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);