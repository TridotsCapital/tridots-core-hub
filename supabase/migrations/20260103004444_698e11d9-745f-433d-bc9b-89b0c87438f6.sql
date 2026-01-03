-- Fix RLS policy for satisfaction_surveys UPDATE
DROP POLICY IF EXISTS "Agency users can update their pending surveys" ON public.satisfaction_surveys;

CREATE POLICY "Agency users can update their pending surveys"
ON public.satisfaction_surveys FOR UPDATE TO public
USING (agency_id = get_user_agency_id(auth.uid()) AND rating IS NULL)
WITH CHECK (agency_id = get_user_agency_id(auth.uid()));