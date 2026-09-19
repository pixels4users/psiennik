CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS private.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO private.app_config (key, value)
VALUES ('notify_endpoint', 'https://project--f71e2a3c-8761-4645-ad08-008348dd3b40.lovable.app/api/public/notifications/send')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION private.notify_email_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT value INTO v_url FROM private.app_config WHERE key = 'notify_endpoint';
  SELECT value INTO v_secret FROM private.app_config WHERE key = 'notify_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_email_dispatch_trigger ON public.notifications;
CREATE TRIGGER notify_email_dispatch_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.notify_email_dispatch();