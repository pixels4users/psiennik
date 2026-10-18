ALTER TABLE public.entries ADD COLUMN media jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION private.entry_media_ok(m jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(m) = 'array'
    AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type' = 'photo') <= 5
    AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type' = 'video') <= 1
    AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type' = 'link') <= 10
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(m) x WHERE NOT (
      (x->>'type' IN ('photo','video') AND x->>'path' IS NOT NULL AND COALESCE((x->>'size')::bigint,0) <= 20*1024*1024)
      OR (x->>'type' = 'link' AND x->>'url' ~ '^https://' AND length(x->>'url') <= 500)));
$$;

ALTER TABLE public.entries ADD CONSTRAINT entries_media_limits CHECK (private.entry_media_ok(media));

COMMENT ON COLUMN public.entries.video_path IS 'DEPRECATED: replaced by media';
COMMENT ON COLUMN public.entries.video_size IS 'DEPRECATED: replaced by media';
COMMENT ON COLUMN public.entries.video_url IS 'DEPRECATED: replaced by media';

CREATE OR REPLACE FUNCTION public.my_media_files()
RETURNS TABLE (path text, size bigint, created_at timestamptz, kind text, dog_id uuid, dog_name text, entry_id uuid, entry_title text, entry_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public AS $$
  SELECT o.name, COALESCE((o.metadata->>'size')::bigint, 0), o.created_at,
         CASE WHEN o.metadata->>'mimetype' LIKE 'image/%' THEN 'photo' ELSE 'video' END,
         d.id, d.name, e.id, e.title, e.date
  FROM storage.objects o
  LEFT JOIN public.entries e ON e.media @> jsonb_build_array(jsonb_build_object('path', o.name))
  LEFT JOIN public.dogs d ON d.id = e.dog_id
  WHERE o.owner = auth.uid() AND o.bucket_id = 'dog-videos'
  ORDER BY o.created_at ASC;
$$;
REVOKE ALL ON FUNCTION public.my_media_files() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_media_files() TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_entry_media(paths text[])
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE public.entries e SET media = COALESCE((
      SELECT jsonb_agg(x) FROM jsonb_array_elements(e.media) x WHERE NOT (COALESCE(x->>'path','') = ANY(paths))), '[]'::jsonb)
  WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(e.media) x WHERE x->>'path' = ANY(paths));
$$;
REVOKE ALL ON FUNCTION public.remove_entry_media(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_entry_media(text[]) TO authenticated;