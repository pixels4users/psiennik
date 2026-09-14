-- 1. Nowe kolumny rejestru akceptacji
ALTER TABLE public.legal_acceptances
  ADD COLUMN IF NOT EXISTS account_ref text,
  ADD COLUMN IF NOT EXISTS contract_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_after date,
  ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_hold_reason text,
  ADD COLUMN IF NOT EXISTS legal_hold_review_on date,
  ADD COLUMN IF NOT EXISTS legal_hold_owner text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Wpis ma przeżyć usunięcie konta: zrywamy powiązanie zamiast kasować wiersz.
ALTER TABLE public.legal_acceptances
  DROP CONSTRAINT IF EXISTS legal_acceptances_user_id_fkey;
ALTER TABLE public.legal_acceptances
  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.legal_acceptances
  ADD CONSTRAINT legal_acceptances_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Uzupełniamy account_ref dla istniejących wierszy.
UPDATE public.legal_acceptances SET account_ref = user_id::text WHERE account_ref IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS legal_acceptances_idempotency_key_uidx
  ON public.legal_acceptances (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS legal_acceptances_purge_idx
  ON public.legal_acceptances (purge_after) WHERE legal_hold = false;

CREATE INDEX IF NOT EXISTS legal_acceptances_account_ref_idx
  ON public.legal_acceptances (account_ref);

-- 2. Reguły spójności wpisu
CREATE OR REPLACE FUNCTION private.guard_legal_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Zawsze zapisujemy techniczny identyfikator konta obok powiązania.
    IF NEW.account_ref IS NULL THEN
      NEW.account_ref := NEW.user_id::text;
    END IF;
    -- Czas zdarzenia wyłącznie z serwera bazy.
    NEW.created_at := now();
    -- Powiadomienie bez ustalonego terminu usunięcia nie może powstać:
    -- dany rodzaj powiadomienia uruchamiamy dopiero po ustaleniu jego retencji.
    IF NEW.event_kind = 'notification' AND NEW.purge_after IS NULL THEN
      RAISE EXCEPTION 'Powiadomienie wymaga ustalonej daty usunięcia (purge_after)';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Zapis jest niezmienny w części dowodowej.
    IF NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.event_kind IS DISTINCT FROM OLD.event_kind
       OR NEW.document_kind IS DISTINCT FROM OLD.document_kind
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.method IS DISTINCT FROM OLD.method
       OR NEW.account_ref IS DISTINCT FROM OLD.account_ref THEN
      RAISE EXCEPTION 'Treść dowodowa wpisu jest niezmienna';
    END IF;
    -- Termin powiadomienia można tylko skrócić, nigdy wydłużyć.
    IF OLD.event_kind = 'notification' AND OLD.purge_after IS NOT NULL
       AND (NEW.purge_after IS NULL OR NEW.purge_after > OLD.purge_after) THEN
      RAISE EXCEPTION 'Terminu usunięcia powiadomienia nie można wydłużyć';
    END IF;
  END IF;

  -- Blokada na czas sporu wymaga uzasadnienia, daty przeglądu i osoby odpowiedzialnej.
  IF NEW.legal_hold AND (
       NEW.legal_hold_reason IS NULL OR btrim(NEW.legal_hold_reason) = ''
       OR NEW.legal_hold_review_on IS NULL
       OR NEW.legal_hold_owner IS NULL OR btrim(NEW.legal_hold_owner) = ''
     ) THEN
    RAISE EXCEPTION 'Blokada wymaga uzasadnienia, daty przeglądu i osoby odpowiedzialnej';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_legal_acceptance_trigger ON public.legal_acceptances;
CREATE TRIGGER guard_legal_acceptance_trigger
  BEFORE INSERT OR UPDATE ON public.legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION private.guard_legal_acceptance();

-- 3. Zamknięcie umowy: termin liczymy od zakończenia umowy, tylko dla akceptacji.
CREATE OR REPLACE FUNCTION private.close_legal_contract(_user_id uuid, _ended_at timestamptz DEFAULT now())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Akceptacje: koniec szóstego roku kalendarzowego po roku zakończenia umowy.
  UPDATE public.legal_acceptances
     SET contract_ended_at = COALESCE(contract_ended_at, _ended_at),
         purge_after = make_date(EXTRACT(YEAR FROM COALESCE(contract_ended_at, _ended_at))::int + 6, 12, 31)
   WHERE user_id = _user_id
     AND event_kind = 'acceptance';

  -- Powiadomienia: zachowują swój wcześniejszy, krótszy termin.
  UPDATE public.legal_acceptances
     SET contract_ended_at = COALESCE(contract_ended_at, _ended_at)
   WHERE user_id = _user_id
     AND event_kind = 'notification';
END;
$$;

-- 4. Automatyczne usuwanie po upływie terminu
CREATE OR REPLACE FUNCTION private.purge_legal_acceptances()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.legal_acceptances
   WHERE legal_hold = false
     AND purge_after IS NOT NULL
     AND purge_after < current_date;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.unschedule('purge-legal-acceptances')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-legal-acceptances');

SELECT cron.schedule(
  'purge-legal-acceptances',
  '17 3 * * *',
  $cron$SELECT private.purge_legal_acceptances();$cron$
);