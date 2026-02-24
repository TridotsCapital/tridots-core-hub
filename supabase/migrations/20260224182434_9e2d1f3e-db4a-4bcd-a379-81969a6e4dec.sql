-- Add INSERT policy for team members on analysis_documents
CREATE POLICY "Team members can upload analysis documents"
ON public.analysis_documents
FOR INSERT
TO authenticated
WITH CHECK (has_any_role(auth.uid()) AND (uploaded_by = auth.uid()));

-- Add SELECT policy for team members on analysis_documents
CREATE POLICY "Team members can view all analysis documents"
ON public.analysis_documents
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid()));