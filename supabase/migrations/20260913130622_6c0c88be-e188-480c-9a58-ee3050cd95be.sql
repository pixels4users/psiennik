REVOKE INSERT ON public.dog_access FROM authenticated;

DROP POLICY IF EXISTS dog_access_insert_owner ON public.dog_access;
CREATE POLICY dog_access_insert_via_trusted_flow_only
ON public.dog_access
FOR INSERT
TO authenticated
WITH CHECK (false);

REVOKE UPDATE ON public.dog_invites FROM authenticated;

DROP POLICY IF EXISTS dog_invites_update_redeem ON public.dog_invites;
CREATE POLICY dog_invites_update_via_trusted_flow_only
ON public.dog_invites
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.redeem_dog_invite(_code text)
RETURNS public.redeem_result
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.redeem_dog_invite_impl(_code, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.redeem_dog_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_dog_invite(text) TO authenticated;
REVOKE ALL ON FUNCTION private.redeem_dog_invite_impl(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.redeem_dog_invite_impl(text, uuid) TO service_role;