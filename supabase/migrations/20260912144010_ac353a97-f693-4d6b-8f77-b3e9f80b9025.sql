CREATE OR REPLACE FUNCTION private.redeem_dog_invite_impl(_code text, _user_id uuid)
RETURNS public.redeem_result LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text := upper(btrim(_code));
  v_behaviorist_id uuid;
  v_first_dog_id uuid;
  invite public.dog_invites;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  SELECT behaviorist_id INTO v_behaviorist_id
  FROM public.behaviorist_links
  WHERE upper(invite_code) = v_code AND is_active = true;

  IF v_behaviorist_id IS NOT NULL THEN
    INSERT INTO public.owner_behaviorists (owner_id, behaviorist_id)
    VALUES (_user_id, v_behaviorist_id)
    ON CONFLICT (owner_id, behaviorist_id) DO NOTHING;
    RETURN (null, v_behaviorist_id)::public.redeem_result;
  END IF;

  SELECT * INTO invite FROM public.dog_invites WHERE upper(code) = v_code LIMIT 1;

  IF invite IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono takiego kodu';
  END IF;

  IF EXISTS (SELECT 1 FROM public.dog_invites WHERE upper(code) = v_code AND used_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Ten kod został już wykorzystany';
  END IF;

  IF EXISTS (SELECT 1 FROM public.dog_invites WHERE upper(code) = v_code AND expires_at < now()) THEN
    RAISE EXCEPTION 'Ten kod wygasł';
  END IF;

  FOR invite IN SELECT * FROM public.dog_invites WHERE upper(code) = v_code
  LOOP
    INSERT INTO public.dog_access (dog_id, _user_id, role, process_status)
    VALUES (invite.dog_id, _user_id, invite.role, 'active')
    ON CONFLICT (dog_id, user_id) DO NOTHING;
    IF v_first_dog_id IS NULL THEN
      v_first_dog_id := invite.dog_id;
    END IF;
  END LOOP;

  UPDATE public.dog_invites SET used_by = _user_id, used_at = now() WHERE upper(code) = v_code;

  RETURN (v_first_dog_id, null)::public.redeem_result;
END;
$$;

CREATE OR REPLACE FUNCTION private.complete_behavioral_process_impl(p_dog_id uuid, p_behaviorist_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_behaviorist_id IS NULL THEN
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

CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS public.redeem_result LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.redeem_dog_invite_impl(_code, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.redeem_dog_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_behavioral_process(p_dog_id uuid, p_behaviorist_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.complete_behavioral_process_impl(p_dog_id, p_behaviorist_id);
$$;

REVOKE ALL ON FUNCTION public.complete_behavioral_process(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_behavioral_process(uuid, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION private.redeem_dog_invite_impl(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.complete_behavioral_process_impl(uuid, uuid) TO authenticated;
