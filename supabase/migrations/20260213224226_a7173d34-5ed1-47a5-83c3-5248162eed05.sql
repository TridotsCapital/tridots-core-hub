-- Allow analysts to update agencies (save changes, activate/deactivate)
CREATE POLICY "Analysts can update agencies"
ON public.agencies
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'analyst'::app_role))
WITH CHECK (has_role(auth.uid(), 'analyst'::app_role));
