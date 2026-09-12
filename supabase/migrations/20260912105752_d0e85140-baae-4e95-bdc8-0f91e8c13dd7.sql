CREATE TABLE public.dogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  age text,
  breed text,
  sex text,
  photo_url text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dogs TO anon, authenticated;
GRANT ALL ON public.dogs TO service_role;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to dogs" ON public.dogs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  activity_type text NOT NULL DEFAULT 'inne',
  time_of_day text NOT NULL DEFAULT 'rano',
  description text,
  rating text NOT NULL DEFAULT 'green',
  behaviorist_comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO anon, authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to entries" ON public.entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX entries_dog_date_idx ON public.entries (dog_id, date DESC);