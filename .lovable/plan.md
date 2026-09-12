# Zarządzanie dostępem: behawiorysta i współwłaściciel

Dziś zaproszenie można wygenerować tylko z poziomu jednego psa, a pies ma dokładnie jednego właściciela. Dodajemy pełne zarządzanie osobami z dostępem — z poziomu konta i z poziomu psa — oraz rolę współwłaściciela.

## Role i uprawnienia

| Rola | Może |
| --- | --- |
| Właściciel (główny) | wszystko: psy, wpisy, dodawanie i usuwanie współwłaściciela oraz behawiorysty, usunięcie psa |
| Współwłaściciel | to samo co właściciel na wpisach i danych psa, zaprasza i usuwa behawiorystę; nie może usunąć głównego właściciela ani dodać kolejnego współwłaściciela, nie usuwa psa |
| Behawiorysta | podgląd dziennika i komentarze/zalecenia |

Obaj właściciele widzą tę samą listę psów, te same osoby z dostępem i te same aktywne kody zaproszeń.

## Zapraszanie z poziomu konta

W profilu nowa sekcja **Osoby z dostępem**:

- lista osób (imię/e-mail, rola, psy, do których mają dostęp),
- „Zaproś osobę” — wybór roli (behawiorysta / współwłaściciel) i zaznaczenie psów, których dotyczy dostęp; powstaje jeden kod ważny 14 dni,
- lista oczekujących kodów: rola, psy, data ważności, kopiowanie i usunięcie kodu,
- przy osobie: edycja psów (dodanie/odebranie pojedynczego psa) oraz „Usuń dostęp” do wszystkich psów.

Opcja „współwłaściciel” widoczna tylko dla głównego właściciela.

## Zapraszanie z poziomu psa

Obecne okno przy psie rozbudowujemy: pokazuje osoby mające dostęp do tego psa wraz z rolą, pozwala dodać behawiorystę (i współwłaściciela, jeśli jesteś głównym właścicielem) oraz odebrać dostęp do tego jednego psa, bez wpływu na pozostałe. W nagłówku psa zamiast samej ikony pojawia się informacja, kto ma dostęp (np. „Behawiorysta: Ania” lub „Dodaj behawiorystę”).

## Osoba dołączająca kodem

Ekran „Dołącz kodem” działa jak dziś, ale jeden kod może objąć kilka psów naraz i nadać rolę współwłaściciela. Po wpisaniu kodu osoba dostaje dostęp do wszystkich psów z zaproszenia.

## Szczegóły techniczne

Migracja bazy:

- `dog_invites.role` (app_role, domyślnie `behaviorist`); jeden kod może mieć wiele wierszy — po jednym na psa — dzięki czemu zaproszenie obejmuje kilka psów.
- nowa funkcja `private.can_manage_dog(dog_id, user_id)` — true, gdy użytkownik ma w `dog_access` rolę `owner` (obejmuje głównego właściciela i współwłaścicieli).
- polityki RLS przechodzą z `is_dog_owner` na `can_manage_dog` dla: `dogs` (update), `entries` (insert/update/delete), `dog_invites` (select/insert/delete), `dog_access` (select/insert/delete). `is_dog_owner` zostaje tam, gdzie liczy się wyłącznie główny właściciel: usunięcie psa, usunięcie lub dodanie wiersza `dog_access` z rolą `owner`.
- `private.guard_entry_update` używa `can_manage_dog`, żeby współwłaściciel mógł edytować wpisy.
- `redeem_dog_invite(_code)` obsługuje wiele wierszy jednego kodu: waliduje ważność, zakłada dostęp z rolą z zaproszenia dla każdego psa, oznacza kod jako wykorzystany i zwraca pierwszego psa.
- polityka `dog_access_delete`: główny właściciel może usunąć każdy wiersz poza swoim, współwłaściciel tylko wiersze behawiorystów, każdy może usunąć własny dostęp.

Frontend:

- `src/lib/access.ts` — hooki: lista osób pogrupowana po użytkowniku wraz z psami, tworzenie zaproszenia dla wielu psów i wybranej roli, usunięcie kodu, odebranie dostępu do jednego psa lub do wszystkich.
- nowy hook `useDogRole(dogId)` — uprawnienia wyliczane z `dog_access` dla konkretnego psa zamiast globalnej roli konta; używają go `entry-card`, `dog-nav`, widoki Lista/Kalendarz/Tabela/Analiza.
- nowy komponent zarządzania dostępem, używany zarówno w profilu, jak i w oknie przy psie (tryb „wszystkie psy” / „jeden pies”).
- `src/routes/_authenticated/profil.tsx` — sekcja Osoby z dostępem; `dog-nav.tsx` — informacja o osobach z dostępem i akcja dodania.

Weryfikacja: przepływ zaproszenia współwłaściciela i behawiorysty na kontach demo, sprawdzenie na komputerze i telefonie, kontrola lintera bazy po migracji.
