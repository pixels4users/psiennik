ALTER TABLE public.entries ADD COLUMN video_path text, ADD COLUMN video_size bigint, ADD COLUMN video_url text;
ALTER TABLE public.entries ADD CONSTRAINT entries_video_one_kind CHECK (video_path IS NULL OR video_url IS NULL);
ALTER TABLE public.entries ADD CONSTRAINT entries_video_size_max CHECK (video_size IS NULL OR video_size <= 20 * 1024 * 1024);
ALTER TABLE public.entries ADD CONSTRAINT entries_video_url_https CHECK (video_url IS NULL OR (video_url ~ '^https://' AND length(video_url) <= 500));

CREATE OR REPLACE FUNCTION private.photo_quota_ok(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public AS $$
  SELECT COALESCE(sum((metadata->>'size')::bigint), 0) < 50 * 1024 * 1024
  FROM storage.objects
  WHERE owner = _user_id AND bucket_id IN ('dog-photos', 'dog-videos');
$$;

DROP POLICY IF EXISTS dog_photos_quota ON storage.objects;
CREATE POLICY dog_photos_quota ON storage.objects AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (bucket_id NOT IN ('dog-photos', 'dog-videos') OR private.photo_quota_ok(auth.uid()));

CREATE POLICY dog_videos_select_access ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dog-videos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.has_dog_access(((storage.foldername(name))[1])::uuid, auth.uid()));

CREATE POLICY dog_videos_insert_access ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dog-videos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_edit_entries(((storage.foldername(name))[1])::uuid, auth.uid()));

CREATE POLICY dog_videos_delete_access ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dog-videos' AND (owner = auth.uid() OR (
  (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_edit_entries(((storage.foldername(name))[1])::uuid, auth.uid()))));

CREATE OR REPLACE FUNCTION public.my_storage_usage()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public AS $$
  SELECT COALESCE(sum((metadata->>'size')::bigint), 0)::bigint
  FROM storage.objects
  WHERE owner = auth.uid() AND bucket_id IN ('dog-photos', 'dog-videos');
$$;

CREATE OR REPLACE FUNCTION public.my_video_files()
RETURNS TABLE (path text, size bigint, created_at timestamptz, dog_id uuid, dog_name text, entry_id uuid, entry_title text, entry_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public AS $$
  SELECT o.name, COALESCE((o.metadata->>'size')::bigint, 0), o.created_at,
         d.id, d.name, e.id, e.title, e.date
  FROM storage.objects o
  LEFT JOIN public.entries e ON e.video_path = o.name
  LEFT JOIN public.dogs d ON d.id = e.dog_id
  WHERE o.owner = auth.uid() AND o.bucket_id = 'dog-videos'
  ORDER BY o.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.my_storage_usage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_video_files() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_storage_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_video_files() TO authenticated;