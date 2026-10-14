CREATE OR REPLACE FUNCTION private.guard_dog_access_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Aplikacja jest darmowa: brak limitu aktywnych procesów behawiorysty.
  RETURN NEW;
END;
$$;

UPDATE public.dog_access SET process_status = 'active' WHERE process_status = 'pending';

COMMENT ON COLUMN public.profiles.max_active_dogs IS 'DEPRECATED: no active-process limit, app is free';
COMMENT ON COLUMN public.profiles.plan_type IS 'DEPRECATED: no paid plans, app is free';

CREATE OR REPLACE FUNCTION private.photo_quota_ok(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public AS $$
  SELECT COALESCE(sum((metadata->>'size')::bigint), 0) < 20 * 1024 * 1024
  FROM storage.objects
  WHERE owner = _user_id AND bucket_id = 'dog-photos';
$$;

DROP POLICY IF EXISTS dog_photos_quota ON storage.objects;
CREATE POLICY dog_photos_quota ON storage.objects AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'dog-photos' OR private.photo_quota_ok(auth.uid()));