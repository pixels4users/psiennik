CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER TABLE public.dog_invites ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'behaviorist';
ALTER TABLE public.dog_access ADD COLUMN IF NOT EXISTS process_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_active_dogs int NOT NULL DEFAULT 2;

CREATE TABLE IF NOT EXISTS public.behaviorist_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  behaviorist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (behaviorist_id)
);
GRANT SELECT, UPDATE ON public.behaviorist_links TO authenticated;
GRANT ALL ON public.behaviorist_links TO service_role;
ALTER TABLE public.behaviorist_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "behaviorist_links_select_own" ON public.behaviorist_links;
CREATE POLICY "behaviorist_links_select_own" ON public.behaviorist_links
FOR SELECT TO authenticated USING (behaviorist_id = auth.uid());
DROP POLICY IF EXISTS "behaviorist_links_update_own" ON public.behaviorist_links;
CREATE POLICY "behaviorist_links_update_own" ON public.behaviorist_links
FOR UPDATE TO authenticated USING (behaviorist_id = auth.uid()) WITH CHECK (behaviorist_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.owner_behaviorists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  behaviorist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (owner_id, behaviorist_id)
);
GRANT SELECT ON public.owner_behaviorists TO authenticated;
GRANT ALL ON public.owner_behaviorists TO service_role;
ALTER TABLE public.owner_behaviorists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_behaviorists_select_participants" ON public.owner_behaviorists;
CREATE POLICY "owner_behaviorists_select_participants" ON public.owner_behaviorists
FOR SELECT TO authenticated USING (owner_id = auth.uid() OR behaviorist_id = auth.uid());

INSERT INTO public.dog_access (dog_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.dogs
ON CONFLICT (dog_id, user_id) DO NOTHING;

INSERT INTO public.behaviorist_links (behaviorist_id, invite_code)
SELECT user_id, 'BEH-' || upper(substring(gen_random_uuid()::text,1,8))
FROM public.user_roles
WHERE role = 'behaviorist'
ON CONFLICT (behaviorist_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.count_active_behaviorist_dogs(_behaviorist_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int
  FROM public.dog_access
  WHERE user_id = _behaviorist_id AND role = 'behaviorist' AND process_status = 'active'
$$;

CREATE OR REPLACE FUNCTION private.can_manage_dog(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access
    WHERE dog_id = _dog_id AND user_id = _user_id AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION private.all_behaviorists_completed(_dog_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dog_access WHERE dog_id = _dog_id AND role = 'behaviorist')
  AND NOT EXISTS (SELECT 1 FROM public.dog_access WHERE dog_id = _dog_id AND role = 'behaviorist' AND process_status = 'active')
$$;

CREATE OR REPLACE FUNCTION private.can_edit_entries(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.can_manage_dog(_dog_id, _user_id)
  AND NOT private.all_behaviorists_completed(_dog_id)
$$;

CREATE OR REPLACE FUNCTION private.guard_profile_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type OR NEW.max_active_dogs IS DISTINCT FROM OLD.max_active_dogs THEN
    RAISE EXCEPTION 'Nie możesz samodzielnie zmienić planu ani limitu.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_profile_plan_trigger ON public.profiles;
CREATE TRIGGER guard_profile_plan_trigger BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.guard_profile_plan();

CREATE OR REPLACE FUNCTION private.guard_dog_access_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
  v_max int;
BEGIN
  IF NEW.role != 'behaviorist' OR NEW.process_status != 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(max_active_dogs, 2) INTO v_max
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT count(*)::int INTO v_count
  FROM public.dog_access
  WHERE user_id = NEW.user_id AND role = 'behaviorist' AND process_status = 'active';

  IF TG_OP = 'UPDATE' AND OLD.process_status = 'active' THEN
    v_count := v_count - 1;
  END IF;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Osiągnąłeś limit aktywnych procesów w planie darmowym (%/%). Zakończ jeden z procesów, aby zwolnić miejsce.', v_count, v_max
      USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_dog_access_limit_trigger ON public.dog_access;
CREATE TRIGGER guard_dog_access_limit_trigger BEFORE INSERT OR UPDATE OF process_status ON public.dog_access
FOR EACH ROW EXECUTE FUNCTION private.guard_dog_access_limit();

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'behaviorist' THEN 'behaviorist'::public.app_role ELSE 'owner'::public.app_role END;

  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_role = 'behaviorist' THEN
    INSERT INTO public.behaviorist_links (behaviorist_id, invite_code)
    VALUES (NEW.id, 'BEH-' || upper(substring(gen_random_uuid()::text,1,8)))
    ON CONFLICT (behaviorist_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_new_dog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  link public.owner_behaviorists%ROWTYPE;
BEGIN
  INSERT INTO public.dog_access (dog_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (dog_id, user_id) DO NOTHING;

  FOR link IN SELECT * FROM public.owner_behaviorists WHERE owner_id = NEW.owner_id
  LOOP
    BEGIN
      INSERT INTO public.dog_access (dog_id, user_id, role, process_status)
      VALUES (NEW.id, link.behaviorist_id, 'behaviorist', 'active');
    EXCEPTION WHEN SQLSTATE 'P0002' THEN
      INSERT INTO public.dog_access (dog_id, user_id, role, process_status)
      VALUES (NEW.id, link.behaviorist_id, 'behaviorist', 'pending')
      ON CONFLICT (dog_id, user_id) DO NOTHING;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
    NEW.commented_at := now();
  END IF;

  IF NOT private.can_manage_dog(NEW.dog_id, auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.dog_access
      WHERE dog_id = NEW.dog_id AND user_id = auth.uid() AND role = 'behaviorist' AND process_status = 'active'
    ) THEN
      RAISE EXCEPTION 'Brak uprawnień do edycji tego wpisu';
    END IF;
    NEW.dog_id := OLD.dog_id;
    NEW.date := OLD.date;
    NEW.title := OLD.title;
    NEW.activity_type := OLD.activity_type;
    NEW.time_of_day := OLD.time_of_day;
    NEW.description := OLD.description;
    NEW.rating := OLD.rating;
    NEW.created_at := OLD.created_at;
  ELSE
    IF private.all_behaviorists_completed(NEW.dog_id) THEN
      RAISE EXCEPTION 'Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.redeem_dog_invite(text) CASCADE;
DROP TYPE IF EXISTS public.redeem_result CASCADE;
CREATE TYPE public.redeem_result AS (dog_id uuid, behaviorist_id uuid);

CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS public.redeem_result LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text := upper(btrim(_code));
  v_behaviorist_id uuid;
  v_first_dog_id uuid;
  invite public.dog_invites;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  SELECT behaviorist_id INTO v_behaviorist_id
  FROM public.behaviorist_links
  WHERE upper(invite_code) = v_code AND is_active = true;

  IF v_behaviorist_id IS NOT NULL THEN
    INSERT INTO public.owner_behaviorists (owner_id, behaviorist_id)
    VALUES (auth.uid(), v_behaviorist_id)
    ON CONFLICT (owner_id, behaviorist_id) DO NOTHING;
    RETURN (null, v_behaviorist_id)::public.redeem_result;
  END IF;

  SELECT * INTO invite FROM public.dog_invites WHERE upper(code) = v_code LIMIT 1;

  IF invite IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono takiego kodu';
  END IF;

  IF EXISTS (SELECT 1 FROM public.dog_invites WHERE upper(code) = v_code AND used_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Ten kod został już wykorzystany';
  END IF;

  IF EXISTS (SELECT 1 FROM public.dog_invites WHERE upper(code) = v_code AND expires_at < now()) THEN
    RAISE EXCEPTION 'Ten kod wygasł';
  END IF;

  FOR invite IN SELECT * FROM public.dog_invites WHERE upper(code) = v_code
  LOOP
    INSERT INTO public.dog_access (dog_id, user_id, role, process_status)
    VALUES (invite.dog_id, auth.uid(), invite.role, 'active')
    ON CONFLICT (dog_id, user_id) DO NOTHING;
    IF v_first_dog_id IS NULL THEN
      v_first_dog_id := invite.dog_id;
    END IF;
  END LOOP;

  UPDATE public.dog_invites SET used_by = auth.uid(), used_at = now() WHERE upper(code) = v_code;

  RETURN (v_first_dog_id, null)::public.redeem_result;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_dog_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_behavioral_process(p_dog_id uuid, p_behaviorist_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_behaviorist_id THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  UPDATE public.dog_access
  SET process_status = 'completed'
  WHERE dog_id = p_dog_id AND user_id = p_behaviorist_id AND role = 'behaviorist';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono aktywnej współpracy';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_behavioral_process(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_behavioral_process(uuid, uuid) TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP TRIGGER IF EXISTS on_dog_created ON public.dogs;
CREATE TRIGGER on_dog_created AFTER INSERT ON public.dogs
FOR EACH ROW EXECUTE FUNCTION private.handle_new_dog();

DROP TRIGGER IF EXISTS guard_entry_update_trigger ON public.entries;
CREATE TRIGGER guard_entry_update_trigger BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_update();

DROP POLICY IF EXISTS "profiles_select_self_or_shared" ON public.profiles;
CREATE POLICY "profiles_select_self_or_shared" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR private.shares_dog(id, auth.uid()));

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "user_roles_select_self_or_shared" ON public.user_roles;
CREATE POLICY "user_roles_select_self_or_shared" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.shares_dog(user_id, auth.uid()));

DROP POLICY IF EXISTS "dog_access_select" ON public.dog_access;
CREATE POLICY "dog_access_select" ON public.dog_access
FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.can_manage_dog(dog_id, auth.uid()));

DROP POLICY IF EXISTS "dog_access_insert_owner" ON public.dog_access;
CREATE POLICY "dog_access_insert_owner" ON public.dog_access
FOR INSERT TO authenticated WITH CHECK (
  (role = 'owner' AND private.is_dog_owner(dog_id, auth.uid()))
  OR (role = 'behaviorist' AND private.can_manage_dog(dog_id, auth.uid()))
);

DROP POLICY IF EXISTS "dog_access_delete" ON public.dog_access;
CREATE POLICY "dog_access_delete" ON public.dog_access
FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR (private.is_dog_owner(dog_id, auth.uid()) AND user_id != auth.uid())
  OR (private.can_manage_dog(dog_id, auth.uid()) AND role = 'behaviorist' AND user_id != auth.uid())
);

DROP POLICY IF EXISTS "dog_access_update" ON public.dog_access;
CREATE POLICY "dog_access_update" ON public.dog_access
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND role = 'behaviorist')
WITH CHECK (user_id = auth.uid() AND role = 'behaviorist');

DROP POLICY IF EXISTS "dogs_select_access" ON public.dogs;
CREATE POLICY "dogs_select_access" ON public.dogs
FOR SELECT TO authenticated USING (private.has_dog_access(id, auth.uid()));

DROP POLICY IF EXISTS "dogs_update_owner" ON public.dogs;
CREATE POLICY "dogs_update_owner" ON public.dogs
FOR UPDATE TO authenticated
USING (private.can_manage_dog(id, auth.uid()))
WITH CHECK (private.can_manage_dog(id, auth.uid()));

DROP POLICY IF EXISTS "dogs_delete_owner" ON public.dogs;
CREATE POLICY "dogs_delete_owner" ON public.dogs
FOR DELETE TO authenticated USING (private.is_dog_owner(id, auth.uid()));

DROP POLICY IF EXISTS "entries_select_access" ON public.entries;
CREATE POLICY "entries_select_access" ON public.entries
FOR SELECT TO authenticated USING (private.has_dog_access(dog_id, auth.uid()));

DROP POLICY IF EXISTS "entries_insert_owner" ON public.entries;
CREATE POLICY "entries_insert_can_edit" ON public.entries
FOR INSERT TO authenticated WITH CHECK (private.can_edit_entries(dog_id, auth.uid()));

DROP POLICY IF EXISTS "entries_update_access" ON public.entries;
CREATE POLICY "entries_update_access" ON public.entries
FOR UPDATE TO authenticated
USING (private.has_dog_access(dog_id, auth.uid()))
WITH CHECK (private.has_dog_access(dog_id, auth.uid()));

DROP POLICY IF EXISTS "entries_delete_owner" ON public.entries;
CREATE POLICY "entries_delete_can_edit" ON public.entries
FOR DELETE TO authenticated USING (private.can_edit_entries(dog_id, auth.uid()));

DROP POLICY IF EXISTS "dog_invites_select_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_select_owner" ON public.dog_invites
FOR SELECT TO authenticated USING (private.can_manage_dog(dog_id, auth.uid()));

DROP POLICY IF EXISTS "dog_invites_insert_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_insert_owner" ON public.dog_invites
FOR INSERT TO authenticated WITH CHECK (
  private.can_manage_dog(dog_id, auth.uid())
  AND created_by = auth.uid()
  AND (role != 'owner' OR private.is_dog_owner(dog_id, auth.uid()))
);

DROP POLICY IF EXISTS "dog_invites_delete_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_delete_owner" ON public.dog_invites
FOR DELETE TO authenticated USING (private.can_manage_dog(dog_id, auth.uid()));

DROP POLICY IF EXISTS "dog_views_all_self" ON public.dog_views;
CREATE POLICY "dog_views_all_self" ON public.dog_views
FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND private.has_dog_access(dog_id, auth.uid()));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_dog_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_dog_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.shares_dog(uuid, uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_dog();
DROP FUNCTION IF EXISTS public.guard_entry_update();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
