-- 1. Tabela powiadomień
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Użytkownik może zmienić wyłącznie moment przeczytania.
CREATE OR REPLACE FUNCTION private.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.dog_id := OLD.dog_id;
  NEW.entry_id := OLD.entry_id;
  NEW.actor_id := OLD.actor_id;
  NEW.kind := OLD.kind;
  NEW.title := OLD.title;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  IF NEW.read_at IS NOT NULL THEN
    NEW.read_at := COALESCE(OLD.read_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_notification_update_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION private.guard_notification_update();

-- 2. Preferencje e-mail w profilu
ALTER TABLE public.profiles
  ADD COLUMN notify_entries boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_recommendations boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_access boolean NOT NULL DEFAULT true;

-- 3. Pomocnicze funkcje
CREATE OR REPLACE FUNCTION private.actor_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(NULLIF(btrim(display_name), ''), split_part(COALESCE(email, ''), '@', 1), 'Ktoś')
  FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION private.dog_name(_dog_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT name FROM public.dogs WHERE id = _dog_id
$$;

-- Wstawia powiadomienie dla wskazanych osób przy psie.
-- _audience: 'all' (wszyscy z dostępem), 'managers' (właściciel i współwłaściciele)
CREATE OR REPLACE FUNCTION private.notify_dog_audience(
  _dog_id uuid,
  _actor_id uuid,
  _kind text,
  _title text,
  _body text,
  _entry_id uuid DEFAULT NULL,
  _audience text DEFAULT 'all'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, dog_id, entry_id, actor_id, kind, title, body)
  SELECT DISTINCT a.user_id, _dog_id, _entry_id, _actor_id, _kind, _title, _body
  FROM public.dog_access a
  WHERE a.dog_id = _dog_id
    AND a.user_id IS DISTINCT FROM _actor_id
    AND (
      _audience = 'all'
      OR (_audience = 'managers' AND a.role = 'owner')
    )
    AND (a.role = 'owner' OR a.process_status = 'active');
END;
$$;

-- 4. Wyzwalacze zdarzeń
CREATE OR REPLACE FUNCTION private.notify_entry_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.notify_dog_audience(
    NEW.dog_id,
    auth.uid(),
    'entry',
    private.actor_name(auth.uid()) || ' dodał(a) wydarzenie w dzienniku psa ' || COALESCE(private.dog_name(NEW.dog_id), ''),
    NEW.title,
    NEW.id,
    'all'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_entry_insert_trigger
AFTER INSERT ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.notify_entry_insert();

CREATE OR REPLACE FUNCTION private.notify_entry_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(btrim(NEW.behaviorist_comment), '') <> ''
     AND NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
    PERFORM private.notify_dog_audience(
      NEW.dog_id,
      auth.uid(),
      'recommendation',
      private.actor_name(auth.uid()) || ' dodał(a) zalecenie dla psa ' || COALESCE(private.dog_name(NEW.dog_id), ''),
      NEW.title,
      NEW.id,
      'managers'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_entry_update_trigger
AFTER UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.notify_entry_update();

CREATE OR REPLACE FUNCTION private.notify_comment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dog_id uuid := private.entry_dog_id(NEW.entry_id);
BEGIN
  PERFORM private.notify_dog_audience(
    v_dog_id,
    NEW.author_id,
    'comment',
    private.actor_name(NEW.author_id) || ' skomentował(a) wydarzenie psa ' || COALESCE(private.dog_name(v_dog_id), ''),
    left(NEW.body, 160),
    NEW.entry_id,
    'all'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_comment_insert_trigger
AFTER INSERT ON public.entry_comments
FOR EACH ROW EXECUTE FUNCTION private.notify_comment_insert();

CREATE OR REPLACE FUNCTION private.notify_access_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dog text := COALESCE(private.dog_name(NEW.dog_id), '');
  v_who text := private.actor_name(NEW.user_id);
BEGIN
  IF NEW.user_id = (SELECT owner_id FROM public.dogs WHERE id = NEW.dog_id) THEN
    RETURN NEW;
  END IF;

  PERFORM private.notify_dog_audience(
    NEW.dog_id,
    NEW.user_id,
    'access_granted',
    CASE WHEN NEW.role = 'behaviorist'
      THEN v_who || ' ma teraz dostęp do dziennika psa ' || v_dog
      ELSE v_who || ' dołączył(a) jako współwłaściciel psa ' || v_dog
    END,
    NULL,
    NULL,
    'all'
  );

  INSERT INTO public.notifications (user_id, dog_id, actor_id, kind, title, body)
  VALUES (
    NEW.user_id,
    NEW.dog_id,
    NEW.user_id,
    'access_granted',
    'Masz dostęp do dziennika psa ' || v_dog,
    NULL
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_access_insert_trigger
AFTER INSERT ON public.dog_access
FOR EACH ROW EXECUTE FUNCTION private.notify_access_insert();

CREATE OR REPLACE FUNCTION private.notify_access_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dog text := COALESCE(private.dog_name(OLD.dog_id), '');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.dogs WHERE id = OLD.dog_id) THEN
    RETURN OLD;
  END IF;

  PERFORM private.notify_dog_audience(
    OLD.dog_id,
    auth.uid(),
    'access_revoked',
    private.actor_name(OLD.user_id) || ' nie ma już dostępu do dziennika psa ' || v_dog,
    NULL,
    NULL,
    'managers'
  );

  IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.notifications (user_id, dog_id, actor_id, kind, title, body)
    VALUES (OLD.user_id, NULL, auth.uid(), 'access_revoked', 'Twój dostęp do dziennika psa ' || v_dog || ' został zakończony', NULL);
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_access_delete_trigger
AFTER DELETE ON public.dog_access
FOR EACH ROW EXECUTE FUNCTION private.notify_access_delete();

CREATE OR REPLACE FUNCTION private.notify_access_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.process_status = 'completed' AND OLD.process_status IS DISTINCT FROM 'completed' THEN
    PERFORM private.notify_dog_audience(
      NEW.dog_id,
      auth.uid(),
      'process_completed',
      'Współpraca przy psie ' || COALESCE(private.dog_name(NEW.dog_id), '') || ' została zakończona',
      NULL,
      NULL,
      'all'
    );

    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      INSERT INTO public.notifications (user_id, dog_id, actor_id, kind, title, body)
      VALUES (NEW.user_id, NEW.dog_id, auth.uid(), 'process_completed',
              'Współpraca przy psie ' || COALESCE(private.dog_name(NEW.dog_id), '') || ' została zakończona', NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_access_update_trigger
AFTER UPDATE ON public.dog_access
FOR EACH ROW EXECUTE FUNCTION private.notify_access_update();