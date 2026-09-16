-- 1. Tabela komentarzy
CREATE TABLE public.entry_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role text NOT NULL CHECK (author_role IN ('owner','co_owner','behaviorist')),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX entry_comments_entry_created_idx
  ON public.entry_comments (entry_id, created_at, id);

GRANT SELECT, INSERT, UPDATE ON public.entry_comments TO authenticated;
GRANT ALL ON public.entry_comments TO service_role;

ALTER TABLE public.entry_comments ENABLE ROW LEVEL SECURITY;

-- 2. Funkcje pomocnicze
CREATE OR REPLACE FUNCTION private.entry_dog_id(_entry_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT dog_id FROM public.entries WHERE id = _entry_id
$$;

CREATE OR REPLACE FUNCTION private.is_active_behaviorist(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access
    WHERE dog_id = _dog_id AND user_id = _user_id
      AND role = 'behaviorist' AND process_status = 'active'
  )
$$;

-- kto może pisać w dyskusji: wyłącznie w ramach aktywnego procesu
CREATE OR REPLACE FUNCTION private.can_discuss_dog(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access
    WHERE dog_id = _dog_id AND role = 'behaviorist' AND process_status = 'active'
  )
  AND (
    private.can_manage_dog(_dog_id, _user_id)
    OR private.is_active_behaviorist(_dog_id, _user_id)
  )
$$;

-- 3. Polityki RLS
CREATE POLICY entry_comments_select_access ON public.entry_comments
FOR SELECT TO authenticated
USING (private.has_dog_access(private.entry_dog_id(entry_id), auth.uid()));

CREATE POLICY entry_comments_insert_author ON public.entry_comments
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
);

CREATE POLICY entry_comments_update_author ON public.entry_comments
FOR UPDATE TO authenticated
USING (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
)
WITH CHECK (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
);

-- brak polityki DELETE: trwałe kasowanie z aplikacji jest niemożliwe

-- 4. Trigger pilnujący pól i znaczników czasu
CREATE OR REPLACE FUNCTION private.guard_entry_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dog_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_dog_id := private.entry_dog_id(NEW.entry_id);
    NEW.author_id := auth.uid();
    NEW.created_at := now();
    NEW.edited_at := NULL;
    NEW.deleted_at := NULL;
    NEW.body := btrim(NEW.body);
    NEW.author_role := CASE
      WHEN private.is_dog_owner(v_dog_id, auth.uid()) THEN 'owner'
      WHEN private.can_manage_dog(v_dog_id, auth.uid()) THEN 'co_owner'
      WHEN private.is_active_behaviorist(v_dog_id, auth.uid()) THEN 'behaviorist'
      ELSE NULL
    END;
    IF NEW.author_role IS NULL THEN
      RAISE EXCEPTION 'Brak uprawnień do komentowania tego wydarzenia';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE

  -- Wyjątek: techniczna anonimizacja autora po usunięciu konta
  IF OLD.author_id IS NOT NULL AND NEW.author_id IS NULL THEN
    IF NEW.id IS NOT DISTINCT FROM OLD.id
       AND NEW.entry_id IS NOT DISTINCT FROM OLD.entry_id
       AND NEW.author_role IS NOT DISTINCT FROM OLD.author_role
       AND NEW.body IS NOT DISTINCT FROM OLD.body
       AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
       AND NEW.edited_at IS NOT DISTINCT FROM OLD.edited_at
       AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Nie można zmienić autora komentarza';
  END IF;

  IF OLD.author_id IS NULL OR OLD.author_id <> auth.uid() THEN
    RAISE EXCEPTION 'Możesz zmienić tylko własny komentarz';
  END IF;

  v_dog_id := private.entry_dog_id(OLD.entry_id);
  IF NOT private.can_discuss_dog(v_dog_id, auth.uid()) THEN
    RAISE EXCEPTION 'Proces został zakończony. Dyskusja jest tylko do odczytu.';
  END IF;

  NEW.id := OLD.id;
  NEW.entry_id := OLD.entry_id;
  NEW.author_id := OLD.author_id;
  NEW.author_role := OLD.author_role;
  NEW.created_at := OLD.created_at;

  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Komentarz został usunięty i nie można go zmienić';
  END IF;

  IF NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_at := now();
    NEW.body := '';
    NEW.edited_at := OLD.edited_at;
  ELSE
    NEW.deleted_at := NULL;
    NEW.body := btrim(NEW.body);
    IF NEW.body IS DISTINCT FROM OLD.body THEN
      NEW.edited_at := now();
    ELSE
      NEW.edited_at := OLD.edited_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_entry_comment_trigger
BEFORE INSERT OR UPDATE ON public.entry_comments
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_comment();

ALTER TABLE public.entry_comments DROP CONSTRAINT entry_comments_body_check;
ALTER TABLE public.entry_comments ADD CONSTRAINT entry_comments_body_check CHECK (
  (deleted_at IS NULL AND length(btrim(body)) BETWEEN 1 AND 4000)
  OR (deleted_at IS NOT NULL AND body = '')
);

-- 5. Uszczelnienie zapisu wydarzeń
CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dog_id uuid := OLD.dog_id;
BEGIN
  NEW.id := OLD.id;
  NEW.dog_id := OLD.dog_id;
  NEW.created_at := OLD.created_at;

  IF private.can_manage_dog(v_dog_id, auth.uid()) THEN
    IF private.all_behaviorists_completed(v_dog_id) THEN
      RAISE EXCEPTION 'Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu.';
    END IF;
    NEW.behaviorist_comment := OLD.behaviorist_comment;
    NEW.commented_at := OLD.commented_at;
  ELSIF private.is_active_behaviorist(v_dog_id, auth.uid()) THEN
    NEW.date := OLD.date;
    NEW.title := OLD.title;
    NEW.activity_type := OLD.activity_type;
    NEW.time_of_day := OLD.time_of_day;
    NEW.activity_types := OLD.activity_types;
    NEW.times_of_day := OLD.times_of_day;
    NEW.description := OLD.description;
    NEW.rating := OLD.rating;
    IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
      NEW.commented_at := now();
    ELSE
      NEW.commented_at := OLD.commented_at;
    END IF;
  ELSE
    RAISE EXCEPTION 'Brak uprawnień do edycji tego wpisu';
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Ochrona tworzenia wydarzeń
CREATE OR REPLACE FUNCTION private.guard_entry_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.behaviorist_comment IS NOT NULL AND btrim(NEW.behaviorist_comment) <> '' THEN
    RAISE EXCEPTION 'Zalecenie może dodać wyłącznie aktywny behawiorysta do istniejącego wydarzenia';
  END IF;
  IF NEW.commented_at IS NOT NULL THEN
    RAISE EXCEPTION 'Data zalecenia jest ustawiana przez system';
  END IF;
  NEW.behaviorist_comment := NULL;
  NEW.commented_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_entry_insert_trigger
BEFORE INSERT ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_insert();