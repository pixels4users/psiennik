# Uzupełnienia prawne: kontakt, fonty, retencja, rejestr akceptacji

Domykamy etap A po Twoich decyzjach i uwagach. Płatności (etap B) zostają nietknięte.

## 1. Adres e-mail do kontaktu

W dokumentach i stopce wpisuję `kontakt@psiennik.pl`.

Skrzynka działa w Google Workspace, więc Google dopisuję do mapy dostawców: obsługa korespondencji kontaktowej, reklamacji i zgłoszeń dotyczących prywatności. Wysyłka powiadomień z aplikacji nadal idzie przez `notify.psiennik.pl` i tego nie ruszamy.

## 2. Dane operatora

Pełne dane (nazwa, adres, NIP PL 7262448188, REGON, e-mail) w regulaminie, polityce prywatności i nowej stronie kontaktowej. W stopce skrócona wersja: nazwa działalności, e-mail, linki do dokumentów. NIP zapisany jako „NIP: PL 7262448188", bez wniosków o statusie VAT.

## 3. Fonty lokalnie

Robię to ja, Ty nic nie musisz. Cormorant Garamond i Inter są na licencji SIL Open Font License 1.1 — wolno je hostować u siebie.
- Pobieram pliki `.woff2` (te same kroje i grubości co dziś) do `public/fonts/`.
- Dodaję `@font-face` w stylach, usuwam odwołania do Google Fonts z nagłówka strony.
- Dokładam plik licencji OFL i notę licencyjną.
- W polityce piszę dokładnie: „Pobieranie krojów pisma nie powoduje połączenia z serwerami Google." Bez zdania „żadne dane nie idą do Google" — logowanie Google i skrzynka w Workspace pozostają osobnymi przypadkami, opisanymi w mapie dostawców.
- Porównuję wygląd przed i po zmianie.

## 4. Akceptacja regulaminu i rejestr zdarzeń

Wyświetlenie informacji to nie akceptacja — rozdzielam te dwa przypadki.

- **Nowe konto:** akceptacja przez zawarcie umowy (kliknięcie „Załóż konto" / logowanie Google/Apple przy pierwszym wejściu), z widoczną notką. Bez checkboxa.
- **Zmiana wymagająca akceptacji:** ekran blokujący z podsumowaniem zmian i przyciskiem „Akceptuję i kontynuuję". Dopiero kliknięcie zapisuje akceptację.
- **Zmiana wchodząca w życie w trybie powiadomienia** (np. zmiana danych operatora): zapisujemy zdarzenie typu „powiadomienie", nigdy akceptację.

Historia zamiast nadpisywania: nowa tabela `legal_acceptances` — jeden wiersz na zdarzenie, bez edycji i usuwania przez aplikację. Pola: użytkownik, rodzaj dokumentu, wersja, rodzaj zdarzenia (akceptacja / powiadomienie), sposób (e-mail / Google / Apple / ekran zmiany), data. Kolumny `terms_*` w profilu zostają jako szybki wskaźnik „co obowiązuje teraz", ale dowodem jest rejestr.

Archiwum wersji dokumentów (pliki w repozytorium + lista „Poprzednie wersje" na stronach) prowadzimy dodatkowo — pokazuje treść, nie zastępuje historii zdarzeń użytkownika.

## 5. Usuwanie i retencja — do potwierdzenia

Bez obietnicy „natychmiast i nieodwracalnie". Rozdzielam trzy warstwy: aplikacja, kopie zapasowe, dane zachowane z uzasadnieniem.

| Dane | Zasada |
|---|---|
| Konto, profil, psy i dzienniki głównego właściciela | Usunięcie z działającej aplikacji od razu po potwierdzeniu; bez kosza |
| Zdjęcia psów | Usuwane razem z psem |
| Kopie zapasowe | Dane znikają wraz z rotacją kopii — okres wpisany dopiero po odpowiedzi Lovable |
| Psy udostępnione przez kogoś innego | Zostają u właściciela; znika tylko Twój dostęp |
| Zalecenia w cudzym dzienniku | Treść zostaje przy wpisie właściciela, powiązanie z kontem zerwane |
| Konto nieużywane | Bez automatycznego kasowania, ale z corocznym przeglądem zasadności przechowywania (przypomnienie po 24 miesiącach bezczynności, potem decyzja) |
| Rejestr akceptacji | Minimalny zakres (identyfikator konta, wersja, data, sposób); okres i uzasadnienie ustalamy przed wdrożeniem |

Twoje decyzje, które wdrażam:
1. **Zalecenia po usunięciu konta behawiorysty** — treść zostaje przy dzienniku, powiązanie z kontem usuwamy, przy zaleceniu pokazujemy „Behawiorysta — konto usunięte". Nie nazywamy tego anonimizacją: treść może zawierać podpis lub inne dane. W polityce opisujemy cel dalszego przechowywania (dokumentacja pracy z psem prowadzona przez właściciela) i tryb obsługi żądań dotyczących takich treści — zgłoszenie na `kontakt@psiennik.pl`, ocena indywidualna, usunięcie fragmentu gdy nie ma podstaw do zachowania.
2. **Historia akceptacji po usunięciu konta** — zachowujemy minimalny, faktycznie użyteczny dowód: identyfikator konta, rodzaj dokumentu, wersja, data, sposób. Bez e-maila i imienia. Okresu nie wybieram arbitralnie — proponuję ustalić go razem przed wdrożeniem, na podstawie tego, przed jakim roszczeniem ten dowód ma chronić; do tego czasu nie wpisuję żadnej liczby do dokumentów.
3. **Dzienniki współwłaścicieli** — na MVP usuwane razem z kontem głównego właściciela. Ekran potwierdzenia wymienia psy i liczbę osób, które stracą dostęp, i proponuje eksport przed usunięciem.
4. **Eksport** — przycisk „Pobierz moje dane" w profilu. Zakres: psy, wpisy i zalecenia w czytelnym pliku tekstowym; zdjęcia dołączane tak, jak je przechowujemy (oryginalne pliki z ich ścieżkami). Eksport działa na uprawnieniach zalogowanego konta — obejmuje wyłącznie psy, do których ma dostęp, i nie zawiera danych innych kont poza tym, co i tak widać w aplikacji (imię autora zalecenia).

Do domknięcia przed wdrożeniem dokumentów: okres przechowywania rejestru akceptacji (punkt 2).

## 6. Wiek i status użytkownika

- Usługa dla osób pełnoletnich (18+) — zapis w regulaminie i informacja przy rejestracji.
- Regulamin obejmuje konsumentów oraz firmy: osobne sekcje o odstąpieniu i reklamacjach dla konsumentów i przedsiębiorców na prawach konsumenta, oraz zasady dla pozostałych. Rola w aplikacji nie przesądza statusu.

## 7. DPA na planie Pro

Nie publikujemy zdania „szczegóły powierzenia w trakcie ustaleń" — to nie zastępuje umowy powierzenia. Do czasu potwierdzenia polityka wskazuje wyłącznie fakty potwierdzone: dostawcą infrastruktury jest Lovable, baza działa w regionie UE (Irlandia); o logach, kopiach, wsparciu i pozostałych usługach nic nie deklarujemy.

Pytania do Lovable zostały przez Ciebie wysłane. Do czasu odpowiedzi polityka prywatności wskazuje wyłącznie fakty potwierdzone, bez deklaracji o DPA, logach, kopiach ani wsparciu.

Materiały: DPA Lovable (https://lovable.dev/data-processing-agreement), podprocesorzy (https://lovable.dev/subprocessors).

## 8. Braki do domknięcia w tym etapie

- Procedura dostępu do danych i eksportu — mailowa, opisana w polityce, plus przycisk eksportu w profilu.
- Rejestr czynności przetwarzania (art. 30 RODO) — przygotowuję dokument roboczy dla Ciebie, nie publikujemy go na stronie.
- Sprawdzenie na opublikowanej stronie, jakie pliki cookie i połączenia zewnętrzne faktycznie występują — wynik decyduje, czy baner jest w ogóle potrzebny (dziś wychodzi, że nie).
- Obsługa istniejących kont: sprawdzam, jak zachowa się użytkownik zarejestrowany przed zmianami oraz pierwsze logowanie Google/Apple.
- Testy: usunięcie konta ze zdjęciami, z danymi współdzielonymi i z rolą behawiorysty; sprawdzenie, co zostaje w bazie i w plikach.

## Zakres zmian technicznych

- Migracja: tabela `legal_acceptances` (append-only, RLS: użytkownik widzi własne wiersze, zapis tylko przez serwer).
- `src/lib/legal.ts` — adres e-mail, 18+, wersje dokumentów, treści o retencji.
- `src/routes/regulamin.tsx`, `src/routes/prywatnosc.tsx` — retencja, usuwanie, konsument/firma, dostawcy (Lovable, Google Workspace, logowanie Google/Apple), archiwum wersji.
- Nowa strona `/kontakt`; skrócona stopka w `src/components/site-footer.tsx`.
- `public/fonts/*`, `@font-face` w `src/styles.css`, usunięcie Google Fonts z `src/routes/__root.tsx`, plik licencji.
- `src/routes/_authenticated/profil.tsx` — opis skutków usunięcia (w tym utrata dostępu przez współwłaścicieli), potwierdzenie wpisaniem słowa, przycisk eksportu danych.
- `src/lib/auth.tsx` + nowy ekran akceptacji zmian („Akceptuję i kontynuuję") i zapis zdarzeń do rejestru.

## Czekam na decyzje

- Cztery punkty z sekcji 5 (zalecenia po usunięciu konta, rejestr akceptacji po usunięciu, ostrzeżenie dla współwłaścicieli, eksport danych).
- Czy pytania do Lovable wysyłasz sam, czy mam przygotować gotową wiadomość.
