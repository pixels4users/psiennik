CREATE OR REPLACE FUNCTION private.guard_dog_access_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.dog_id IS DISTINCT FROM OLD.dog_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Nie mozna zmieniac przypisania dostepu (psa, uzytkownika ani roli).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_dog_access_update_trigger ON public.dog_access;
CREATE TRIGGER guard_dog_access_update_trigger
BEFORE UPDATE ON public.dog_access
FOR EACH ROW EXECUTE FUNCTION private.guard_dog_access_update();

DROP POLICY dog_invites_select_owner ON public.dog_invites;
CREATE POLICY dog_invites_select_owner ON public.dog_invites
FOR SELECT TO authenticated
USING (
  private.can_manage_dog(dog_id, auth.uid())
  AND used_by IS NULL
  AND expires_at > now()
);