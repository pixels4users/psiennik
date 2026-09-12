# Konta, zaproszenia i powiadomienia w aplikacji

Wprowadzamy prawdziwe konta zamiast przełącznika ról. Każdy pies należy do właściciela, behawiorystka dołącza do psa kodem zaproszenia, a nieprzeczytane wpisy i komentarze widać w aplikacji.

Uwaga: obecne dane testowe (Lucy i jej wpisy) zostaną usunięte — zaczynamy od czystych kont.

## Logowanie

- Google, Apple oraz e-mail i hasło.
- Nowa strona `/auth` z logowaniem i rejestracją; przy rejestracji wybierasz rolę: **Właściciel** albo **Behawiorysta**.
- Cała aplikacja (psy, dziennik, kalendarz, tabela, analiza) trafia za logowanie. Strona główna `/` zostaje publiczna: krótkie przedstawienie aplikacji i przycisk „Zaloguj się”; zalogowany użytkownik jest przenoszony dalej.
- W nagłówku zamiast przełącznika ról pojawia się menu profilu: imię/e-mail, „Mój profil”, „Wyloguj”, oraz dzwonek z licznikiem nowości.

## Profil użytkownika

Strona `/profil`: imię wyświetlane, rola, adres e-mail (można uzupełnić, jeśli logowanie przez Apple go nie przekazało), przełącznik „Powiadomienia e-mail” (na razie tylko zapisuje preferencję — wysyłkę dodamy w kolejnym kroku), wylogowanie.

## Psy i dostęp

- Właściciel widzi i edytuje wyłącznie swoje psy.
- Behawiorystka widzi psy, do których została zaproszona — także od różnych właścicieli — i może dodawać wyłącznie komentarze.
- **Zaproszenie kodem:** na profilu psa właściciel klika „Zaproś behawiorystkę” i dostaje krótki kod (ważny 14 dni, jednorazowy). Behawiorystka wkleja go na swojej liście psów („Dołącz kodem”) i pies pojawia się u niej na liście. Właściciel widzi listę osób z dostępem i może dostęp cofnąć.

## Widok behawiorystki

Nad listą psów sekcja **Ostatnie wydarzenia** — 5 najnowszych wpisów ze wszystkich psów pod opieką, z imieniem psa, datą, oceną i przejściem do dnia. Dalej lista psów jak dotąd, bez dodawania psów i bez edycji wpisów.

## Powiadomienia w aplikacji

- Zapamiętujemy moment ostatniego otwarcia dziennika każdego psa przez danego użytkownika.
- Dzwonek w nagłówku pokazuje łączną liczbę nowości: dla właściciela — nowe komentarze behawiorystki, dla behawiorystki — nowe wpisy właściciela. Po rozwinięciu: lista psów z liczbą nowości i przejściem do dziennika.
- Na liście psów i na kartach wpisów nowe pozycje mają subtelny znacznik „nowe”.

## Konta demo

Na stronie logowania (tylko w podglądzie deweloperskim, nie na opublikowanej stronie) dwa przyciski: „Demo: właściciel” i „Demo: behawiorystka”. Logują na przygotowane konta z przykładowym psem, kilkoma wpisami i komentarzami, już połączone zaproszeniem — bez rejestracji.

## Szczegóły techniczne

Baza (jedna migracja, z GRANT-ami i politykami dostępu):
- `profiles` — `id` = użytkownik, `display_name`, `email`, `role`, `email_notifications`; tworzone triggerem przy rejestracji.
- `user_roles` + enum `app_role` (`owner`, `behaviorist`) w osobnej tabeli, z funkcją `has_role` (bezpieczeństwo).
- `dog_access` — `dog_id`, `user_id`, `role` (`owner`/`behaviorist`) — kto ma dostęp do psa.
- `dog_invites` — `dog_id`, `code`, `expires_at`, `used_by`, `used_at`.
- `dog_views` — `dog_id`, `user_id`, `last_seen_at`.
- `dogs.owner_id` ustawiane na `auth.uid()`; czyścimy istniejące wiersze `dogs`/`entries` i pliki zdjęć.
- Polityki: `dogs`/`entries` czytelne dla osób z wpisem w `dog_access` (przez funkcję `security definer`, bez rekursji); zapis wpisów tylko dla właściciela, `behaviorist_comment` aktualizowany wyłącznie przez behawiorystkę (osobna polityka/serwerowa funkcja).
- Storage `dog-photos`: polityki oparte na `dog_access`.

Aplikacja:
- Włączamy logowanie e-mail/hasło oraz dostawców Google i Apple przez narzędzia Cloud w tym samym kroku.
- Trasy aplikacji przenosimy pod `_authenticated/` (`/psy`, `/pies/$id/*`, `/profil`); `src/routes/index.tsx` zostaje publiczne, `src/lib/role.tsx` zastępujemy hookiem czytającym rolę z sesji i profilu.
- Realizacja kodów zaproszeń, nadanie dostępu i konta demo przez `createServerFn` (demo — tylko gdy środowisko nie jest produkcyjne).
- Liczniki nowości liczone zapytaniem po `dog_views` vs `entries.created_at` / czas edycji komentarza; komentarz dostaje własny `commented_at`.

## Czego teraz nie robimy

Wysyłki e-maili (zostaje sama preferencja), zaproszeń linkiem, eksportu danych.
