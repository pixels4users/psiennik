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
| Zalecenia w cudzym dzienniku | Do decyzji — patrz niżej |
| Konto nieużywane | Bez automatycznego kasowania, ale z corocznym przeglądem zasadności przechowywania (przypomnienie po 24 miesiącach bezczynności, potem decyzja) |
| Rejestr akceptacji | Dane ograniczone do minimum (identyfikator konta, wersja, data, sposób), cel: dowód zawarcia umowy; okres i uzasadnienie do potwierdzenia razem z Tobą |

Wymagające Twojej decyzji:
1. **Zalecenia behawiorysty po usunięciu jego konta** — proponuję: treść zalecenia zostaje przy wpisie właściciela, ale zastępujemy dane osobowe behawiorysty opisem „behawiorysta (konto usunięte)"; w bazie zrywamy powiązanie z jego identyfikatorem. Alternatywa: usunięcie także treści zaleceń.
2. **Rejestr akceptacji po usunięciu konta** — przechowywanie dowodu w profilu jest sprzeczne z jego usunięciem. Proponuję: wiersze rejestru zostają, ale bez e-maila i imienia, z samym identyfikatorem konta; okres i cel opisujemy w polityce. Jeśli wolisz pełne usunięcie — rejestr znika razem z kontem i rezygnujemy z dowodu.
3. **Współwłaściciele** — usunięcie konta głównego właściciela odbiera im dzienniki. Przed potwierdzeniem pokazujemy to wprost, z listą psów i liczbą osób, które stracą dostęp.
4. **Eksport przed usunięciem** — proponuję prosty przycisk „Pobierz moje dane" (plik z wpisami i listą psów) obok usuwania konta oraz mailową procedurę dostępu i eksportu opisaną w polityce.

Dopóki tych punktów nie ustalimy, nie zmieniam treści dokumentów o retencji.

## 6. Wiek i status użytkownika

- Usługa dla osób pełnoletnich (18+) — zapis w regulaminie i informacja przy rejestracji.
- Regulamin obejmuje konsumentów oraz firmy: osobne sekcje o odstąpieniu i reklamacjach dla konsumentów i przedsiębiorców na prawach konsumenta, oraz zasady dla pozostałych. Rola w aplikacji nie przesądza statusu.

## 7. DPA na planie Pro

Nie publikujemy zdania „szczegóły powierzenia w trakcie ustaleń" — to nie zastępuje umowy powierzenia. Do czasu potwierdzenia polityka wskazuje wyłącznie fakty potwierdzone: dostawcą infrastruktury jest Lovable, baza działa w regionie UE (Irlandia); o logach, kopiach, wsparciu i pozostałych usługach nic nie deklarujemy.

Pytania do wysłania do Lovable (przygotuję gotową wiadomość do skopiowania):
1. Jaka umowa obejmuje przetwarzanie danych użytkowników aplikacji na planie Pro i jak ją zawrzeć — publiczna strona wiąże DPA z Business/Enterprise.
2. Kto jest podprocesorem bazy i plików, gdzie fizycznie leżą dane poza wskazanym regionem.
3. Czy występują transfery poza EOG (wsparcie, logi, monitoring) i na jakiej podstawie.
4. Retencja kopii zapasowych i logów oraz czas usunięcia danych z kopii po skasowaniu konta.
5. Kto po stronie Lovable i podprocesorów ma techniczny dostęp do treści bazy i jak jest to kontrolowane.

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
