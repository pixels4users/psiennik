# Komentarze do wydarzeń (MVP)

Przy każdym wydarzeniu powstaje krótka rozmowa robocza, wyraźnie oddzielona od formalnego zalecenia behawiorysty. Edycja i miękkie usuwanie własnego komentarza są częścią tego wydania.

## Co zobaczy użytkownik

**Nowy ekran szczegółów wydarzenia** pod adresem `/pies/{pies}/wydarzenie/{wydarzenie}`, dostępny dla każdego, kto widzi psa (także dla behawiorysty bez prawa edycji — dziś jest stąd odsyłany):

- powrót do Dziennika lub Kalendarza (zależnie od tego, skąd wszedł),
- dane wydarzenia: tytuł, data, aktywności, ocena, opis; przycisk „Edytuj wydarzenie" tylko dla właściciela i współwłaściciela,
- wyróżniony blok „Zalecenie behawiorysty" albo tekst „Behawiorysta nie dodał jeszcze zalecenia."; przyciski „Dodaj zalecenie" / „Edytuj zalecenie" wyłącznie dla aktywnego behawiorysty,
- sekcja „Dyskusja o wydarzeniu": autor, jego rola, data i godzina, treść — chronologicznie od najstarszego,
- pole „Napisz komentarz do wydarzenia…" z przyciskiem „Dodaj komentarz" dla właściciela, współwłaściciela i aktywnego behawiorysty.

Behawiorysta dostaje dwa osobne, wyraźnie opisane działania („Dodaj komentarz" neutralny, „Dodaj zalecenie" wyróżniony) — bez jednego formularza z przełącznikiem.

**Edycja wydarzenia** przenosi się na osobny adres `/pies/{pies}/wydarzenie/{wydarzenie}/edytuj` — ten sam formularz co dziś, bez nagłówka i stopki. Dodawanie wydarzenia (`…/wydarzenie/nowe`) bez zmian.

**Karta wydarzenia** w Dzienniku i Kalendarzu zostaje skrótem. Dochodzi mały link „Dyskusja: 3 komentarze" (lub „Dyskusja" przy zerze) prowadzący do szczegółów; licznik pomija komentarze usunięte.

**Zalecenia**: strona bez zmian, jej link „Zobacz wydarzenie" kieruje teraz do szczegółów wydarzenia. Komentarze nie pojawiają się w Zaleceniach, tabeli, analizie ani w powiadomieniach.

## Edycja i usuwanie własnego komentarza

1. Autor może edytować wyłącznie własny komentarz.
2. Autor może usunąć wyłącznie własny komentarz.
3. Edycja i usunięcie są możliwe tylko w trakcie aktywnego procesu z behawiorystą.
4. Po zakończeniu procesu komentarze i zalecenia są tylko do odczytu.
5. Usunięcie jest miękkie: wpis zostaje w chronologii jako „Komentarz usunięty · 15.09.2026, 22:41".
6. Przy usunięciu treść jest czyszczona, więc nic z niej nie zostaje przechowywane.
7. Po poprawce pod treścią widnieje „Komentarz edytowany · 15.09.2026, 22:41".
8. Brak historii wersji, brak przywracania, brak trwałego kasowania wierszy.
9. Po usunięciu konta autora przy komentarzu widać „Usunięty użytkownik".

Reguły w bazie pilnują tego niezależnie od interfejsu: nikt poza autorem nie zmieni, nie usunie ani nie „odusunie" komentarza; nie da się podmienić wydarzenia, autora, roli autora ani daty utworzenia; znaczniki edycji i usunięcia ustawia baza, nie przeglądarka; aplikacja nigdy nie kasuje wierszy.

## Pełny SQL jednej migracji (do akceptacji przed uruchomieniem)

```sql
-- 1. Tabela komentarzy
CREATE TABLE public.entry_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role text NOT NULL CHECK (author_role IN ('owner','co_owner','behaviorist')),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX entry_comments_entry_created_idx
  ON public.entry_comments (entry_id, created_at, id);

GRANT SELECT, INSERT, UPDATE ON public.entry_comments TO authenticated;
GRANT ALL ON public.entry_comments TO service_role;

ALTER TABLE public.entry_comments ENABLE ROW LEVEL SECURITY;

-- 2. Funkcje pomocnicze
CREATE OR REPLACE FUNCTION private.entry_dog_id(_entry_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT dog_id FROM public.entries WHERE id = _entry_id
$$;

CREATE OR REPLACE FUNCTION private.is_active_behaviorist(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access
    WHERE dog_id = _dog_id AND user_id = _user_id
      AND role = 'behaviorist' AND process_status = 'active'
  )
$$;

-- kto może pisać w dyskusji: wyłącznie w ramach aktywnego procesu —
-- właściciel/współwłaściciel albo aktywny behawiorysta, i tylko gdy
-- przy psie istnieje aktywny behawiorysta
CREATE OR REPLACE FUNCTION private.can_discuss_dog(_dog_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dog_access
    WHERE dog_id = _dog_id AND role = 'behaviorist' AND process_status = 'active'
  )
  AND (
    private.can_manage_dog(_dog_id, _user_id)
    OR private.is_active_behaviorist(_dog_id, _user_id)
  )
$$;

-- 3. Polityki RLS
CREATE POLICY entry_comments_select_access ON public.entry_comments
FOR SELECT TO authenticated
USING (private.has_dog_access(private.entry_dog_id(entry_id), auth.uid()));

CREATE POLICY entry_comments_insert_author ON public.entry_comments
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
);

CREATE POLICY entry_comments_update_author ON public.entry_comments
FOR UPDATE TO authenticated
USING (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
)
WITH CHECK (
  author_id = auth.uid()
  AND private.can_discuss_dog(private.entry_dog_id(entry_id), auth.uid())
);

-- brak polityki DELETE: trwałe kasowanie z aplikacji jest niemożliwe

-- 4. Trigger pilnujący pól i znaczników czasu
CREATE OR REPLACE FUNCTION private.guard_entry_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dog_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_dog_id := private.entry_dog_id(NEW.entry_id);
    NEW.author_id := auth.uid();
    NEW.created_at := now();
    NEW.edited_at := NULL;
    NEW.deleted_at := NULL;
    NEW.body := btrim(NEW.body);
    NEW.author_role := CASE
      WHEN private.is_dog_owner(v_dog_id, auth.uid()) THEN 'owner'
      WHEN private.can_manage_dog(v_dog_id, auth.uid()) THEN 'co_owner'
      WHEN private.is_active_behaviorist(v_dog_id, auth.uid()) THEN 'behaviorist'
      ELSE NULL
    END;
    IF NEW.author_role IS NULL THEN
      RAISE EXCEPTION 'Brak uprawnień do komentowania tego wydarzenia';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE

  -- Wyjątek: techniczna anonimizacja autora po usunięciu konta
  -- (klucz obcy ON DELETE SET NULL). Dozwolone tylko wtedy, gdy wyłącznie
  -- author_id przechodzi na NULL i nic więcej się nie zmienia.
  IF OLD.author_id IS NOT NULL AND NEW.author_id IS NULL THEN
    IF NEW.id IS NOT DISTINCT FROM OLD.id
       AND NEW.entry_id IS NOT DISTINCT FROM OLD.entry_id
       AND NEW.author_role IS NOT DISTINCT FROM OLD.author_role
       AND NEW.body IS NOT DISTINCT FROM OLD.body
       AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
       AND NEW.edited_at IS NOT DISTINCT FROM OLD.edited_at
       AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Nie można zmienić autora komentarza';
  END IF;

  IF OLD.author_id IS NULL OR OLD.author_id <> auth.uid() THEN
    RAISE EXCEPTION 'Możesz zmienić tylko własny komentarz';
  END IF;

  v_dog_id := private.entry_dog_id(OLD.entry_id);
  IF NOT private.can_discuss_dog(v_dog_id, auth.uid()) THEN
    RAISE EXCEPTION 'Proces został zakończony. Dyskusja jest tylko do odczytu.';
  END IF;

  -- pola niezmienne
  NEW.id := OLD.id;
  NEW.entry_id := OLD.entry_id;
  NEW.author_id := OLD.author_id;
  NEW.author_role := OLD.author_role;
  NEW.created_at := OLD.created_at;

  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Komentarz został usunięty i nie można go zmienić';
  END IF;

  IF NEW.deleted_at IS NOT NULL THEN
    -- miękkie usunięcie: czas z bazy, treść wyczyszczona
    NEW.deleted_at := now();
    NEW.body := '';
    NEW.edited_at := OLD.edited_at;
  ELSE
    NEW.deleted_at := NULL;
    NEW.body := btrim(NEW.body);
    IF NEW.body IS DISTINCT FROM OLD.body THEN
      NEW.edited_at := now();
    ELSE
      NEW.edited_at := OLD.edited_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_entry_comment_trigger
BEFORE INSERT OR UPDATE ON public.entry_comments
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_comment();

-- pusta treść dozwolona wyłącznie dla komentarza usuniętego
ALTER TABLE public.entry_comments DROP CONSTRAINT entry_comments_body_check;
ALTER TABLE public.entry_comments ADD CONSTRAINT entry_comments_body_check CHECK (
  (deleted_at IS NULL AND length(btrim(body)) BETWEEN 1 AND 4000)
  OR (deleted_at IS NOT NULL AND body = '')
);

-- 5. Uszczelnienie zapisu wydarzeń: zalecenie tylko dla aktywnego behawiorysty,
--    zwykłe pola tylko dla właściciela/współwłaściciela
CREATE OR REPLACE FUNCTION private.guard_entry_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dog_id uuid := OLD.dog_id;
BEGIN
  -- wydarzenia nie da się przenieść między psami ani podmienić jego identyfikatora
  NEW.id := OLD.id;
  NEW.dog_id := OLD.dog_id;
  NEW.created_at := OLD.created_at;

  IF private.can_manage_dog(v_dog_id, auth.uid()) THEN
    IF private.all_behaviorists_completed(v_dog_id) THEN
      RAISE EXCEPTION 'Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu.';
    END IF;
    -- właściciel i współwłaściciel nie ruszają zalecenia
    NEW.behaviorist_comment := OLD.behaviorist_comment;
    NEW.commented_at := OLD.commented_at;
  ELSIF private.is_active_behaviorist(v_dog_id, auth.uid()) THEN
    -- behawiorysta zmienia wyłącznie zalecenie
    NEW.date := OLD.date;
    NEW.title := OLD.title;
    NEW.activity_type := OLD.activity_type;
    NEW.time_of_day := OLD.time_of_day;
    NEW.activity_types := OLD.activity_types;
    NEW.times_of_day := OLD.times_of_day;
    NEW.description := OLD.description;
    NEW.rating := OLD.rating;
    IF NEW.behaviorist_comment IS DISTINCT FROM OLD.behaviorist_comment THEN
      NEW.commented_at := now();
    ELSE
      NEW.commented_at := OLD.commented_at;
    END IF;
  ELSE
    RAISE EXCEPTION 'Brak uprawnień do edycji tego wpisu';
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Ochrona tworzenia wydarzeń: zalecenie nie może powstać razem z wydarzeniem
CREATE OR REPLACE FUNCTION private.guard_entry_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.behaviorist_comment IS NOT NULL AND btrim(NEW.behaviorist_comment) <> '' THEN
    RAISE EXCEPTION 'Zalecenie może dodać wyłącznie aktywny behawiorysta do istniejącego wydarzenia';
  END IF;
  IF NEW.commented_at IS NOT NULL THEN
    RAISE EXCEPTION 'Data zalecenia jest ustawiana przez system';
  END IF;
  NEW.behaviorist_comment := NULL;
  NEW.commented_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_entry_insert_trigger
BEFORE INSERT ON public.entries
FOR EACH ROW EXECUTE FUNCTION private.guard_entry_insert();
```

**Skutki dla istniejących danych:** żadne dane nie są zmieniane ani usuwane. Stare wydarzenia mają zero komentarzy. Zmienia się wyłącznie zakres tego, kto co może zapisać w `entries`.

## Szczegóły techniczne po stronie aplikacji

- Trasy: `pies.$id.wydarzenie.$entryId.tsx` staje się widokiem szczegółów (nagłówek i stopka widoczne); nowa `pies.$id.wydarzenie.$entryId.edytuj.tsx` przejmuje dotychczasowy `EntryForm`. W `__root.tsx` ukrywanie nagłówka/stopki zawęzić z `/wydarzenie/` do `…/nowe` i `…/edytuj`. Parametr `wroc` bez zmian.
- `CommentDialog` → `RecommendationDialog` (`src/components/recommendation-dialog.tsx`), teksty zgodnie z briefem; użycia w Dzienniku i Kalendarzu zaktualizowane.
- Nowy `src/components/entry-discussion.tsx` oraz `src/lib/comments.ts` z hookami `useEntryComments(entryId)`, `useAddComment`, `useEditComment`, `useDeleteComment` (miękkie: `update({ deleted_at: new Date().toISOString() })`, wartość i tak nadpisuje baza); klucz `["entry-comments", entryId]`.
- Liczniki dla całej listy wpisów psa jednym zapytaniem (`useEntryCommentCounts(dogId)`), z pominięciem usuniętych; `EntryCard` dostaje `commentCount` i `onOpenDetails`.
- Nazwa autora z `profiles`; brak profilu → „Usunięty użytkownik".
- Eksport „Pobierz moje dane": komentarze (bez usuniętych treści) dopisane przy wydarzeniach; ścieżka usuwania konta sprawdzona — `ON DELETE SET NULL` jej nie blokuje.
- Uprawnienia w `useDogRole`: zamiast dotychczasowego `canComment` wprowadzamy `canDiscuss` (właściciel, współwłaściciel i aktywny behawiorysta — wyłącznie gdy przy psie jest aktywny behawiorysta; pies bez aktywnego procesu nie ma pola dyskusji) oraz `canRecommend` (wyłącznie aktywny behawiorysta). Wszystkie obecne użycia `canComment` (Dziennik, Kalendarz, `EntryCard`) przechodzą na `canRecommend`, bo dotyczą zalecenia; nowa dyskusja korzysta z `canDiscuss`.
- Po migracji: regeneracja typów, `bunx tsgo --noEmit`, build i sprawdzenie w przeglądarce na 390×844 oraz desktopie.

## Testy przed zamknięciem prac

Bezpośrednio na API (z sesjami testowymi, nie tylko przez interfejs):

- właściciel próbuje utworzyć wydarzenie z wypełnionym zaleceniem → odrzucone,
- właściciel próbuje zmienić istniejące zalecenie → zalecenie bez zmian,
- aktywny behawiorysta próbuje zmienić tytuł, datę, psa, identyfikator lub datę zalecenia → zmiany ignorowane,
- współwłaściciel dodaje komentarz i edytuje wydarzenie → obie akcje działają,
- autor edytuje i miękko usuwa własny komentarz → znaczniki ustawia baza, treść wyczyszczona,
- inny uczestnik próbuje edytować, usunąć lub „odusunąć" cudzy komentarz → odrzucone,
- behawiorysta oczekujący oraz po zakończonym procesie nie mogą nic dopisać ani zmienić,
- właściciel i współwłaściciel próbują dodać komentarz przy psie bez aktywnego behawiorysty → odrzucone przez RLS i trigger,
- próba trwałego usunięcia komentarza przez aplikację → brak polityki, odrzucone,
- usunięcie konta autora: współwłaściciel lub aktywny behawiorysta dodaje komentarz przy cudzym psie, usuwa konto istniejącym mechanizmem → konto znika bez błędu, komentarz zostaje w historii z `author_id = NULL`, interfejs pokazuje „Usunięty użytkownik", a treść, rola historyczna i wszystkie daty pozostają bez zmian,
- próba ustawienia `author_id = NULL` przez zwykłego użytkownika → odrzucona przez RLS i trigger.

Interfejs: 390×844 i desktop — odczyt, dodanie, edycja i usunięcie komentarza, dodanie zalecenia, widok po zakończonym procesie.

## Poza zakresem

Odpowiedzi w wątku, historia wersji i przywracanie komentarzy, powiadomienia i nieprzeczytane, Realtime, załączniki, druga tabela na zalecenia, przebudowa Dziennika, Kalendarza, tabeli i analizy.
