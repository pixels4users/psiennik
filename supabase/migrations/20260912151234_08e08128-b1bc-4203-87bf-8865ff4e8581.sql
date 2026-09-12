DROP POLICY IF EXISTS "Public read dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update dog photos" ON storage.objects;
DROP POLICY IF EXISTS "dog_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "dog_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "dog_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "dog_photos_delete" ON storage.objects;

CREATE POLICY "dog_photos_select_access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.has_dog_access(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "dog_photos_insert_access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_manage_dog(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "dog_photos_update_access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_manage_dog(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_manage_dog(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "dog_photos_delete_access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND private.can_manage_dog(((storage.foldername(name))[1])::uuid, auth.uid())
);