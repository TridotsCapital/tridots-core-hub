-- Create function_logs table for structured logging
CREATE TABLE IF NOT EXISTS public.function_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  duration_ms INTEGER,
  error_details JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT function_logs_level_check CHECK (level IN ('info', 'warn', 'error'))
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON public.function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_level ON public.function_logs(level);
CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON public.function_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_function_logs_function_level ON public.function_logs(function_name, level);

-- Enable RLS (disabled by default - logs are internal)
ALTER TABLE public.function_logs DISABLE ROW LEVEL SECURITY;

-- Grant access to service role only
GRANT SELECT ON public.function_logs TO authenticated;
