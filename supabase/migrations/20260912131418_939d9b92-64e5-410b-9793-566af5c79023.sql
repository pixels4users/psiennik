CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.has_dog_access(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dog_access WHERE dog_id = _dog_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.is_dog_owner(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dogs WHERE id = _dog_id AND owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.shares_dog(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access a
    JOIN public.dog_access b ON a.dog_id = b.dog_id
    WHERE a.user_id = _a AND b.user_id = _b
  )
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'behaviorist' THEN 'behaviorist'::public.app_role ELSE 'owner'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_new_dog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.dog_access (dog_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (dog_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
    NEW.commented_at := now();
  END IF;

  IF NOT private.is_dog_owner(NEW.dog_id, auth.uid()) THEN
    NEW.dog_id := OLD.dog_id;
    NEW.date := OLD.date;
    NEW.title := OLD.title;
    NEW.activity_type := OLD.activity_type;
    NEW.time_of_day := OLD.time_of_day;
    NEW.description := OLD.description;
    NEW.rating := OLD.rating;
    NEW.created_at := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite public.dog_invites;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  SELECT * INTO invite FROM public.dog_invites WHERE upper(code) = upper(btrim(_code));

  IF invite IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono takiego kodu';
  END IF;
  IF invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ten kod został już wykorzystany';
  END IF;
  IF invite.expires_at < now() THEN
    RAISE EXCEPTION 'Ten kod wygasł';
  END IF;

  INSERT INTO public.dog_access (dog_id, user_id, role)
  VALUES (invite.dog_id, auth.uid(), 'behaviorist')
  ON CONFLICT (dog_id, user_id) DO NOTHING;

  UPDATE public.dog_invites SET used_by = auth.uid(), used_at = now() WHERE id = invite.id;

  RETURN invite.dog_id;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_dog_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;

-- repoint triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP TRIGGER IF EXISTS on_dog_created ON public.dogs;
CREATE TRIGGER on_dog_created AFTER INSERT ON public.dogs
FOR EACH ROW EXECUTE FUNCTION private.handle_new_dog();

DROP TRIGGER IF EXISTS guard_entry_update_trigger ON public.entries;
CREATE TRIGGER guard_entry_update_trigger BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_update();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- repoint policies
DROP POLICY "profiles_select_self_or_shared" ON public.profiles;
CREATE POLICY "profiles_select_self_or_shared" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR private.shares_dog(id, auth.uid()));

DROP POLICY "user_roles_select_self_or_shared" ON public.user_roles;
CREATE POLICY "user_roles_select_self_or_shared" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.shares_dog(user_id, auth.uid()));

DROP POLICY "dog_access_select" ON public.dog_access;
CREATE POLICY "dog_access_select" ON public.dog_access
FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "dog_access_insert_owner" ON public.dog_access;
CREATE POLICY "dog_access_insert_owner" ON public.dog_access
FOR INSERT TO authenticated WITH CHECK (private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "dog_access_delete" ON public.dog_access;
CREATE POLICY "dog_access_delete" ON public.dog_access
FOR DELETE TO authenticated USING (private.is_dog_owner(dog_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY "dogs_select_access" ON public.dogs;
CREATE POLICY "dogs_select_access" ON public.dogs
FOR SELECT TO authenticated USING (private.has_dog_access(id, auth.uid()));

DROP POLICY "entries_select_access" ON public.entries;
CREATE POLICY "entries_select_access" ON public.entries
FOR SELECT TO authenticated USING (private.has_dog_access(dog_id, auth.uid()));

DROP POLICY "entries_insert_owner" ON public.entries;
CREATE POLICY "entries_insert_owner" ON public.entries
FOR INSERT TO authenticated WITH CHECK (private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "entries_update_access" ON public.entries;
CREATE POLICY "entries_update_access" ON public.entries
FOR UPDATE TO authenticated
USING (private.has_dog_access(dog_id, auth.uid()))
WITH CHECK (private.has_dog_access(dog_id, auth.uid()));

DROP POLICY "entries_delete_owner" ON public.entries;
CREATE POLICY "entries_delete_owner" ON public.entries
FOR DELETE TO authenticated USING (private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "dog_invites_select_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_select_owner" ON public.dog_invites
FOR SELECT TO authenticated USING (private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "dog_invites_insert_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_insert_owner" ON public.dog_invites
FOR INSERT TO authenticated WITH CHECK (private.is_dog_owner(dog_id, auth.uid()) AND created_by = auth.uid());

DROP POLICY "dog_invites_delete_owner" ON public.dog_invites;
CREATE POLICY "dog_invites_delete_owner" ON public.dog_invites
FOR DELETE TO authenticated USING (private.is_dog_owner(dog_id, auth.uid()));

DROP POLICY "dog_views_all_self" ON public.dog_views;
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