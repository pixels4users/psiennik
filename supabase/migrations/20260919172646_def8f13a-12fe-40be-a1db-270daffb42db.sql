INSERT INTO private.app_config (key, value)
VALUES ('notify_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_dispatch_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT value FROM private.app_config WHERE key = 'notify_secret';
$$;

REVOKE ALL ON FUNCTION public.notify_dispatch_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_dispatch_secret() TO service_role;