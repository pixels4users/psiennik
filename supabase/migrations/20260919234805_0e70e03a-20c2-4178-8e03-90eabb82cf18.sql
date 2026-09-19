CREATE OR REPLACE FUNCTION private.resume_behavioral_process_impl(p_dog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany';
  END IF;

  UPDATE public.dog_access
  SET process_status = 'active'
  WHERE dog_id = p_dog_id
    AND user_id = auth.uid()
    AND role = 'behaviorist'
    AND process_status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie możesz wznowić współpracy. Poproś właściciela o ponowne zaproszenie do psa.'
      USING ERRCODE = 'P0003';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_behavioral_process(p_dog_id uuid)
RETURNS void
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT private.resume_behavioral_process_impl(p_dog_id);
$$;

GRANT EXECUTE ON FUNCTION public.resume_behavioral_process(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.notify_access_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.process_status = 'completed' AND OLD.process_status IS DISTINCT FROM 'completed' THEN
    PERFORM private.notify_dog_audience(
      NEW.dog_id,
      auth.uid(),
      'process_completed',
      'Współpraca przy psie ' || COALESCE(private.dog_name(NEW.dog_id), '') || ' została zakończona',
      NULL,
      NULL,
      'all'
    );

    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      INSERT INTO public.notifications (user_id, dog_id, actor_id, kind, title, body)
      VALUES (NEW.user_id, NEW.dog_id, auth.uid(), 'process_completed',
              'Współpraca przy psie ' || COALESCE(private.dog_name(NEW.dog_id), '') || ' została zakończona', NULL);
    END IF;
  END IF;

  IF NEW.process_status = 'active' AND OLD.process_status = 'completed' THEN
    PERFORM private.notify_dog_audience(
      NEW.dog_id,
      auth.uid(),
      'process_resumed',
      'Współpraca przy psie ' || COALESCE(private.dog_name(NEW.dog_id), '') || ' została wznowiona',
      NULL,
      NULL,
      'all'
    );
  END IF;

  RETURN NEW;
END;
$$;