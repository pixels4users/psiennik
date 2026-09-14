# Retencja rejestru akceptacji + utwardzenie zapisu

## 1. Proponowana polityka retencji (do Twojej weryfikacji)

Rejestr akceptacji dokumentów przechowujemy:

- przez czas obowiązywania umowy o prowadzenie konta;
- następnie do końca szóstego roku kalendarzowego następującego po roku, w którym umowa się zakończyła;
- krócej, jeżeli dalsze przechowywanie przestanie być niezbędne;
- w razie konkretnego sporu — wyłącznie dowody potrzebne w tej sprawie, przez czas niezbędny do jej zakończenia i rozliczenia, z udokumentowanym uzasadnieniem przedłużenia.

To polityka dowodowa przyjęta przez operatora, a nie obowiązkowy termin wynikający z RODO.

### Uzasadnienie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f)

Interes: możliwość wykazania, na jakich warunkach i kiedy została zawarta umowa o prowadzenie konta oraz że użytkownik zapoznał się z aktualną wersją dokumentów. Bez takiego zapisu operator nie może odeprzeć twierdzenia, że użytkownik nigdy nie przyjął regulaminu, ani wykazać zgodności z obowiązkiem informacyjnym. Sześć lat kalendarzowych odpowiada najdłuższemu realnie spodziewanemu okresowi dochodzenia roszczeń w relacji z użytkownikiem-przedsiębiorcą i jednocześnie porządkuje usuwanie do jednej daty w roku.

### Ocena proporcjonalności

- Zakres jest minimalny: nie przechowujemy treści konta, dziennika ani zdjęć — wyłącznie fakt i wersję dokumentu.
- Nie zbieramy automatycznie adresu IP ani danych urządzenia; sam dowód nie wymaga profilowania ani śledzenia.
- Wpływ na użytkownika jest niski: dane nie służą do kontaktu, marketingu ani decyzji wobec osoby; po usunięciu konta pozostaje wyłącznie zapis techniczny.
- Interes użytkownika w usunięciu zapisu ustępuje interesowi obu stron w ustaleniu treści umowy; użytkownik może zgłosić sprzeciw i wtedy oceniamy sprawę indywidualnie.
- Okres jest zamknięty i egzekwowany automatycznie, nie „bezterminowo do odwołania".

### Jak dowód identyfikuje stronę umowy po usunięciu profilu

Po usunięciu konta zapis nie zawiera e-maila ani imienia. Zostaje techniczny identyfikator konta (ten sam UUID, którym konto posługiwało się w systemie), wersja dokumentu, czas serwera i sposób akceptacji. Powiązanie z konkretną osobą jest możliwe wyłącznie wtedy, gdy ta osoba sama przedstawi swój identyfikator albo gdy jej twierdzenia pozwolą go odtworzyć w toku sprawy. Dla operatora sam wpis nie jest wystarczający do zidentyfikowania osoby bez dodatkowych informacji pochodzących od niej — i taki właśnie jest zamiar: dowód wystarczający w sporze, bezużyteczny do jakiegokolwiek innego celu.

### Powiadomienia oceniane oddzielnie

Zdarzenia typu „powiadomienie" (zmiana dokumentu wchodząca bez wymaganej akceptacji) mają słabszą wartość dowodową i krótszy okres: **do końca drugiego roku kalendarzowego po roku zdarzenia**, a przy zakończonej umowie — nie dłużej niż zapisy akceptacji. Nie łączymy ich z okresem sześcioletnim.

## 2. Proponowane brzmienie do polityki prywatności

> **Rejestr akceptacji dokumentów**
>
> Zapisujemy minimalny dowód tego, że i kiedy przyjąłeś regulamin oraz politykę prywatności. Wpis zawiera wyłącznie: techniczny identyfikator konta, rodzaj dokumentu, jego wersję, czas zapisany przez nasz serwer oraz sposób, w jaki akceptacja nastąpiła (założenie konta, logowanie przez zewnętrznego dostawcę albo ekran z prośbą o akceptację zmiany). Nie zapisujemy przy tym adresu IP ani danych Twojego urządzenia.
>
> Podstawą jest nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO) polegający na możliwości wykazania treści zawartej umowy i wykonania obowiązku informacyjnego.
>
> Wpisy o akceptacji przechowujemy przez czas trwania umowy o prowadzenie konta, a po jej zakończeniu do końca szóstego roku kalendarzowego liczonego od roku zakończenia. Usuwamy je wcześniej, jeżeli przestaną być potrzebne. Jeżeli toczy się konkretna sprawa sporna, zachowujemy wyłącznie dowody potrzebne w tej sprawie i wyłącznie do czasu jej prawomocnego zakończenia i rozliczenia. To nasza wewnętrzna zasada dowodowa, a nie termin nakazany przepisami o ochronie danych.
>
> Wpisy o samym powiadomieniu o zmianie dokumentu przechowujemy krócej — do końca drugiego roku kalendarzowego po roku zdarzenia.
>
> Usunięcie konta nie przedłuża przechowywania pozostałych danych: dziennik, wpisy, zdjęcia i profil usuwamy razem z kontem, zgodnie z opisem powyżej. Rejestr akceptacji jest jedynym elementem, który pozostaje dłużej, i w opisanym wyżej minimalnym zakresie.
>
> Możesz w każdej chwili sprzeciwić się temu przechowywaniu, pisząc na kontakt@psiennik.pl. Ocenimy zgłoszenie indywidualnie i usuniemy wpis, jeśli nie będziemy mieli podstaw do jego zachowania.

## 3. Mechanizm usuwania

- Każdy wpis dostaje wyliczaną datę usunięcia (`purge_after`). Dla powiadomienia: koniec drugiego roku kalendarzowego po zdarzeniu. Dla akceptacji przy aktywnym koncie: brak daty (umowa trwa).
- W chwili usunięcia konta wpisy tego konta dostają `purge_after` = 31 grudnia szóstego roku po roku usunięcia, a powiązanie z kontem zostaje zerwane (zostaje sam identyfikator tekstowy).
- Wpisy objęte konkretnym sporem oznaczamy blokadą (`legal_hold` z notatką uzasadniającą) — usuwanie je pomija do czasu zdjęcia blokady.
- Codzienne zadanie w bazie usuwa wpisy, których `purge_after` minął i które nie mają blokady.
- Usunięcie na żądanie (sprzeciw) realizujemy ręcznie po ocenie zgłoszenia.

## 4. Utwardzenie zapisu (Twoja uwaga wdrożeniowa)

Funkcja `recordLegalAcceptance` już korzysta z uwierzytelnienia serwerowego i bierze identyfikator konta z sesji, nie z przeglądarki. Uzupełniamy pozostałe punkty:

- czas zdarzenia wyłącznie z serwera bazy — przeglądarka nie może go podać ani nadpisać;
- wersja dokumentu nie jest przyjmowana od przeglądarki: serwer używa wersji, którą sam zna dla danego rodzaju dokumentu;
- sposób akceptacji ograniczony do zamkniętej listy i weryfikowany po stronie serwera względem faktycznego sposobu logowania zapisanego w sesji;
- brak możliwości zapisu wstecznego, nadpisania lub usunięcia wpisu przez aplikację;
- test bezpieczeństwa: próba zapisu bez sesji oraz próba podszycia się pod cudze konto muszą zostać odrzucone. Sam poprawny build i działające logowanie nie są dowodem — sprawdzam to osobnym testem.

## 5. Zakres techniczny

- Migracja `legal_acceptances`: kolumny `account_ref text`, `purge_after date`, `legal_hold boolean`, `legal_hold_reason text`; zmiana klucza obcego z kasowania kaskadowego na `ON DELETE SET NULL`, aby wpis przeżył usunięcie konta; wyzwalacz wyliczający `purge_after` dla powiadomień; funkcja `private.purge_legal_acceptances()` + harmonogram `pg_cron` (codziennie); blokada zapisu wstecznego `created_at`.
- `src/lib/account.functions.ts` → `deleteMyAccount`: przed usunięciem konta ustawia `account_ref`, zrywa `user_id` i wylicza `purge_after`.
- `src/lib/legal.functions.ts`: serwer ustala wersję dokumentu i weryfikuje `method` względem sesji; przestaje przyjmować wersję z klienta.
- `src/lib/auth.tsx`: dopasowanie wywołań (bez przekazywania wersji).
- `src/routes/prywatnosc.tsx`: sekcja o rejestrze akceptacji w brzmieniu z punktu 2 oraz uzupełnienie tabeli okresów przechowywania.
- Test Playwright + zapytania do bazy: zapis bez sesji odrzucony, cudzy identyfikator ignorowany, `purge_after` ustawiany przy usunięciu konta.
