DROP POLICY IF EXISTS "dogs_select_access" ON public.dogs;

CREATE POLICY "dogs_select_access"
ON public.dogs FOR SELECT
TO authenticated
USING (owner_id = auth.uid() OR private.has_dog_access(id, auth.uid()));