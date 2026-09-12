-- 1) complete_behavioral_process: weryfikacja wywołującego (behawiorysta lub właściciel psa)
CREATE OR REPLACE FUNCTION private.complete_behavioral_process_impl(p_dog_id uuid, p_behaviorist_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  IF p_behaviorist_id IS NULL THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  IF auth.uid() <> p_behaviorist_id AND NOT private.is_dog_owner(p_dog_id, auth.uid()) THEN
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

-- Implementacja w schema private nie powinna być wywoływalna bezpośrednio
REVOKE EXECUTE ON FUNCTION private.complete_behavioral_process_impl(uuid, uuid) FROM authenticated;

-- 2) dog_access: właściciel nie może usunąć własnego rekordu roli 'owner'
DROP POLICY IF EXISTS dog_access_delete ON public.dog_access;
CREATE POLICY dog_access_delete ON public.dog_access
FOR DELETE TO authenticated
USING (
  (user_id = auth.uid() AND role <> 'owner'::app_role)
  OR (private.is_dog_owner(dog_id, auth.uid()) AND user_id <> auth.uid())
  OR (private.can_manage_dog(dog_id, auth.uid()) AND role = 'behaviorist'::app_role AND user_id <> auth.uid())
);

-- 3) dog_invites: jawna, restrykcyjna polityka UPDATE (jednorazowe wykorzystanie kodu)
CREATE POLICY dog_invites_update_redeem ON public.dog_invites
FOR UPDATE TO authenticated
USING (used_by IS NULL AND expires_at > now())
WITH CHECK (used_by = auth.uid() AND used_at IS NOT NULL);