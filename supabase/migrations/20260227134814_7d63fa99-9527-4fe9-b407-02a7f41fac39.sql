
-- 1. Update analyses DELETE policy to allow both master and analyst
DROP POLICY "Masters can delete analyses" ON analyses;
CREATE POLICY "Team members can delete analyses"
  ON analyses FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 2. Update analysis_documents DELETE policy
DROP POLICY "Masters can delete documents" ON analysis_documents;
CREATE POLICY "Team members can delete analysis documents"
  ON analysis_documents FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 3. Add DELETE policy for analysis_timeline
CREATE POLICY "Team members can delete timeline events"
  ON analysis_timeline FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 4. Add DELETE policy for commissions (masters already have ALL, add for analysts)
CREATE POLICY "Analysts can delete commissions"
  ON commissions FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 5. Add DELETE policy for tickets (needed for cascade cleanup)
CREATE POLICY "Team members can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 6. Add DELETE policy for ticket_messages (needed for cascade cleanup)
CREATE POLICY "Team members can delete ticket messages"
  ON ticket_messages FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 7. Add DELETE policy for digital_acceptances (FK to analyses)
CREATE POLICY "Team members can delete digital acceptances"
  ON digital_acceptances FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));

-- 8. Add DELETE policy for internal_notes related to analysis
-- Already has delete policy for own notes, add general for team cleanup
