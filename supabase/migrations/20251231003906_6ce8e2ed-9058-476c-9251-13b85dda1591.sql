-- Criar tabela agency_users para vincular usuários a imobiliárias
CREATE TABLE public.agency_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  is_primary_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agency_id)
);

-- Enable RLS
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;

-- Policies para agency_users
CREATE POLICY "Users can view their own agency links"
ON public.agency_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage agency users"
ON public.agency_users
FOR ALL
USING (public.is_master(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_agency_users_updated_at
BEFORE UPDATE ON public.agency_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();