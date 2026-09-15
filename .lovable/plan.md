# Komentarze do wydarzeń (MVP)

Wdrażamy brief bez rozszerzania zakresu: przy każdym wydarzeniu powstaje krótka rozmowa robocza, osobna od formalnego zalecenia behawiorysty.

## Co zobaczy użytkownik

**Nowy ekran szczegółów wydarzenia** pod adresem `/pies/{pies}/wydarzenie/{wydarzenie}`, dostępny dla każdego, kto widzi psa (także dla behawiorysty bez prawa edycji — dziś jest stąd odsyłany):

- powrót do Dziennika lub Kalendarza (zależnie od tego, skąd wszedł),
- dane wydarzenia: tytuł, data, aktywności, ocena, opis; przycisk „Edytuj wydarzenie" tylko dla właściciela i współwłaściciela,
- wyróżniony blok „Zalecenie behawiorysty" albo tekst „Behawiorysta nie dodał jeszcze zalecenia."; przyciski „Dodaj zalecenie" / „Edytuj zalecenie" wyłącznie dla aktywnego behawiorysty,
- sekcja „Dyskusja o wydarzeniu": autor, jego rola, data i godzina, treść — chronologicznie od najstarszego,
- pole „Napisz komentarz do wydarzenia…" z przyciskiem „Dodaj komentarz" dla właściciela, współwłaściciela i aktywnego behawiorysty.

Behawiorysta dostaje dwa osobne, wyraźnie opisane działania („Dodaj komentarz" neutralny, „Dodaj zalecenie" wyróżniony) — bez jednego formularza z przełącznikiem. Po zakończeniu procesu wszystko jest widoczne, ale nic nie da się dopisać.

**Edycja wydarzenia** przenosi się na osobny adres `/pies/{pies}/wydarzenie/{wydarzenie}/edytuj` — ten sam formularz co dziś, bez nagłówka i stopki. Dodawanie wydarzenia (`…/wydarzenie/nowe`) bez zmian.

**Karta wydarzenia** w Dzienniku i Kalendarzu zostaje skrótem. Dochodzi jeden mały link „Dyskusja: 3 komentarze" (lub „Dyskusja" przy zerze) prowadzący do szczegółów. Kliknięcie ikony ołówka nadal prowadzi prosto do edycji.

**Zalecenia**: strona bez zmian, jej link „Zobacz wydarzenie" kieruje teraz do szczegółów wydarzenia zamiast do dziennika. Komentarze nie pojawiają się w Zaleceniach, tabeli, analizie ani w powiadomieniach.

## Zmiany w bazie (osobna migracja, pokazana do akceptacji przed uruchomieniem)

Nowa tabela `entry_comments`: `id`, `entry_id` (usunięcie wydarzenia usuwa komentarze), `author_id` (usunięcie konta nie blokuje — powiązanie zostaje zerwane), `author_role` (owner / co_owner / behaviorist, ustawiana i weryfikowana po stronie bazy), `body` (wymagany po przycięciu, do 4000 znaków), `created_at`; indeks po `entry_id, created_at`.

Zasady dostępu: czytać może każdy z dostępem do psa; dopisać może właściciel, współwłaściciel i aktywny behawiorysta, zawsze jako on sam; edycja i usuwanie komentarzy przez aplikację są niemożliwe.

Uszczelnienie zapisu wydarzeń — dziś każda osoba z dostępem do psa może zmienić dowolne pole wydarzenia, w tym cudze zalecenie. Po zmianie: właściciel i współwłaściciel zmieniają zwykłe pola, ale nie zalecenie ani daty jego wpisu; aktywny behawiorysta zmienia wyłącznie zalecenie.

## Szczegóły techniczne

- Trasy: `pies.$id.wydarzenie.$entryId.tsx` staje się widokiem szczegółów (nagłówek i stopka widoczne); nowa `pies.$id.wydarzenie.$entryId.edytuj.tsx` przejmuje dotychczasową zawartość z `EntryForm`. W `__root.tsx` ukrywanie nagłówka/stopki zawęzić z `/wydarzenie/` do `…/wydarzenie/nowe` i `…/edytuj`. Parametr `wroc` przechodzi dalej bez zmian.
- `CommentDialog` → `RecommendationDialog` (`src/components/recommendation-dialog.tsx`), teksty zgodnie z briefem; użycia w Dzienniku i Kalendarzu zaktualizowane.
- Nowy `src/components/entry-discussion.tsx` + hooki `useEntryComments(entryId)` i `useAddComment` w nowym `src/lib/comments.ts`; zapytania przez istniejącego klienta Supabase i React Query, unieważnianie kluczy `["entry-comments", entryId]`.
- Liczniki komentarzy pobierane jednym zapytaniem dla całej listy wpisów psa (`useEntryCommentCounts(dogId)`), nie per karta; `EntryCard` dostaje opcjonalny props `commentCount` i `onOpenDetails`.
- Eksport „Pobierz moje dane" i usuwanie konta: dopisanie komentarzy do pliku eksportu przy wydarzeniach oraz sprawdzenie ścieżki usuwania konta, by nowa relacja jej nie blokowała.
- Po migracji: regeneracja typów, `bunx tsgo --noEmit`, build oraz sprawdzenie w przeglądarce na 390×844 i na desktopie (właściciel i behawiorysta: odczyt, dodanie komentarza, dodanie zalecenia, proces zakończony).

## Poza zakresem

Odpowiedzi w wątku, edycja i usuwanie komentarzy, powiadomienia i nieprzeczytane, Realtime, załączniki, druga tabela na zalecenia, przebudowa Dziennika, Kalendarza, tabeli i analizy.
