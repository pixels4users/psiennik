# Dodawanie i edycja wydarzenia jako osobna strona

Zgadzam się — okienko na telefonie walczy z paskiem przeglądarki i klawiaturą, a pełna strona jest wygodniejsza i przewijalna zawsze. Zamiast łatać okienko, zamieniamy je na ekran.

## Co się zmieni dla użytkownika

- Kliknięcie „Dodaj wydarzenie” (w Dzienniku i w Kalendarzu) otwiera stronę „Dodaj wydarzenie”, a nie okienko.
- Kliknięcie edycji wydarzenia otwiera tę samą stronę z tytułem „Edytuj wydarzenie” i przyciskiem usuwania (potwierdzenie usunięcia zostaje jako małe okienko — jest krótkie i nie ma problemu z przewijaniem).
- Na tym ekranie znika górny pasek i stopka. Zostaje: strzałka powrotu z imieniem psa, tytuł strony i formularz w dokładnie takiej formie jak dziś (data, pory dnia z „Cały dzień”, typy aktywności, tytuł, opis, ocena).
- Po zapisaniu lub anulowaniu wracamy tam, skąd przyszliśmy (Dziennik albo Kalendarz), z tym samym komunikatem potwierdzającym co teraz.
- Strona działa pod własnym adresem, więc odświeżenie jej nie gubi ekranu, a przycisk „wstecz” w telefonie działa naturalnie.
- Bez dostępu do edycji wpisów użytkownik jest odsyłany z powrotem do dziennika.

## Zakres techniczny

- Nowe trasy pod istniejącym układem psa:
  - `src/routes/_authenticated/pies.$id.wydarzenie.nowe.tsx` → `/pies/$id/wydarzenie/nowe`
  - `src/routes/_authenticated/pies.$id.wydarzenie.$entryId.tsx` → `/pies/$id/wydarzenie/$entryId`
  - Obie z własnym `head()` (tytuł, opis, og/twitter, `privatePage: true` jak w pozostałych trasach psa) przez `socialMeta`.
- Wydzielenie formularza: całe wnętrze `EntryFormDialog` (stan, walidacja, zapis, usuwanie, potwierdzenie usunięcia) trafia do `src/components/entry-form.tsx` jako `EntryForm` z propsami `dogId`, `entry?`, `onDone`. Logika zapisu i unieważniania zapytań (`["entries", dogId]`) bez zmian.
- `src/components/entry-form-dialog.tsx` zostaje usunięty; `pies.$id.index.tsx` i `pies.$id.kalendarz.tsx` zamiast otwierać okienko robią `navigate` na nową trasę (z `search` zapamiętującym stronę powrotu). `CommentDialog` zostaje bez zmian.
- Ukrycie nagłówka i stopki: w `src/routes/__root.tsx` sprawdzamy przez `useRouterState({ select: s => s.matches })`, czy aktywna trasa to `.../wydarzenie/...`; jeśli tak, nie renderujemy `AppHeader` ani `SiteFooter`. Reszta układu bez zmian.
- Trasa edycji pobiera wpis z już buforowanej listy `useEntries(id)`; gdy wpisu nie ma — przekierowanie do dziennika.
- Uprawnienia: `useDogRole(id).canEditEntries` sprawdzane na stronie; brak uprawnień → powrót do `/pies/$id`.
- Po zmianach: `bunx tsgo --noEmit`, build oraz sprawdzenie w przeglądarce w wąskim oknie (dodanie i edycja wpisu).
