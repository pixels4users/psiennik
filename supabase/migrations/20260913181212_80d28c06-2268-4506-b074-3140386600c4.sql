ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS activity_types text[] NOT NULL DEFAULT ARRAY['inne']::text[],
  ADD COLUMN IF NOT EXISTS times_of_day text[] NOT NULL DEFAULT ARRAY['rano']::text[];

ALTER TABLE public.entries DISABLE TRIGGER USER;

UPDATE public.entries
SET activity_types = ARRAY[activity_type],
    times_of_day = ARRAY[time_of_day];

ALTER TABLE public.entries ENABLE TRIGGER USER;

CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
    NEW.commented_at := now();
  END IF;

  IF NOT private.can_manage_dog(NEW.dog_id, auth.uid()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.dog_access
      WHERE dog_id = NEW.dog_id AND user_id = auth.uid() AND role = 'behaviorist' AND process_status = 'active'
    ) THEN
      RAISE EXCEPTION 'Brak uprawnień do edycji tego wpisu';
    END IF;
    NEW.dog_id := OLD.dog_id;
    NEW.date := OLD.date;
    NEW.title := OLD.title;
    NEW.activity_type := OLD.activity_type;
    NEW.time_of_day := OLD.time_of_day;
    NEW.activity_types := OLD.activity_types;
    NEW.times_of_day := OLD.times_of_day;
    NEW.description := OLD.description;
    NEW.rating := OLD.rating;
    NEW.created_at := OLD.created_at;
  ELSE
    IF private.all_behaviorists_completed(NEW.dog_id) THEN
      RAISE EXCEPTION 'Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;