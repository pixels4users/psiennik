# Kontrola techniczna w Lovable po synchronizacji

19.09.2026 · Psiennik · pakiet UX/UI z gałęzi `codex/psiennik-ui-refresh`.

Poniższy tekst można przekazać Lovable po potwierdzeniu, że pobrało merge tego PR do `main`. Dokładny SHA merge podaje wiadomość przekazania w Codex/GitHub.

---

Gotowy refresh UX/UI został zaimplementowany i sprawdzony lokalnie, a następnie przekazany przez GitHub. Sprawdź jego działanie w swoim środowisku i na właściwym backendzie. Zachowaj obecną implementację i zakres funkcji. Na tym etapie wykonaj audyt oraz testy; ewentualne niezbędne poprawki opisz z uzasadnieniem. Publish wykonam sam po odbiorze.

## 1. Synchronizacja i uruchomienie

- Potwierdź repozytorium `pixels4users/psiennik`, śledzoną gałąź `main` oraz SHA uruchomionego kodu. Porównaj go z commitem merge wskazanym przy przekazaniu. Jeśli pojawił się późniejszy commit, sprawdź, czy zawiera ten merge i co dodatkowo zmienia.
- Sprawdź instalację z istniejącego `bun.lock` (`bun install --frozen-lockfile`), `bun run build`, `tsc --noEmit` oraz `bun run test:ui`. Nie aktualizuj zbiorczo zależności ani nie regeneruj lockfile tylko na potrzeby kontroli. Pakiet dodaje `motion@13.4.0`.
- Potwierdź start aplikacji w rzeczywistym środowisku Lovable, a także działanie bezpośrednich wejść i odświeżeń `/`, `/auth`, `/psy`, `/profil` i `/pies/{id}` wraz z jego zakładkami. Sam udany build nie potwierdza działania serwera.
- Sprawdź konsolę przeglądarki, żądania sieciowe oraz dostępne logi serwera pod kątem błędów aplikacji, hydratacji i nieobsłużonych wyjątków.

## 2. Konfiguracja i zasoby

- Potwierdź użycie właściwego projektu Supabase i dotychczasowej konfiguracji środowiska. Wskaż projekt bez ujawniania wartości kluczy. Aplikacja nie może korzystać z lokalnego API `127.0.0.1:4174`, kont `@ui.psiennik.test` ani skryptu `dev:ui-review`.
- Sprawdź, czy obrazy strony głównej, logo, motywy psów i fonty wczytują się w Lovable, w tym zasoby pod `/__l5e/assets-v1/…`. Sprawdź błędy 404/CORS i wygasanie adresów zdjęć z Supabase Storage.
- Potwierdź, że dane testowe i klucze administracyjne nie trafiły do wynikowego klienta. Lokalne fixture są przeznaczone wyłącznie do uruchomienia skryptu odbioru.

## 3. Logowanie, role i izolacja danych

Użyj kontrolowanych kont testowych i należących do nich danych. Operacje zapisu, cofania współpracy i usuwania testuj tylko na rekordach utworzonych do tego odbioru.

- Sprawdź logowanie, wylogowanie, odświeżenie sesji i stosowane przez projekt zewnętrzne metody logowania. Użytkownik niezalogowany nie powinien otrzymywać prywatnych danych przez bezpośredni URL.
- Sprawdź właściciela, współwłaściciela, behawiorystę z aktywną/oczekującą/zakończoną relacją oraz konto bez dostępu do danego psa. Potwierdź uprawnienia do odczytu i zapisu także na poziomie odpowiedzi backendu, zgodnie z istniejącą polityką. Widoczny albo ukryty przycisk nie potwierdza bezpieczeństwa.
- Sprawdź przełączanie psów, odświeżanie strony, odebranie dostępu do zapamiętanego psa oraz wylogowanie i wejście na inne konto. Zapamiętany wybór nie może udostępnić psa innego użytkownika ani pozostawić jego danych w widoku.
- Zachowaj obecny model dostępu właściciela do dziennika. Jeśli istniejące reguły blokują oczekiwany scenariusz, zgłoś go z dowodem; nie zmieniaj RLS w ramach samego audytu UI.

## 4. Nawigacja i zapis danych

- Właściciel z jednym psem po wejściu na `/psy` trafia do jego dziennika; z kilkoma psami wybiera właściwego psa i zachowuje aktywną zakładkę. Konto bez psów ma działającą ścieżkę dodania pierwszego psa.
- Behawiorysta nadal widzi listę psów oraz właściwe grupy statusów; z karty otwiera właściwego psa.
- Sprawdź dziennik, kalendarz, tabelę, zalecenia i analizę, w tym stany puste oraz błędy pobierania.
- Na danych testowych dodaj i edytuj psa oraz wydarzenie; sprawdź komentarz i zalecenie zgodnie z uprawnieniami danej roli. Po odświeżeniu zapis musi pozostać przypisany do właściwego psa i autora. Sprawdź, czy ponowne kliknięcie lub opóźniona odpowiedź nie tworzy duplikatów.
- Sprawdź wybór, zmianę, anulowanie zmiany i usunięcie zdjęcia psa. Istniejące zdjęcie nie może wyświetlać komunikatu „Nie wybrano pliku”; komunikat błędu uploadu musi być czytelny. Potwierdź prawidłowy zapis i późniejszy odczyt ze Storage.

## 5. Kody zaproszeń i nazwy osób

- Na obu rolach sprawdź wejście „Wpisz kod zaproszenia” z profilu i menu konta. Dotychczasowe kody i linki udostępniane przez behawiorystę mają nadal działać.
- Sprawdź istniejące typy kodów przez wpisanie i przez link: powiązanie właściciela z behawiorystą oraz dostęp do psa dla właściwych ról. Po sukcesie listy i nawigacja powinny od razu odzwierciedlać nową relację.
- Sprawdź spacje i małe litery, pusty/nieprawidłowy/wygasły lub wykorzystany kod, powtórną próbę i własny kod, zgodnie z regułami danego typu. Błąd powinien pozostawić formularz w stanie umożliwiającym poprawienie kodu; ponowne kliknięcie w trakcie zapisu nie powinno wysłać drugiej operacji.
- Nazwa behawiorysty na stronie psa i w profilu pochodzi z `profiles.display_name`, z istniejącym fallbackiem na email. Zmień nazwę na koncie testowym, następnie ponownie otwórz oba widoki właściciela i potwierdź aktualne dane. Imię „Anna” nie jest stałą aplikacji.
- Sprawdź relację utworzoną kodem przed udostępnieniem wspólnego psa. Istniejące RLS mogą wtedy nie udostępniać profilu drugiej osoby. Oczekiwany fallback to „Behawiorysta” i rzeczywisty status relacji, bez błędu całej listy i bez ujawnienia niedostępnych danych.

## 6. Mobile, dostępność i animacje

- Sprawdź telefon, Safari/iOS i klawiaturę ekranową: otwieranie i zamykanie dialogów/popoverów, przewijanie formularza oraz brak blokady strony po zamknięciu. Sprawdź także układ przy szerokości 320–390 px.
- Klawiaturą sprawdź widoczność fokusu, Tab/Shift+Tab, Escape i powrót fokusu do przycisku, który otworzył dialog — również z menu konta.
- Włącz systemowe ograniczenie ruchu. Treści muszą pozostać widoczne i dostępne; animacje dekoracyjne powinny być ograniczone. Sprawdź tę opcję również po jej zmianie podczas działania aplikacji.
- Na stronie głównej elementy ujawniają się podczas przewijania jednokrotnie. Dziennik i zakładki używają krótkich przejść; odświeżenie danych nie powinno odtwarzać animacji całej listy ani wykresów. Sprawdź brak przesunięć układu, ukrytych treści i ciągłych animacji obciążających telefon.

## Znane ograniczenia, które trzeba rozróżnić od regresji

- Lokalnie zbudowano klienta, SSR i Nitro `cloudflare-module` ze świeżej instalacji; testy wyboru psa przeszły 6/6. Testy przeglądarkowe używały danych w pamięci, więc nie potwierdzają rzeczywistego logowania, RLS, Storage ani operacji bazodanowych. Raport: [zgodnosc-z-lovable.md](zgodnosc-z-lovable.md).
- React #418 odtworzono także na niezmienionym bazowym `main` (`01f73b6`), w sekwencji strona główna → logowanie → bezpośrednie wejście `/profil` bez sesji. Sprawdź, czy występuje w Lovable, i wskaż przyczynę oraz wpływ. Nie oznaczaj go automatycznie jako nowej regresji, ale uwzględnij w odbiorze.
- Dotychczasowy `vite preview` lokalnie szukał `dist/server/server.js`, podczas gdy Nitro tworzy `.output/server/index.mjs`. Worker sprawdzano przez Wrangler. Zasoby `/__l5e/assets-v1/…` wymagają środowiska Lovable. Zweryfikuj faktyczne uruchomienie i zasoby u siebie przed proponowaniem zmian konfiguracji.
- Pakiet nie dodaje migracji ani funkcji Supabase. Korzysta z istniejących tabel i `redeem_dog_invite`; nie wymaga `get_collaboration_profiles()`. Synchronizacja Git ani Publish nie są dowodem stanu bazy. Jeśli test ujawni rozbieżność backendu, opisz ją osobno wraz z konkretnym brakującym elementem.

## Wynik audytu

Zwróć tabelę: **obszar · PASS / FAIL / BLOCKED · sprawdzony scenariusz · dowód · ewentualna poprawka**. Podaj SHA testowanego kodu, adres podglądu, role i przeglądarki. Przy błędzie podaj kroki odtworzenia, żądanie/komunikat bez sekretów i ustalenie, czy problem istniał przed tym PR. Wskaż osobno rzeczy, których nie udało się sprawdzić.

Na końcu napisz, czy są blokery publikacji, i wymień je konkretnie. Nie oznaczaj punktu jako PASS wyłącznie na podstawie analizy kodu, jeśli wymaga testu na działającej aplikacji. Nie publikuj aplikacji.
