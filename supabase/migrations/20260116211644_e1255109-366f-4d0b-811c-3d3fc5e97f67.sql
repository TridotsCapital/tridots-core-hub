-- RLS policy for agency users to view their own commissions
CREATE POLICY "Agency users can view own commissions" 
ON commissions 
FOR SELECT 
USING (
  agency_id IN (
    SELECT agency_id FROM agency_users 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'analyst')
  )
);