CREATE OR REPLACE FUNCTION private.photo_quota_ok(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = storage, public
AS $$ SELECT COALESCE(sum((metadata->>'size')::bigint),0) < 250*1024*1024 FROM storage.objects WHERE owner = _user_id AND bucket_id IN ('dog-photos','dog-videos'); $$;

CREATE OR REPLACE FUNCTION private.storage_upload_quota_ok(_user_id uuid, _bucket text, _name text, _metadata jsonb)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = storage, public
AS $$
DECLARE used bigint; incoming bigint := COALESCE((_metadata->>'size')::bigint,0);
BEGIN
 IF _user_id IS NULL THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text,0));
 SELECT COALESCE(sum((metadata->>'size')::bigint),0) INTO used FROM storage.objects WHERE owner = _user_id AND bucket_id IN ('dog-photos','dog-videos') AND NOT (bucket_id=_bucket AND name=_name);
 RETURN incoming >= 0 AND incoming <= 200*1024*1024 AND used+incoming <= 250*1024*1024;
END; $$;
CREATE POLICY storage_account_quota_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (bucket_id NOT IN ('dog-photos','dog-videos') OR private.storage_upload_quota_ok(auth.uid(),bucket_id,name,metadata));
CREATE POLICY storage_account_quota_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING (true) WITH CHECK (bucket_id NOT IN ('dog-photos','dog-videos') OR private.storage_upload_quota_ok(auth.uid(),bucket_id,name,metadata));

CREATE OR REPLACE FUNCTION private.entry_media_ok(m jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT jsonb_typeof(m)='array'
 AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type'='photo')<=5
 AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type'='video')<=1
 AND (SELECT count(*) FROM jsonb_array_elements(m) x WHERE x->>'type'='link')<=10
 AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(m) x WHERE NOT (
 (x->>'type' IN ('photo','video') AND x->>'path' IS NOT NULL AND COALESCE((x->>'size')::bigint,0) BETWEEN 0 AND 200*1024*1024)
 OR (x->>'type'='link' AND x->>'url' ~ '^https://' AND length(x->>'url')<=500)));
$$;
ALTER TABLE public.entries DROP CONSTRAINT entries_video_size_max;
ALTER TABLE public.entries ADD CONSTRAINT entries_video_size_max CHECK (video_size IS NULL OR video_size BETWEEN 0 AND 200*1024*1024);

CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dog_id uuid := OLD.dog_id;
BEGIN
 NEW.id := OLD.id; NEW.dog_id := OLD.dog_id; NEW.created_at := OLD.created_at;
 -- Trusted storage reclamation may only remove file references, even from archived entries.
 IF auth.role()='service_role'
 AND (to_jsonb(NEW)-ARRAY['media','video_path','video_size'])=(to_jsonb(OLD)-ARRAY['media','video_path','video_size'])
 AND (NEW.video_path IS NOT DISTINCT FROM OLD.video_path OR NEW.video_path IS NULL)
 AND (NEW.video_size IS NOT DISTINCT FROM OLD.video_size OR NEW.video_size IS NULL)
 AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.media) x WHERE NOT OLD.media @> jsonb_build_array(x))
 THEN RETURN NEW; END IF;
 IF private.can_manage_dog(v_dog_id,auth.uid()) THEN
  IF private.all_behaviorists_completed(v_dog_id) THEN RAISE EXCEPTION 'Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu.'; END IF;
  NEW.behaviorist_comment:=OLD.behaviorist_comment; NEW.commented_at:=OLD.commented_at;
 ELSIF private.is_active_behaviorist(v_dog_id,auth.uid()) THEN
  NEW.date:=OLD.date; NEW.title:=OLD.title; NEW.activity_type:=OLD.activity_type; NEW.time_of_day:=OLD.time_of_day; NEW.activity_types:=OLD.activity_types; NEW.times_of_day:=OLD.times_of_day; NEW.description:=OLD.description; NEW.rating:=OLD.rating;
  IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN NEW.commented_at:=now(); ELSE NEW.commented_at:=OLD.commented_at; END IF;
 ELSE RAISE EXCEPTION 'Brak uprawnień do edycji tego wpisu'; END IF;
 RETURN NEW;
END; $$;

CREATE FUNCTION public.clear_removed_storage_references(_bucket text, _paths text[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF _bucket='dog-photos' THEN
  UPDATE public.dogs SET photo_url=NULL WHERE photo_url=ANY(_paths);
 ELSIF _bucket='dog-videos' THEN
  UPDATE public.entries e SET media=COALESCE((SELECT jsonb_agg(x) FROM jsonb_array_elements(e.media) x WHERE NOT COALESCE(x->>'path','')=ANY(_paths)),'[]'::jsonb),
   video_path=CASE WHEN video_path=ANY(_paths) THEN NULL ELSE video_path END,
   video_size=CASE WHEN video_path=ANY(_paths) THEN NULL ELSE video_size END
  WHERE video_path=ANY(_paths) OR EXISTS (SELECT 1 FROM jsonb_array_elements(e.media) x WHERE x->>'path'=ANY(_paths));
 ELSE RAISE EXCEPTION 'Invalid storage bucket'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.clear_removed_storage_references(text,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.clear_removed_storage_references(text,text[]) TO service_role;