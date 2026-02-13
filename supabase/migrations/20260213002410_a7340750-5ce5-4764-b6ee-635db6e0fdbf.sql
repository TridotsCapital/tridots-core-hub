-- Enable RLS on function_logs and add read policy for authenticated users
ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;

-- Masters can read all logs
CREATE POLICY "Masters can read function logs"
ON public.function_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'master'
  )
);

-- Service role can insert (edge functions use service role)
CREATE POLICY "Service role can insert function logs"
ON public.function_logs
FOR INSERT
WITH CHECK (true);
