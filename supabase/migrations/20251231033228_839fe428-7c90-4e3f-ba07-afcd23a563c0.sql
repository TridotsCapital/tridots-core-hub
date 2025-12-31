-- 1. Função auxiliar para obter agency_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_agency_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.agency_users 
  WHERE user_id = user_uuid 
  LIMIT 1;
$$;

-- 2. Função para verificar se é agency_user
CREATE OR REPLACE FUNCTION public.is_agency_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_users WHERE user_id = _user_id
  )
$$;

-- 3. Policy para agency_user visualizar análises da sua imobiliária
CREATE POLICY "Agency users can view their analyses"
ON public.analyses FOR SELECT
USING (
  agency_id = public.get_user_agency_id(auth.uid())
);

-- 4. Policy para agency_user criar análises para sua imobiliária
CREATE POLICY "Agency users can create analyses"
ON public.analyses FOR INSERT
WITH CHECK (
  agency_id = public.get_user_agency_id(auth.uid())
  AND public.is_agency_user(auth.uid())
);

-- 5. Policy para agency_user visualizar chat das suas análises
CREATE POLICY "Agency users can view their chat"
ON public.internal_chat FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses a
    WHERE a.id = internal_chat.analysis_id
    AND a.agency_id = public.get_user_agency_id(auth.uid())
  )
);

-- 6. Policy para agency_user enviar mensagens no chat (análise não finalizada)
CREATE POLICY "Agency users can send messages"
ON public.internal_chat FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.analyses a
    WHERE a.id = analysis_id
    AND a.agency_id = public.get_user_agency_id(auth.uid())
    AND a.status NOT IN ('cancelada', 'ativo')
  )
);

-- 7. Policy para agency_user visualizar documentos das suas análises
CREATE POLICY "Agency users can view their documents"
ON public.analysis_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses a
    WHERE a.id = analysis_documents.analysis_id
    AND a.agency_id = public.get_user_agency_id(auth.uid())
  )
);

-- 8. Policy para agency_user fazer upload de documentos nas suas análises
CREATE POLICY "Agency users can upload documents"
ON public.analysis_documents FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND public.is_agency_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.analyses a
    WHERE a.id = analysis_id
    AND a.agency_id = public.get_user_agency_id(auth.uid())
  )
);

-- 9. Storage policies para agency_user acessar anexos do chat
CREATE POLICY "Agency users can view chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' 
  AND public.is_agency_user(auth.uid())
);

CREATE POLICY "Agency users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND public.is_agency_user(auth.uid())
);

-- 10. Storage policies para agency_user acessar documentos de análise
CREATE POLICY "Agency users can view analysis documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analysis-documents' 
  AND public.is_agency_user(auth.uid())
);

CREATE POLICY "Agency users can upload analysis documents storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-documents' 
  AND public.is_agency_user(auth.uid())
);