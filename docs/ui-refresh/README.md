# Lokalny odbiór UX/UI Psiennika

18.09.2026 · gałąź `codex/psiennik-ui-refresh` · baza `01f73b6` (`origin/main` w chwili rozpoczęcia pracy).

19.09.2026 właściciel projektu zaakceptował wysyłkę pakietu przez PR i merge do `main`. Kolejny etap to sprawdzenie synchronizacji i podglądu Lovable według [checklisty technicznej](checklista-lovable.md); Publish wykonuje właściciel po odbiorze. Raporty poniżej dokumentują wcześniejsze etapy lokalnej weryfikacji.

Po kontroli z 19.09 usunięto zależność profilu od nowej funkcji Supabase. Bieżący pakiet korzysta z istniejących tabel i reguł dostępu; nie zawiera nowych migracji. Nie wykonywano operacji na zdalnej bazie. Prywatne materiały w `docs/plany/` oraz `Zasoby i instrukcje/` pozostają poza pakietem.

## Co obejrzeć

- [Audyt i uzasadnienie zmian](audyt.md)
- [Kierunek wizualny](../design.md) i [zasady utrzymania](../guidelines.md)
- [Strona główna — desktop](screenshots/home-desktop.png), [pełna strona](screenshots/home-full-desktop.png), [telefon](screenshots/home-mobile.png)
- [Dziennik właściciela](screenshots/owner-desktop.png), [telefon](screenshots/owner-mobile.png)
- [Gabinet behawiorysty](screenshots/behaviorist-overview.png), [telefon](screenshots/behaviorist-mobile.png)
- [Formularz psa na telefonie](screenshots/dog-form-mobile.png), [puste konto](screenshots/owner-empty.png)
- [Profil, wpisywanie kodów i nazwy współpracujących osób — 19.09](profil-zaproszenia.md)
- [Zgodność z Lovable bez nowej migracji — aktualny odbiór](zgodnosc-z-lovable.md)

## Uruchomienie

W katalogu repozytorium uruchom `npm run dev:ui-review`, potem otwórz **http://127.0.0.1:4175**. Jeśli podgląd już działa, nie uruchamiaj drugiej kopii. Port 4174 obsługuje lokalne dane, a 4175 aplikację Vite. Serwery słuchają wyłącznie na interfejsie lokalnym.

Korzystaj z zakładki **Logowanie**, wpisując jedno z poniższych kont i hasło `local-review-only` (dowolne niepuste hasło testowe jest akceptowane).

| Konto                          | Scenariusz                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `one@ui.psiennik.test`         | Właściciel jednego psa, wejście od razu do dziennika.                                                    |
| `owner@ui.psiennik.test`       | Właściciel dwóch psów, selektor i pusty dziennik drugiego psa.                                           |
| `empty@ui.psiennik.test`       | Brak psów, dodanie pierwszego psa.                                                                       |
| `behaviorist@ui.psiennik.test` | Osiem psów: sześć aktywnych, jeden oczekujący, jeden zakończony.                                         |
| `readonly@ui.psiennik.test`    | Techniczny scenariusz dotychczasowych reguł odczytu; nie określa docelowej polityki dostępu właściciela. |

Podgląd korzysta z prawdziwych komponentów i klienta Supabase, ale adres API wskazuje serwer z danymi w pamięci. Zapis wydarzenia, komentarza, zalecenia oraz danych psa służy wyłącznie lokalnemu odbiorowi. Zwykły restart usuwa zmiany tych danych; opcjonalny `PSIENNIK_UI_REVIEW_SNAPSHOT` pozwala wczytać wcześniej zachowaną kopię lokalnych danych. Podczas odbioru z 19.09 zachowano istniejące 9 psów i 21 wpisów. Zdjęcia i pozostałe publiczne zasoby nadal mogą być pobierane z psiennik.pl.

Google/Apple, rejestracja, istniejące przyciski „Demo”, przesyłanie zdjęć, wysyłanie zaproszeń, usuwanie i operacje administracyjne nie należą do obsługiwanego zakresu tego podglądu. Od 19.09 serwer symuluje wpisywanie kodów: `BEH-ANNA` łączy z behawiorystą, `PIES01` i `PIES02` otwierają psa odpowiednio ze ścieżki właściciela i behawiorysty. Kody psa są jednorazowe w danym uruchomieniu. Używaj wyłącznie powyższych fikcyjnych kont. Rzeczywisty backend nie jest testowany przez ten skrypt.

## Wyniki weryfikacji

| Obszar             | Wynik i zakres                                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Budowanie          | `npm run build` — PASS. Ostrzeżenie narzędzia o ignorowanym `inlineDynamicImports` przy `codeSplitting`; build kończy się poprawnie.                                                            |
| Typy               | `npx tsc --noEmit` — PASS.                                                                                                                                                                      |
| Testy wyboru psa   | `npm run test:ui` — 6/6 PASS: pierwszy pies, zapamiętany pies, rozdzielenie kont, niedostępny identyfikator, brak psów, niedostępny storage i SSR.                                              |
| Lint zakresu zmian | 0 błędów; 2 ostrzeżenia Fast Refresh dotyczące eksportowanych helperów w Button i RatingBadge. Nie uruchamiano napraw całego repozytorium.                                                      |
| Właściciel         | Logowanie z jednym psem prowadzi do dziennika; selektor zachowuje kalendarz; „Twoje psy” wraca do ostatniego dostępnego psa; puste konto i dodanie pierwszego psa działają na danych lokalnych. |
| Istniejące funkcje | Dodanie i edycja wydarzenia, komentarz oraz zapis zalecenia sprawdzone przez UI z lokalnym zapisem. Tabela, kalendarz, zalecenia i analiza pozostają dostępne.                                  |
| Behawiorysta       | Zachowana lista, statusy, otwieranie dziennika i zalecenia. Zakończona relacja pokazuje tryb odczytu. Nie są to testy RLS.                                                                      |
| Responsywność      | Landing: 320/390/1280 px. Właściciel: 390/1280 px. Behawiorysta: 390/768/1280 px; przy 1280 px cztery karty po 289 px, a przy 768 px dwie kolumny.                                              |
| Klawiatura         | Fokus w dialogu, przejście z pierwszego pola do przycisku zamknięcia przez Shift+Tab, zamknięcie Escape i zwrot fokusu do przycisku wywołującego.                                               |
| Kontrast           | Forest/cream 11,99:1, tekst pomocniczy/cream 6,74:1, tekst pomocniczy/keylime 5,84:1, obramowanie input/cream 3,32:1, sage/forest 8,17:1. Obliczenia z tokenów, nie pełny audyt WCAG.           |
| Konsola            | Brak błędów i ostrzeżeń w końcowym odczycie konsoli przeglądarki strony głównej.                                                                                                                |

Surowe obserwacje: [browser-checks.json](browser-checks.json). Wyniki obejmują również problemy znalezione i następnie poprawione: przycinanie kart na telefonie oraz test Escape odczytany zbyt wcześnie, przed zakończeniem animacji. [Obliczenia kontrastu](contrast.json).

## Co pozostaje do wspólnego odbioru

- Kierunek wizualny i animacje zostały zaakceptowane lokalnie; trzeba jeszcze obejrzeć je w podglądzie Lovable.
- Rzeczywiste konta: właściciel, współwłaściciel, aktywny/oczekujący/zakończony behawiorysta; zaproszenia, uprawnienia oraz regresje na kontrolowanych danych.
- Fizyczny telefon z klawiaturą ekranową, Safari/iOS oraz włączone systemowe ograniczenie ruchu. Obsługa `prefers-reduced-motion` jest w kodzie, ale przełącznika systemowego nie testowano.
- Upload/zmiana/usunięcie zdjęcia i zewnętrzne logowanie pozostają do sprawdzenia z właściwym backendem.
- Po PR i merge do main: kontrola synchronizacji oraz podglądu Lovable, a następnie Publish przez właściciela. Bieżący pakiet nie wymaga nowej migracji Supabase. Nadal trzeba sprawdzić rzeczywiste konta na docelowym backendzie — patrz [aktualny odbiór](zgodnosc-z-lovable.md) i [checklista dla Lovable](checklista-lovable.md).
