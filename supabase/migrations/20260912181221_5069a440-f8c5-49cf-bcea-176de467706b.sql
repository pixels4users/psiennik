-- behaviorist_links: allow a behaviorist to create only their own link
DROP POLICY IF EXISTS behaviorist_links_insert_own ON public.behaviorist_links;
CREATE POLICY behaviorist_links_insert_own
  ON public.behaviorist_links FOR INSERT TO authenticated
  WITH CHECK (behaviorist_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.behaviorist_links TO authenticated;
REVOKE DELETE ON public.behaviorist_links FROM authenticated, anon;
REVOKE ALL ON public.behaviorist_links FROM anon;
GRANT ALL ON public.behaviorist_links TO service_role;

-- owner_behaviorists: read-only for clients; writes only via trusted server logic
REVOKE INSERT, UPDATE, DELETE ON public.owner_behaviorists FROM authenticated, anon;
REVOKE ALL ON public.owner_behaviorists FROM anon;
GRANT SELECT ON public.owner_behaviorists TO authenticated;
GRANT ALL ON public.owner_behaviorists TO service_role;

-- user_roles: read-only for clients; no self-assignment of roles
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;