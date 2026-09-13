CREATE OR REPLACE FUNCTION private.redeem_dog_invite_impl(_code text)
RETURNS public.redeem_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(btrim(_code));
  v_user_id uuid := auth.uid();
  v_behaviorist_id uuid;
  v_first_dog_id uuid;
  invite public.dog_invites;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  SELECT behaviorist_id INTO v_behaviorist_id
  FROM public.behaviorist_links
  WHERE upper(invite_code) = v_code AND is_active = true;

  IF v_behaviorist_id IS NOT NULL THEN
    INSERT INTO public.owner_behaviorists (owner_id, behaviorist_id)
    VALUES (v_user_id, v_behaviorist_id)
    ON CONFLICT (owner_id, behaviorist_id) DO NOTHING;
    RETURN (null, v_behaviorist_id)::public.redeem_result;
  END IF;

  SELECT * INTO invite
  FROM public.dog_invites
  WHERE upper(code) = v_code
  LIMIT 1
  FOR UPDATE;

  IF invite IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono takiego kodu';
  END IF;

  IF invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Ten kod został już wykorzystany';
  END IF;

  IF invite.expires_at < now() THEN
    RAISE EXCEPTION 'Ten kod wygasł';
  END IF;

  INSERT INTO public.dog_access (dog_id, user_id, role, process_status)
  VALUES (invite.dog_id, v_user_id, invite.role, 'active')
  ON CONFLICT (dog_id, user_id) DO NOTHING;

  v_first_dog_id := invite.dog_id;

  UPDATE public.dog_invites
  SET used_by = v_user_id, used_at = now()
  WHERE id = invite.id AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ten kod został już wykorzystany';
  END IF;

  RETURN (v_first_dog_id, null)::public.redeem_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS public.redeem_result
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.redeem_dog_invite_impl(_code);
$$;

REVOKE ALL ON FUNCTION public.redeem_dog_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;
REVOKE ALL ON FUNCTION private.redeem_dog_invite_impl(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.redeem_dog_invite_impl(text) TO authenticated;
REVOKE ALL ON FUNCTION private.redeem_dog_invite_impl(text, uuid) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION private.redeem_dog_invite_impl(text, uuid) RENAME TO redeem_dog_invite_impl_legacy_disabled;