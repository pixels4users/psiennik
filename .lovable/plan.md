# Retencja rejestru akceptacji + utwardzenie zapisu

## 1. Proponowana polityka retencji (do Twojej weryfikacji)

Zapisy o **akceptacji** przechowujemy:

- przez czas obowiązywania umowy o prowadzenie konta;
- następnie do końca szóstego roku kalendarzowego następującego po roku, w którym umowa się zakończyła;
- krócej, jeżeli dalsze przechowywanie przestanie być niezbędne;
- w razie konkretnego sporu — wyłącznie dowody potrzebne w tej sprawie, przez czas niezbędny do jej zakończenia i rozliczenia, z udokumentowanym uzasadnieniem przedłużenia.

Podstawą obliczenia jest **moment zakończenia umowy**, a nie moment technicznego usunięcia danych. Jeżeli te momenty się różnią, liczymy od zakończenia umowy.

To polityka dowodowa przyjęta przez operatora, a nie termin nakazany przez RODO.

### Uzasadnienie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f)

Interes: możliwość wykazania, jaka wersja regulaminu wiązała strony i kiedy użytkownik dokonał czynności zawarcia umowy, oraz że informacja o przetwarzaniu danych została mu udostępniona. Bez takiego zapisu operator nie jest w stanie odeprzeć twierdzenia, że dokument nigdy nie został przyjęty.

Sześć lat przyjmujemy jako **jeden okres dla całego rejestru**, dopasowany do najdłuższego z terminów, jakie mogą wchodzić w grę: ogólny termin przedawnienia z art. 118 Kodeksu cywilnego wynosi sześć lat i ma zastosowanie do roszczeń użytkowników będących konsumentami, natomiast roszczenia operatora związane z prowadzeniem działalności gospodarczej przedawniają się co do zasady po trzech latach, z zastrzeżeniem przepisów szczególnych. Prowadzenie dwóch równoległych terminów dla jednego, minimalnego zapisu nie zmniejszyłoby istotnie zakresu danych, a zwiększyłoby ryzyko błędu. Jednolita data końca roku kalendarzowego jest konsekwencją przyjętego terminu, nie argumentem za nim.

**Powiadomienia** o zmianie dokumentu oceniamy oddzielnie i nie przypisujemy im z góry żadnego terminu. Przed wdrożeniem wskażemy dla każdego typu powiadomienia jego cel i wynikający z niego okres: powiadomienie o zmianie wpływającej na treść umowy może wymagać okresu zbliżonego do akceptacji, a powiadomienie wyłącznie porządkowe — wyraźnie krótszego. Do czasu tego ustalenia plan nie wpisuje liczby lat; kolumna terminu istnieje technicznie i jest wypełniana dopiero po decyzji.

### Ocena proporcjonalności

- Zakres jest minimalny: wyłącznie fakt czynności i wersja dokumentu, bez treści konta, dziennika i zdjęć.
- Nie zbieramy automatycznie adresu IP ani danych urządzenia.
- Dane nie służą do kontaktu, marketingu ani decyzji wobec osoby.
- Okres jest zamknięty i egzekwowany automatycznie, nie „bezterminowo do odwołania".
- Użytkownik zachowuje prawo sprzeciwu; każde zgłoszenie oceniamy indywidualnie, a wynik oceny nie jest przesądzony z góry.

### Wartość dowodowa po usunięciu profilu — i jak odnaleźć zapis

Po usunięciu konta zapis nie zawiera e-maila ani imienia — zostaje techniczny identyfikator konta, wersja dokumentu, czas serwera i sposób czynności. Były użytkownik zwykle nie zna swojego identyfikatora, więc sam UUID nie wystarcza do odnalezienia wpisu na podstawie reklamacji zawierającej nazwisko i adres e-mail.

Proponuję **jedno minimalne dodatkowe powiązanie**: przy zapisie wyliczamy i przechowujemy skrót adresu e-mail (HMAC z tajnym kluczem serwera). Skrótu nie da się odwrócić w adres, ale gdy były użytkownik poda swój adres w reklamacji, przeliczamy skrót i odnajdujemy właściwy wpis. Nie przechowujemy adresu w postaci czytelnej i nie dodajemy IP ani danych urządzenia.

Jeżeli nie zaakceptujesz skrótu e-maila, alternatywą jest uczciwe zapisanie w polityce, że wartość dowodowa rejestru po usunięciu konta jest ograniczona i wymaga współdziałania osoby zgłaszającej. **To decyzja do podjęcia przed wdrożeniem.**

## 2. Proponowane brzmienie do polityki prywatności

> **Rejestr czynności dotyczących dokumentów**
>
> Zapisujemy dowód akceptacji regulaminu oraz, odrębnie, udostępnienia Ci informacji o przetwarzaniu danych. Wpis potwierdza wykonanie konkretnej czynności i udostępnienie dokumentu w określonej wersji — nie stanowi potwierdzenia, że dokument został przeczytany.
>
> Wpis zawiera wyłącznie: techniczny identyfikator konta, rodzaj dokumentu, wersję, która została Ci pokazana, czas zapisany przez nasz serwer oraz sposób, w jaki czynność nastąpiła (założenie konta, logowanie przez zewnętrznego dostawcę albo ekran z prośbą o akceptację zmiany). Nie zapisujemy adresu IP ani danych Twojego urządzenia.
>
> Podstawą jest nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO) polegający na możliwości wykazania treści zawartej umowy i wykonania obowiązku informacyjnego.
>
> Dowody akceptacji przechowujemy przez czas trwania umowy o prowadzenie konta, a po jej zakończeniu do końca szóstego roku kalendarzowego liczonego od roku zakończenia umowy. Usuwamy je wcześniej, jeżeli przestaną być potrzebne. Jeżeli toczy się konkretna sprawa sporna, zachowujemy wyłącznie dowody potrzebne w tej sprawie i wyłącznie do czasu jej zakończenia i rozliczenia. To nasza wewnętrzna zasada dowodowa, a nie termin nakazany przepisami o ochronie danych.
>
> Zapisy o samym powiadomieniu o zmianie dokumentu przechowujemy krócej; okres zależy od znaczenia zmiany i jest wskazany przy opisie danego rodzaju powiadomienia. Zakończenie umowy nie przedłuża tego okresu.
>
> Twój dziennik, wpisy, zdjęcia i profil usuwamy razem z kontem i nie obejmujemy ich powyższym okresem. Niezależnie od tego przez ograniczony czas mogą pozostawać kopie zapasowe podlegające rotacji, korespondencja z nami oraz dane niezbędne w konkretnej sprawie spornej — opisujemy je w pozostałych częściach tej polityki.
>
> Możesz w każdej chwili wnieść sprzeciw wobec tego przechowywania, pisząc na kontakt@psiennik.pl. Ocenimy zgłoszenie indywidualnie, biorąc pod uwagę Twoją sytuację, i usuniemy wpis, jeżeli nie będziemy mieli ważnych prawnie uzasadnionych podstaw do jego zachowania.

## 3. Mechanizm usuwania

- Każdy wpis ma własną datę usunięcia (`purge_after`), wyliczaną według **typu zdarzenia**, nie według konta.
- Akceptacja: przy aktywnej umowie brak daty; przy zakończeniu umowy data = 31 grudnia szóstego roku po roku zakończenia umowy.
- Powiadomienie: data ustalana w chwili zapisu według rodzaju powiadomienia i **nigdy nie jest przy zakończeniu umowy przesuwana w przyszłość** — operacja zakończenia umowy może ją tylko skrócić, nigdy wydłużyć.
- Dowód objęty sporem: `legal_hold` z obowiązkową notatką uzasadniającą, **datą przeglądu** i osobą odpowiedzialną za zdjęcie blokady. Blokada bez daty przeglądu nie może zostać ustawiona; po jej upływie sprawa wraca do oceny.
- Data zakończenia umowy zapisywana osobno od daty technicznego usunięcia danych; wyliczenia opierają się na pierwszej z nich.
- Codzienne zadanie w bazie usuwa wpisy z minionym `purge_after` i bez aktywnej blokady.

## 4. Utwardzenie zapisu

- **Wersja zapisywana to wersja faktycznie pokazana użytkownikowi.** Ekran z dokumentem otrzymuje z serwera podpisany token zawierający rodzaj i wersję dokumentu oraz czas wydania. Przy zapisie serwer weryfikuje podpis i bierze wersję z tokenu, nie z dowolnego pola przesłanego przez przeglądarkę. Jeżeli w międzyczasie opublikowano nowszą wersję wymagającą akceptacji, zapis zostaje odrzucony, użytkownik widzi nową treść i ponawia czynność. Zasada „nie ufamy przeglądarce" nie oznacza pominięcia tego, co użytkownik rzeczywiście zobaczył.
- Identyfikator konta wyłącznie z uwierzytelnionej sesji serwerowej.
- Czas zdarzenia wyłącznie z serwera bazy; przeglądarka nie może go podać ani nadpisać.
- Sposób czynności ograniczony do zamkniętej listy i weryfikowany względem faktycznego sposobu logowania z sesji.
- Brak możliwości nadpisania lub usunięcia wpisu przez aplikację; zapis wsteczny zablokowany.
- Ponowienie tego samego żądania nie tworzy duplikatu (klucz idempotencji na token).

## 5. Testy

- Zapis bez sesji odrzucony.
- Identyfikator konta przesłany z przeglądarki ignorowany.
- Zmiana wersji dokumentu w trakcie otwartego formularza: zapis odrzucony, użytkownik widzi nową treść.
- Ponowienie tego samego żądania: brak duplikatu.
- Zakończenie umowy nie wydłuża terminu wpisu typu powiadomienie.
- Przerwane usunięcie konta: operacja albo kończy się w całości, albo nie zostawia konta w stanie częściowo usuniętym.
- Blokada bez daty przeglądu niemożliwa do ustawienia.

## 6. Zakres techniczny

- Migracja `legal_acceptances`: `account_ref text`, `email_hmac text` (jeśli zaakceptujesz punkt 1), `contract_ended_at timestamptz`, `purge_after date`, `legal_hold boolean`, `legal_hold_reason text`, `legal_hold_review_on date`, `legal_hold_owner text`, `idempotency_key text unique`; zmiana klucza obcego na `ON DELETE SET NULL`; wyzwalacz liczący `purge_after` per typ zdarzenia z zasadą „tylko skracanie"; funkcja `private.purge_legal_acceptances()` + harmonogram `pg_cron`; blokada zmiany `created_at`.
- Sekret `LEGAL_HMAC_KEY` dla skrótu adresu (jeśli wybierzesz tę opcję).
- `src/lib/legal.functions.ts`: wydanie i weryfikacja podpisanego tokenu wersji, weryfikacja `method` względem sesji, idempotencja.
- `src/lib/auth.tsx` i ekrany dokumentów: pobranie tokenu przy wyświetleniu, obsługa odrzucenia z powodu nowszej wersji.
- `src/lib/account.functions.ts` → `deleteMyAccount`: ustawia `contract_ended_at`, `account_ref`, zrywa `user_id`, przelicza `purge_after` tylko dla akceptacji.
- `src/routes/prywatnosc.tsx`: sekcja w brzmieniu z punktu 2 i uzupełnienie tabeli okresów.

## Do decyzji przed wdrożeniem

1. Skrót adresu e-mail (HMAC) jako minimalne powiązanie dla reklamacji po usunięciu konta — tak czy nie.
2. Okresy dla poszczególnych rodzajów powiadomień — ustalamy je razem; plan nie wpisuje liczby arbitralnie.
