ALTER TABLE public.owner_behaviorists ADD COLUMN IF NOT EXISTS process_status text NOT NULL DEFAULT 'active'::text;

CREATE OR REPLACE FUNCTION private.update_owner_behaviorists_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- gdy wszystkie dog_access dla pary owner-behaviorist są completed/pending,
  -- owner_behaviorists pozostaje active dopóki ktoś nie zakończy ręcznie
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.owner_behaviorists.process_status IS 'active | completed | pending';
