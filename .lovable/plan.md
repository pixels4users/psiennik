# Dostęp, współpraca z behawiorystą i limity kont

Dziś zaproszenie można wygenerować tylko z poziomu jednego psa, a pies ma dokładnie jednego właściciela. Dodajemy pełne zarządzanie osobami z dostępem (z poziomu konta i psa), rolę współwłaściciela, cykl życia współpracy z behawiorystą (aktywna / zakończona), kod zapraszający po stronie behawiorysty oraz limity darmowego planu.

## Role i uprawnienia

| Rola | Może |
| --- | --- |
| Właściciel (główny) | wszystko: psy, wpisy, dodawanie i usuwanie współwłaściciela oraz behawiorysty, usunięcie psa |
| Współwłaściciel | to samo co właściciel na wpisach i danych psa, zaprasza i usuwa behawiorystę; nie może usunąć głównego właściciela ani dodać kolejnego współwłaściciela, nie usuwa psa |
| Behawiorysta | podgląd dziennika, komentarze/zalecenia, zakończenie procesu |


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

## Cykl życia współpracy: aktywna i zakończona

- Każde przypisanie behawiorysty do psa ma status: aktywny albo zakończony.
- Behawiorysta w karcie psa ma opcję „Zakończ proces” (menu z trzema kropkami) z potwierdzeniem w oknie dialogowym.
- Lista psów behawiorysty dzieli się na zakładki „Aktywne procesy” i „Zakończone”.
- Gdy dla psa nie ma żadnej aktywnej współpracy, dziennik przechodzi w tryb tylko do odczytu: właściciel i współwłaściciel nadal wszystko widzą, ale nie dodają ani nie edytują wpisów. W nagłówku psa pojawia się baner: „Proces z behawiorystą został zakończony. Dziennik jest w trybie tylko do odczytu”, z informacją, jak rozpocząć nowy proces.

## Kod behawiorysty: zaproszenie w drugą stronę

- Każdy behawiorysta ma jeden stały kod (np. `BEH-123-ABC`) widoczny w profilu w sekcji „Mój kod dla klientów”, z przyciskiem kopiowania linku z zaproszeniem (`?code=…`).
- Właściciel, który wejdzie z linku lub wpisze kod, zostaje trwale powiązany z behawiorystą i widzi komunikat: „Dołączasz pod opiekę behawiorysty: [imię]. Dodaj swojego psa, aby rozpocząć współpracę.”.
- Każdy nowy pies takiego właściciela automatycznie dostaje tego behawiorystę z aktywnym procesem.
- Dotychczasowa ścieżka właściciel → behawiorysta pozostaje bez zmian.

## Limity planu darmowego

- Darmowy plan behawiorysty: 2 aktywne procesy jednocześnie.
- Przekroczenie limitu blokuje przypisanie kolejnego psa — także wtedy, gdy klient próbuje użyć kodu — z komunikatem: „Osiągnąłeś limit aktywnych procesów w planie darmowym (2/2). W przyszłości pojawi się tu możliwość wykupienia pakietu PRO. Na ten moment zakończ jeden z procesów, aby zwolnić miejsce.”.
- W panelu behawiorysty widoczny jest licznik wykorzystanych miejsc. Płatności nie podłączamy na tym etapie.

## Szczegóły techniczne — druga część

Migracja bazy:

- `dog_access.process_status` (text, domyślnie `active`, wartości `active` / `completed`).
- `private.can_manage_dog` dodatkowo wymaga, aby dla psa istniał wiersz behawiorysty ze statusem `active`; brak takiego wiersza oznacza tryb tylko do odczytu dla wpisów (`entries` insert/update/delete). Odczyt i zarządzanie samym psem pozostają bez zmian.
- RPC `complete_behavioral_process(p_dog_id, p_behaviorist_id)` — zmiana statusu na `completed`, wywoływalna wyłącznie przez przypisanego behawiorystę.
- Tabela `behaviorist_links` (`id`, `behaviorist_id`, `invite_code` unikalny, `is_active`), z grantami i RLS: odczyt własnego kodu, publiczne rozpoznanie kodu przez RPC. Kod tworzony automatycznie przy rejestracji behawiorysty (rozszerzenie `private.handle_new_user`) oraz uzupełniany dla istniejących kont.
- Tabela `owner_behaviorists` (`owner_id`, `behaviorist_id`) — trwałe powiązanie właściciela z behawiorystą; `private.handle_new_dog` dopisuje powiązanych behawiorystów do `dog_access` z aktywnym statusem.
- `redeem_dog_invite` rozpoznaje też kod behawiorysty i zakłada powiązanie zamiast dostępu do konkretnego psa; zwraca informację, którą ścieżkę wykonano.
- `profiles.plan_type` (text, domyślnie `free`) i `profiles.max_active_dogs` (integer, domyślnie 2).
- Trigger na `dog_access` (insert oraz zmiana statusu na `active`) liczy aktywne procesy behawiorysty i odrzuca akcję po przekroczeniu `max_active_dogs`.

Frontend:

- `useDogRole` uwzględnia status procesu i zwraca tryb tylko do odczytu; formularze wpisów i komentarzy są wtedy ukryte.
- Zakładki „Aktywne / Zakończone” na liście psów behawiorysty, menu „Zakończ proces” z potwierdzeniem, baner w nagłówku psa.
- Sekcja „Mój kod dla klientów” w profilu behawiorysty i obsługa parametru `?code=` na ekranie logowania i liście psów.
- Hook `useSubscriptionLimits` — licznik aktywnych procesów i czytelne komunikaty o limicie.

Weryfikacja drugiej części: zakończenie procesu i tryb tylko do odczytu, dołączenie właściciela kodem behawiorysty z automatycznym przypisaniem nowego psa, blokada trzeciego aktywnego procesu, linter bazy.

