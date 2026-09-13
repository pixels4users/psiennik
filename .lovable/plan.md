# Usuwanie wydarzeń

## Cel

Właściciel/współwłaściciel może usunąć wydarzenie z poziomu okna edycji. Behawiorysta nie widzi tej opcji (jej okno edycji już dziś nie otwiera — uprawnienie `canEditEntries` decyduje o dostępie do przycisku edycji).

## Zakres

1. **Przycisk usuwania w `src/components/entry-form-dialog.tsx`** (tylko w trybie edycji):
   - Po lewej stronie stopki formularza przycisk „Usuń wydarzenie" (wariant `destructive`/tekstowy z ikoną kosza), oddzielony od przycisków „Anuluj" / „Zapisz zmiany" (rozmieszczenie `justify-between`).
   - Kliknięcie otwiera potwierdzenie w `AlertDialog`: tytuł „Usunąć to wydarzenie?", opis „„{tytuł}" zostanie trwale usunięte wraz z zaleceniami behawiorysty.", akcje „Anuluj" / „Usuń".
   - Po potwierdzeniu: `supabase.from("entries").delete().eq("id", entry.id)`, odświeżenie listy wpisów (`invalidateQueries(["entries", dogId])`), toast „Wydarzenie usunięte", zamknięcie okna.
   - Błąd: toast „Nie udało się usunąć wydarzenia".
   - Podczas trwania usuwania przycisk zablokowany (stan `deleting`), formularz zapisu też zablokowany.

2. **Baza danych** — bez zmian: polityka usuwania `entries_delete_can_edit` już istnieje i dopuszcza wyłącznie osoby z uprawnieniem do edycji wpisów psa.

3. **Inne widoki** — bez zmian: okno edycji jest wspólne dla dziennika i kalendarza, więc usuwanie działa w obu miejscach automatycznie.

## Weryfikacja

- Usunięcie wydarzenia z poziomu edycji w dzienniku i w panelu dnia w kalendarzu; wpis znika z listy, kalendarza, tabeli i analizy.
- Behawiorysta (brak `canEditEntries`) nie ma dostępu do przycisku usuwania.
- `bunx tsc --noEmit` i build bez błędów; test w przeglądarce (Playwright).
