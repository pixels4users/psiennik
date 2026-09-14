CREATE TABLE public.legal_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_kind text NOT NULL CHECK (document_kind IN ('terms', 'privacy')),
  version text NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('acceptance', 'notification')),
  method text NOT NULL CHECK (method IN ('email', 'google', 'apple', 'change_screen')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own legal acceptance records"
ON public.legal_acceptances
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can insert legal acceptance records"
ON public.legal_acceptances
FOR INSERT
TO service_role
WITH CHECK (true);