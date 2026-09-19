# Pakiet poprawek po audycie b934070

Punkt wyjścia: commit b934070 (aktualny, brak nowszych zmian). Zachowujemy obecny design, funkcje i model uprawnień. Bez publikacji — Publish wykonujesz sam.

## 1. Koniec nieskończonego ładowania na stronach psa

Dziś każda z pięciu zakładek psa (dziennik, kalendarz, tabela, zalecenia, analiza) przy jakimkolwiek problemie pokazuje wieczny szkielet. Wprowadzamy wspólną obsługę stanów w trasie nadrzędnej `pies.$id.tsx`, z jednym komponentem komunikatów:

- **Pies niedostępny** (nie istnieje, nieprawidłowy identyfikator, odebrany dostęp): „Ten pies jest niedostępny" + przycisk „Twoje psy" → `/psy`. Bez rozróżniania cudzego psa od nieistniejącego.
- **Błąd pobrania psa**: „Nie udało się wczytać psa" + „Spróbuj ponownie" + powrót do „Twoich psów".
- **Błąd wpisów**: „Nie udało się wczytać wpisów" + ponowienie (nigdy „Brak wpisów").
- **Błąd uprawnień**: „Nie udało się sprawdzić uprawnień" + ponowienie; akcje wymagające uprawnień niedostępne.
- **Brak internetu**: komunikat zamiast szkieletu, również gdy biblioteka zapytań wstrzyma żądanie; po odzyskaniu sieci ponowienie pokazuje właściwe dane.
- Pusty dziennik bez zmian.

Szczegóły:
- `useDog` przechodzi na `maybeSingle()` — pusty wynik = „niedostępny", błąd zapytania = „błąd pobrania". Format UUID sprawdzany przed zapytaniem.
- Layout psa pobiera psa raz i przekazuje stan dzieciom; przy potwierdzonym braku dostępu nie pokazujemy zapamiętanej treści (zmiana psa, odebrany dostęp, zmiana konta).
- Oznaczenie psa jako obejrzanego dopiero po potwierdzeniu dostępu.
- Ekrany szczegółów/edycji wydarzenia: błąd pobrania ≠ brak wydarzenia (bez przekierowania).
- Lokalne `errorComponent`/`notFoundComponent` dla tras psa.

Pliki: `src/lib/dogs.ts`, `src/routes/_authenticated/pies.$id.tsx`, wszystkie zakładki i trasy wydarzeń, nowy wspólny komponent komunikatów.

## 2. Migracja: blokada własnych kodów i zużycia bez nadania dostępu

Jedna nowa migracja w `supabase/migrations/` (bez edycji historycznych). Podmienia `private.redeem_dog_invite_impl(text)`, zachowując publiczne RPC `redeem_dog_invite`, typ wyniku i `SECURITY DEFINER`:

- **Kod behawiorysty**: jeśli `behaviorist_id = auth.uid()` → błąd „Nie możesz użyć własnego kodu zaproszenia", żadnego zapisu.
- **Kod psa**: jeśli użytkownik jest właścicielem psa lub ma już dostęp → błąd „Masz już dostęp do tego psa"; kod pozostaje niewykorzystany, rola i status bez zmian. Zabezpieczenie wykonane na zapisie (nie tylko wcześniejszym odczycie), żeby dwie równoczesne próby nie dały duplikatu.
- Blokada rekordu zaproszenia (`FOR UPDATE`) i atomowość zachowane. Odrzucony kod działa dalej dla nowej osoby.

Przed zastosowaniem zapisuję obecną definicję funkcji do ewentualnego wycofania. Po migracji odczytuję wynikową definicję z bazy jako dowód. Samopowiązań spoza danych audytowych nie ma (sprawdzone: 0) — porządkowanie niepotrzebne.

## 3. Komunikaty w obu ścieżkach zaproszenia

- Wspólne wyciąganie komunikatu błędu (Supabase zwraca obiekt z `message`, nie zawsze `Error`) w `src/lib/access.ts`.
- `join-dialog.tsx` i `/auth?code=...` (`src/routes/auth.tsx`) pokazują nowe komunikaty („Nie możesz użyć własnego kodu…", „Masz już dostęp…"), a przy braku czytelnego komunikatu — ogólny tekst bez szczegółów technicznych.
- Po błędzie formularz pozwala poprawić kod (już tak działa — potwierdzę).

## 4. Współwłaściciel — tylko potwierdzenie

Sprawdzam, że przycisk „Zakończ" jest widoczny wyłącznie dla zalogowanego behawiorysty przy aktywnej współpracy (`invite-dialog.tsx`) i że nigdzie indziej współwłaściciel nie dostaje tej akcji. Bez zmian macierzy uprawnień.

## 5. Testy odbiorcze

Na kontrolowanych kontach demo i rekordach utworzonych do odbioru (po testach usuwam tylko je):

- **Stany psa**: dostępny / niedostępny / nieistniejący / nieprawidłowy identyfikator na wszystkich zakładkach i bezpośrednich adresach wydarzeń; offline, zerwanie połączenia, ponowienie; osobne błędy psa/wpisów/uprawnień; pusty dziennik; odebranie dostępu po otwarciu psa; wylogowanie i wejście na inne konto (brak danych poprzednika); desktop i 320–390 px, klawiatura i fokus.
- **Zaproszenia** (wpisany kod, link, bezpośrednie RPC): własny kod behawiorysty → błąd + brak relacji w bazie; kod własnego psa → błąd + kod niewykorzystany; ten sam kod po odrzuceniu → sukces u nowej osoby; poprawny kod innego behawiorysty i zaproszenia współwłaściciela/behawiorysty → właściwe role i statusy; spacje/małe litery/pusty/nieistniejący/wygasły/wykorzystany — bez zmian; równoczesne użycie tego samego kodu → co najwyżej jedno powodzenie; dwa kody tego samego psa u jednej osoby → jeden dostęp; bez sesji → brak dostępu.
- **Regresje**: uprawnienia właściciela/współwłaściciela/behawiorysty (aktywny, oczekujący, zakończony); `/psy` → dziennik; selektor psa zachowuje zakładkę; zapisy wydarzenia/komentarza/zalecenia trwałe po odświeżeniu; `bun install --frozen-lockfile`, build, tsgo, lint zmienionych plików, testy wyboru psa 6/6 + nowe testy odrzucenia kodu.

iPhone (fizyczny Safari) i logowanie Google: **BLOCKED** — brak urządzenia i konta; podam krótkie kroki ręcznego odbioru.

## 6. Poza zakresem

React #418, pojedyncze 401, odświeżanie wygasających adresów zdjęć — osobna diagnoza. Bez zmian logowania, zależności i designu. Bez publikacji.

## 7. Raport końcowy

Commit przed/po, lista zmienionych plików, nazwa i status migracji z dowodem (wynikowa definicja funkcji w bazie), tabela scenariusz | PASS/FAIL/BLOCKED | dowód, potwierdzenie usunięcia danych audytowych, pozostałe problemy i kroki ręcznego odbioru.

## Szczegóły techniczne

- Migracja: `CREATE OR REPLACE FUNCTION private.redeem_dog_invite_impl(text)` w jednej nowej migracji; publiczny wrapper bez zmian. Testy przedwdrożeniowe odrzucenia (własny kod, istniejący dostęp, równoległe próby) po zastosowaniu — na kontach demo.
- Wyciąganie komunikatu: `typeof err === "object" && "message" in err` (tak jak już w `join-dialog.tsx`), wspólna funkcja np. `inviteErrorMessage(err)`.
- Layout psa: `useDog(id)` z `maybeSingle()` + walidacja UUID (`/^[0-9a-f-]{36}$/i`); stany: `loading | not-found | error | offline | ready`; `navigator.onLine` + `online/offline` nasłuch; ponowienie = `refetch()` psa, wpisów i uprawnień.
