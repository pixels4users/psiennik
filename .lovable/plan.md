# Uzupełnienia prawne: kontakt, fonty, retencja, rejestr akceptacji

Domykamy etap A po Twoich decyzjach. Płatności (etap B) zostają nietknięte.

## 1. Adres e-mail do kontaktu

Nie mogę założyć skrzynki pocztowej — Psiennik ma tylko wysyłkę e-maili z `notify.psiennik.pl`, bez odbierania poczty. Skrzynkę zakłada się u dostawcy poczty lub w panelu domeny.

W dokumentach i stopce wpisuję `kontakt@psiennik.pl`.

Uwaga: rekordy MX ustawiasz na `psiennik.pl`; nie ruszamy `notify.psiennik.pl`, żeby nie zepsuć wysyłki.

## 2. Dane operatora

Pełne dane (nazwa, adres, NIP PL 7262448188, REGON, e-mail) w regulaminie, polityce prywatności i nowej sekcji kontaktowej. W stopce skrócona wersja: nazwa działalności, e-mail, linki do dokumentów. NIP zapisany jako „NIP: PL 7262448188" bez wniosków o statusie VAT.

## 3. Fonty lokalnie

Robię to ja, Ty nic nie musisz. Cormorant Garamond i Inter są na licencji SIL Open Font License 1.1 — wolno je hostować u siebie.
- Pobieram pliki `.woff2` (te same kroje i grubości co dziś), zapisuję w `public/fonts/`.
- Dodaję `@font-face` w stylach, usuwam odwołania do Google Fonts z nagłówka strony.
- Dokładam plik licencji i wzmiankę w polityce prywatności, że kroje są serwowane z naszego serwera (żadne dane nie idą do Google).
- Sprawdzam wygląd strony głównej i aplikacji przed i po zmianie.

## 4. Zasady usuwania i retencji — do potwierdzenia

Najpierw ustalamy zasady, potem opisujemy je w dokumentach. Proponuję:

| Dane | Zasada |
|---|---|
| Konto i profil | Usunięcie na żądanie z aplikacji — natychmiast i nieodwracalnie |
| Psy, wpisy, zdjęcia, których jesteś głównym właścicielem | Usuwane razem z kontem |
| Psy udostępnione Ci przez kogoś innego | Zostają u właściciela; znika tylko Twój dostęp |
| Zalecenia behawiorysty w cudzym dzienniku | Zostają przy wpisie właściciela (to jego dokumentacja) |
| Pojedynczy wpis usunięty w aplikacji | Znika od razu, bez kosza |
| Konto nieużywane | Bez automatycznego kasowania; ewentualnie przypomnienie mailem po 24 miesiącach bezczynności |
| Kopie zapasowe bazy | Usunięte dane znikają z kopii wraz z ich rotacją — okres do potwierdzenia u Lovable |
| Logi techniczne | Okres do potwierdzenia u Lovable |
| Rejestr akceptacji regulaminu | Przechowywany przez okres obowiązywania umowy + 3 lata (dowód zawarcia umowy) |

Dwie pozycje („kopie zapasowe", „logi") wpisuję do dokumentów dopiero po odpowiedzi Lovable — do tego czasu nie zmyślam liczb.

UI: opcja „Usuń konto" już jest w profilu i działa zgodnie z powyższą tabelą. Dołożę do niej jasny opis skutków (co znika, co zostaje) i potwierdzenie wpisaniem słowa „USUWAM".

## 5. Rejestr akceptacji regulaminu

Bez checkboxa, zapis rzeczywistej czynności:
- Zapisuję wersję dokumentu, datę, sposób akceptacji (rejestracja e-mailem / Google / Apple) — to już działa w profilu.
- Dokładam archiwum wersji: każdy dokument trafia do repozytorium w wersjonowanym pliku, a strona `/regulamin` dostaje listę „Poprzednie wersje" z datami.
- Przy zmianie regulaminu użytkownik po zalogowaniu zobaczy jednorazową informację o nowej wersji i zapis akceptacji się odnowi.

## 6. Wiek i status użytkownika

- Usługa dla osób pełnoletnich (18+) — zapis w regulaminie, informacja przy rejestracji.
- Regulamin obejmuje konsumentów i firmy: osobne sekcje o odstąpieniu i reklamacjach dla konsumentów (i przedsiębiorców na prawach konsumenta) oraz zasady dla pozostałych. Rola w aplikacji (właściciel / behawiorysta) nie przesądza statusu.

## 7. DPA na planie Pro — czego potrzebujesz

Tego nie ustalę z poziomu aplikacji. Lovable publicznie wiąże DPA z planami Business/Enterprise, a Ty jesteś na Pro. Do wyjaśnienia bezpośrednio z Lovable (support / legal), pytania do wysłania:
1. Czy na planie Pro obowiązuje umowa powierzenia (DPA) obejmująca dane użytkowników aplikacji zbudowanej w Lovable Cloud, czy tylko dane związane z budowaniem aplikacji? Jeśli tak — jak ją zawrzeć/podpisać.
2. Kto jest podprocesorem bazy i storage (Supabase? AWS?) i gdzie fizycznie leżą dane poza wskazanym eu-west-1.
3. Czy występują transfery poza EOG (wsparcie techniczne, logi, monitoring) i na jakiej podstawie (SCC?).
4. Okres retencji kopii zapasowych bazy oraz logów dostępu, i czas usunięcia danych z kopii po skasowaniu konta.
5. Kto po stronie Lovable/podprocesora ma techniczny dostęp do treści bazy i jak jest to kontrolowane.

Materiały: DPA Lovable (https://lovable.dev/data-processing-agreement), lista podprocesorów (https://lovable.dev/subprocessors).

Do czasu odpowiedzi polityka prywatności mówi wprost: dostawca infrastruktury przetwarza dane w naszym imieniu, dane w UE (Irlandia), szczegóły powierzenia w trakcie ustaleń — bez deklaracji, których nie umiemy poprzeć.

## Zakres zmian technicznych

- `src/lib/legal.ts` — adres e-mail, wiek 18+, tabela retencji jako źródło treści, lista wersji dokumentów.
- `src/routes/regulamin.tsx`, `src/routes/prywatnosc.tsx` — sekcje: retencja i usuwanie, konsument/firma, 18+, fonty lokalne, archiwum wersji.
- Nowa strona kontaktowa `/kontakt` z pełnymi danymi operatora; skrócona stopka w `src/components/site-footer.tsx`.
- `public/fonts/*` + `@font-face` w `src/styles.css`, usunięcie linków Google Fonts z `src/routes/__root.tsx`, plik licencji OFL.
- `src/routes/_authenticated/profil.tsx` — rozbudowany opis i potwierdzenie przy usuwaniu konta.
- `src/lib/auth.tsx` — ponowny zapis akceptacji po zmianie wersji regulaminu.
- Bez zmian w bazie poza ewentualnym drobnym wykorzystaniem istniejących kolumn `terms_*`.

## Czekam na potwierdzenie

- Zasady retencji z tabeli w punkcie 4 (zwłaszcza: brak automatycznego kasowania nieużywanych kont).
- Czy wysyłasz do Lovable pytania z punktu 7, czy mam je przygotować jako gotową wiadomość do skopiowania.
