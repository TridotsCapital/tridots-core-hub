-- Permitir que usuários da imobiliária atualizem sua própria agência (apenas logo_url)
CREATE POLICY "Agency users can update their own agency"
ON public.agencies
FOR UPDATE
TO authenticated
USING (
  id = get_user_agency_id(auth.uid()) 
  AND is_agency_user(auth.uid())
)
WITH CHECK (
  id = get_user_agency_id(auth.uid()) 
  AND is_agency_user(auth.uid())
);