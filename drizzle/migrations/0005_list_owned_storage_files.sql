CREATE FUNCTION public.my_owned_storage_files()
RETURNS TABLE(bucket text,path text,size bigint,created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=storage,public AS $$
 SELECT bucket_id,name,COALESCE((metadata->>'size')::bigint,0),created_at FROM storage.objects WHERE owner=auth.uid() AND bucket_id IN ('dog-photos','dog-videos') ORDER BY created_at,id;
$$;
REVOKE ALL ON FUNCTION public.my_owned_storage_files() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_owned_storage_files() TO authenticated,service_role;