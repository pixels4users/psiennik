DROP POLICY IF EXISTS dog_invites_update_redeem ON public.dog_invites;
REVOKE UPDATE ON public.dog_invites FROM authenticated;