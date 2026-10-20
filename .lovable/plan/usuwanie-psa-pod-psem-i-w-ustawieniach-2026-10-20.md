## Usuwanie psa (pod psem i w Ustawieniach)

Usunąć psa może tylko główny właściciel. Współwłaściciel i behawiorysta nie widzą tej opcji, a dodatkowo blokuje ich serwer.

### 1. Okno edycji psa
- Tytuł zmienia się z „Edytuj psa” na „[Imię psa] — edycja”. Przy dodawaniu nowego psa zostaje „Dodaj psa”.
- Na samym dole, pod linią oddzielającą, czerwony przycisk „Usuń psa” (tylko dla głównego właściciela).
- Po usunięciu przechodzisz do listy psów, a jeśli nie masz już żadnego, na stronę startową aplikacji.

### 2. Ustawienia → zakładka „Psy”
- Zakładka „Dostępy” zmienia nazwę na „Psy”. Adres zostaje bez zmian, więc stare linki działają.
- Na karcie każdego psa, którego jesteś głównym właścicielem, pod „Zarządzaj dostępem” pojawia się „Usuń psa”.
- Po usunięciu karta znika z listy.

### 3. Wspólne okno potwierdzenia (jedno dla obu miejsc)
- Tytuł: „Usunąć psa [imię]?”
- Ostrzeżenie: operacji nie można cofnąć. Znikną wpisy, zalecenia, komentarze, zdjęcia i wideo psa oraz dostępy współwłaścicieli i behawiorystów (z liczbą osób, które stracą dostęp).
- Przypomnienie o „Pobierz moje dane” w Ustawieniach.
- Przycisk „Usuń psa” jest aktywny dopiero po wpisaniu słowa „usuń”, tak samo jak przy usuwaniu konta.
- Podczas usuwania widać „Usuwanie…”, a po zakończeniu komunikat „Usunięto psa: [imię]”.

### Szczegóły techniczne
- Nowa funkcja serwerowa `deleteDog({ dogId })` w `src/lib/account.functions.ts` (`requireSupabaseAuth`). Przez `context.supabase` sprawdza, że `dogs.owner_id = userId`. Dopiero potem używa klienta admina, żeby wyczyścić pliki psa w `dog-photos/{dogId}` i `dog-videos/{dogId}/*` oraz usunąć `entries`, `dog_views`, `dog_invites`, `dog_access` i `dogs`.
- Pętle czyszczenia plików i danych z `deleteMyAccount` trafiają do wspólnego pomocnika `purgeDogs(admin, dogIds)`. Usuwanie konta korzysta z niego bez zmiany działania.
- Nowy komponent `DeleteDogDialog` (`src/components/delete-dog-dialog.tsx`) wzorowany na oknie usuwania konta. Liczbę osób z dostępem bierze z `useDogAccess`. Po sukcesie unieważnia zapytania `["dogs"]`, `["dogs", id]` i dostępy.
- `dog-form-dialog.tsx`: nowy tytuł, sekcja „Usuń psa”, gdy `dog.owner_id === user.id`, nawigacja po usunięciu.
- `profil.tsx`: etykieta zakładki „Psy”, przycisk w `DogAccessCard` dla głównego właściciela.
- Bez zmian w bazie i uprawnieniach. Istniejąca polityka usuwania psa przez właściciela zostaje.
- Weryfikacja: typy i build, a potem Playwright na psie testowym: usunięcie z okna edycji i z Ustawień, brak przycisku dla współwłaściciela i behawiorysty, sprawdzenie, że pliki i wpisy zniknęły.
