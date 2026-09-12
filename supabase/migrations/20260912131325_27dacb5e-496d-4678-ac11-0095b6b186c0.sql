-- clean out anonymous-era data
DELETE FROM public.entries;
DELETE FROM public.dogs;

DROP POLICY IF EXISTS "Public access to entries" ON public.entries;
DROP POLICY IF EXISTS "Public access to dogs" ON public.dogs;

-- roles
CREATE TYPE public.app_role AS ENUM ('owner', 'behaviorist');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  email_notifications boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dog_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dog_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.dog_access TO authenticated;
GRANT ALL ON public.dog_access TO service_role;
ALTER TABLE public.dog_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dog_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.dog_invites TO authenticated;
GRANT ALL ON public.dog_invites TO service_role;
ALTER TABLE public.dog_invites ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dog_views (
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dog_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dog_views TO authenticated;
GRANT ALL ON public.dog_views TO service_role;
ALTER TABLE public.dog_views ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS commented_at timestamptz;
ALTER TABLE public.dogs ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.dogs ALTER COLUMN owner_id SET NOT NULL;

-- helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_dog_access(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dog_access WHERE dog_id = _dog_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_dog_owner(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dogs WHERE id = _dog_id AND owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.shares_dog(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access a
    JOIN public.dog_access b ON a.dog_id = b.dog_id
    WHERE a.user_id = _a AND b.user_id = _b
  )
$$;

-- new user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- owner access row on dog creation
CREATE OR REPLACE FUNCTION public.handle_new_dog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.dog_access (dog_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (dog_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_dog_created
AFTER INSERT ON public.dogs
FOR EACH ROW EXECUTE FUNCTION public.handle_new_dog();

-- behaviorists may only touch the comment
CREATE OR REPLACE FUNCTION public.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
    NEW.commented_at := now();
  END IF;

  IF NOT public.is_dog_owner(NEW.dog_id, auth.uid()) THEN
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

CREATE TRIGGER guard_entry_update_trigger
BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.guard_entry_update();

-- invite redemption
CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite public.dog_invites;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  SELECT * INTO invite FROM public.dog_invites
  WHERE upper(code) = upper(btrim(_code));

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

  UPDATE public.dog_invites
  SET used_by = auth.uid(), used_at = now()
  WHERE id = invite.id;

  RETURN invite.dog_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;

-- policies
CREATE POLICY "profiles_select_self_or_shared" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.shares_dog(id, auth.uid()));

CREATE POLICY "profiles_insert_self" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_self_or_shared" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.shares_dog(user_id, auth.uid()));

CREATE POLICY "dog_access_select" ON public.dog_access
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "dog_access_insert_owner" ON public.dog_access
FOR INSERT TO authenticated WITH CHECK (public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "dog_access_delete" ON public.dog_access
FOR DELETE TO authenticated
USING (public.is_dog_owner(dog_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "dogs_select_access" ON public.dogs
FOR SELECT TO authenticated USING (public.has_dog_access(id, auth.uid()));

CREATE POLICY "dogs_insert_owner" ON public.dogs
FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_update_owner" ON public.dogs
FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_delete_owner" ON public.dogs
FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "entries_select_access" ON public.entries
FOR SELECT TO authenticated USING (public.has_dog_access(dog_id, auth.uid()));

CREATE POLICY "entries_insert_owner" ON public.entries
FOR INSERT TO authenticated WITH CHECK (public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "entries_update_access" ON public.entries
FOR UPDATE TO authenticated
USING (public.has_dog_access(dog_id, auth.uid()))
WITH CHECK (public.has_dog_access(dog_id, auth.uid()));

CREATE POLICY "entries_delete_owner" ON public.entries
FOR DELETE TO authenticated USING (public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "dog_invites_select_owner" ON public.dog_invites
FOR SELECT TO authenticated USING (public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "dog_invites_insert_owner" ON public.dog_invites
FOR INSERT TO authenticated
WITH CHECK (public.is_dog_owner(dog_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "dog_invites_delete_owner" ON public.dog_invites
FOR DELETE TO authenticated USING (public.is_dog_owner(dog_id, auth.uid()));

CREATE POLICY "dog_views_all_self" ON public.dog_views
FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.has_dog_access(dog_id, auth.uid()));

-- storage: dog photos for signed-in users
CREATE POLICY "dog_photos_select" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'dog-photos');

CREATE POLICY "dog_photos_insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dog-photos');

CREATE POLICY "dog_photos_update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'dog-photos');

CREATE POLICY "dog_photos_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'dog-photos');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();