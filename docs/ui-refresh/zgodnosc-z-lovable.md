# Zgodność z Lovable bez nowej migracji — 19.09.2026

Aktualny odbiór po usunięciu warunku opisanego w [pierwszym audycie przed wysyłką](kontrola-przed-wysylka.md). Kontrola Git i builda zakończona o 12:59 CEST.

**Wynik: lokalny pakiet nie wymaga nowej funkcji ani migracji Supabase. Build i testy opisane poniżej przechodzą. Kod pozostaje na lokalnej gałęzi do akceptacji przed PR i merge.**

## Zmiana

- Profil właściciela i behawiorysty pobiera nazwy z istniejącej tabeli `profiles`: `id`, `display_name`, `email`, filtrowane identyfikatorami istniejących relacji. To ta sama ścieżka i reguły widoczności, z których korzysta strona psa.
- Usunięto wywołanie `get_collaboration_profiles()`, jego typ, niewdrożoną migrację, obsługę tego RPC w podglądzie oraz nieaktualny test migracji.
- `supabase/` i `src/integrations/supabase/types.ts` są identyczne z bazowym `origin/main`; brak nowych plików w Supabase.
- Formularz „Wpisz kod zaproszenia” nadal wywołuje istniejące `redeem_dog_invite`. Zachowano obsługę obu rodzajów kodów i odświeżanie list po ich użyciu.
- Prawidłowy pusty odczyt profilu nie powoduje błędu listy współpracy. Jeśli dotychczasowe uprawnienia nie udostępniają jeszcze nazwy, pozostaje etykieta „Behawiorysta” i rzeczywisty status relacji. Błąd zapytania nadal daje możliwość ponowienia.

Ograniczenie istniejącego modelu: połączenie samym kodem, bez wspólnego psa, może nie udostępniać nazwy drugiej osoby. Ten refresh zachowuje taką regułę. Nie przypisuje fikcyjnego imienia ani nie zmienia uprawnień.

## Ponowne sprawdzenie

Instalację i build wykonano na osobnej kopii źródeł, bez wcześniejszego `node_modules` i bez kopiowania `.env`. Użyto zastępczych wartości builda z domeną `.invalid`. Testy interfejsu wykonano w osobnym podglądzie na portach 4179/4180, którego API nie obsługuje usuniętej funkcji. Dotychczasowy podgląd 4174/4175 i jego dane pozostały zachowane.

| Sprawdzenie | Wynik |
| --- | --- |
| `bun install --frozen-lockfile`, Bun 1.3.6 | PASS, `bun.lock` bez zmian |
| `bun run build` | PASS: klient, SSR, Nitro `cloudflare-module` |
| `tsc --noEmit` | PASS |
| `bun run test:ui` | 6/6 PASS |
| ESLint wszystkich 31 zmienionych lub nowych plików TS/TSX | 0 błędów, 2 istniejące ostrzeżenia Fast Refresh w Button i RatingBadge |
| Profil właściciela przed powiązaniem | Działa, przycisk wpisania kodu jest dostępny |
| Kod behawiorysty, małe litery i spacje | Połączenie działa; profil pokazuje nazwę z danych przy wspólnym psie |
| Profil behawiorysty | Lista klientów pokazuje nazwę właściciela; kod i link behawiorysty pozostają dostępne |
| Kod psa wpisany przez behawiorystę | Otwiera właściwy dziennik psa |
| Zmiana nazwy behawiorysty w jego profilu | Po ponownym wejściu właściciela nowa nazwa jest widoczna na stronie psa i w profilu; brak hardkodowania |
| Powiązanie bez wspólnego psa | Współpraca pozostaje widoczna z etykietą „Behawiorysta”; brak błędu listy |
| Końcowy odczyt błędów konsoli | Brak błędów |
| Usunięte RPC, lokalne adresy API, konta/tokeny testowe i klucz administracyjny w wynikowym kliencie | Brak trafień w sprawdzonych wzorcach |
| `git diff --check` i nałożenie kompletnego patcha na aktualny `origin/main` w osobnym indeksie | PASS |

Po ponownym `git fetch origin --prune`: `HEAD` i `origin/main` nadal wskazują `01f73b6c7b97fc1ab342042fc6fb26502467530a`. SHA-256 sprawdzonego patcha implementacji: `4e16751dcea9ac07220ac2989228b408aaa52e78c2eb64d527d7334173bbfa37`.

Testy przeglądarkowe korzystają z lokalnych danych i symulowanych reguł widoczności. Nie potwierdzają produkcyjnych polityk, logowania ani zaproszeń na rzeczywistych kontach. Ograniczenia odbioru Workera, obrazy obsługiwane przez Lovable oraz istniejący na `main` błąd hydratacji pozostają opisane w pierwszym audycie; w tej korekcie nie zmieniano ich implementacji.

## Przekazanie do Lovable

1. Wspólny odbiór lokalnego pakietu i akceptacja wysyłki.
2. Ponowny fetch, kompletny commit oraz PR do `main`; ewentualne konflikty rozwiązywane lokalnie. W commicie uwzględnić nowe pliki kodu i dokumentacji, bez prywatnych katalogów `docs/plany/` i `Zasoby i instrukcje/`.
3. Po akceptacji PR: merge, kontrola śledzonej gałęzi i commita w Lovable oraz odbiór podglądu na właściwym backendzie. Sprawdzić nazwy obu ról, kody, zdjęcia, zapis danych i logowanie. Lovable ma pobrać gotową implementację.
4. Publish wykonuje właściciel projektu po odbiorze. Dla tego pakietu nie ma nowej migracji do zastosowania.

Nie wykonano commita, push, PR, merge, publikacji ani operacji na zdalnej bazie.
