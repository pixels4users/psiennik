CREATE OR REPLACE FUNCTION private.notify_email_dispatch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'private', 'public', 'net', 'extensions'
AS $function$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT value INTO v_url FROM private.app_config WHERE key = 'notify_endpoint';
  SELECT value INTO v_secret FROM private.app_config WHERE key = 'notify_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
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
  RAISE WARNING 'notify_email_dispatch failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;