# Plan lekkich animacji Psiennika

19.09.2026 — plan zaakceptowany przez użytkownika i wdrożony lokalnie na `codex/psiennik-ui-refresh`. Poniżej zachowano uzgodnioną specyfikację. [Wyniki lokalnego sprawdzenia](animacje-odbior.md). Bez push i publikacji.

## Kierunek

Na stronie głównej ruch ma prowadzić wzrok przez historię produktu i nadać psim motywom charakter. W dzienniku ma jedynie ułatwiać zauważenie zmiany. Nagłówki i główne czynności pozostają czytelne od razu, a kolejne dekoracje pojawiają się raz, kiedy użytkownik do nich dociera.

Rekomendowany pierwszy zakres: łapy, trzy elementy sekcji „Codzienność…” i dopracowanie istniejącego pojawiania sekcji; w części operacyjnej tylko krótkie przejścia koloru, pojawienie gotowej treści i spokojniejsze dialogi.

## Co już istnieje

- `Reveal` obsługuje jednokrotne pojawianie sekcji po wejściu w widok: obecnie 550 ms, przesunięcie 24 px, kolejne elementy co 80 ms. Elementy widoczne od początku są pozostawiane widoczne, co chroni początkową treść przed miganiem po uruchomieniu JavaScript.
- „Codzienność…” oraz trzy karty przykładowych dzienników już korzystają z `Reveal`. Propozycja dopracowuje obecną animację, nie dodaje drugiej na te same elementy.
- Łapy przy hero obecnie pojawiają się podczas wczytania strony przez CSS. Dolny trop wchodzi razem z całym blokiem CTA.
- Karty psów mają już uniesienie przy najechaniu i powiększenie zdjęcia; przyciski reagują na kliknięcie, zakładki zmieniają kolor, a Radix animuje dialogi.

## Strona główna

| Miejsce                                  | Proponowany ruch                                                                                                                                                                  | Wyzwalanie i tempo                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Hero — tekst i przyciski                 | Pozostają widoczne. Typografia ma być stabilna po usunięciu zdjęcia.                                                                                                              | Bez opóźnienia wejścia i animowania słów/liter.                                                                                        |
| Ślady łap                                | Łapy pojawiają się po kolei od dołu ku górze, jak trzy pozostawione odciski. Zmiana przezroczystości, ewentualnie bardzo mała zmiana skali 0,98 → 1. Zachowane istniejące obroty. | Raz, gdy trop trafia w widok. 240 ms na łapę, starty co 80 ms. Trop widoczny od początku odgrywa sekwencję raz przy wejściu na stronę. |
| Podgląd dziennika                        | Zdjęcie stanowi spokojne tło; karta wpisu pojawia się z przesunięciem 8 px. Psi pysk na brzegu dołącza krótkim pojawieniem.                                                       | Kiedy blok wchodzi w ekran; karta 550 ms, dekoracja 240 ms. Nie nakładać tego na obecną animację całego rodzica.                       |
| „Codzienność, która układa się w całość” | Nagłówek pojawia się jako całość. Następnie trzy kolumny 01/02/03, każda razem z ikoną, tytułem i opisem. Lekkie uniesienie 16 px.                                                | Raz przy wejściu; 550 ms i odstęp 80 ms. Na telefonie każda kolumna pojawia się dopiero, gdy faktycznie trafia w ekran.                |
| „Każdy pies ma swoją historię”           | Zachować pojawianie trzech kart, zmniejszyć przesunięcie do 8–16 px. Zdjęcia i treść karty wchodzą razem.                                                                         | Raz; 550 ms, odstęp 80 ms tylko między kartami jednocześnie wchodzącymi w widok.                                                       |
| „Przetestowany na spacerach”             | Spokojne pojawienie tekstu i zdjęcia; dekoracyjna łapa dołącza na końcu.                                                                                                          | Raz przy wejściu. Bez przesuwania zdjęcia w innym tempie niż strona.                                                                   |
| Końcowe CTA                              | Treść i przyciski stabilne; animowany wyłącznie trop łap.                                                                                                                         | Sekwencja jak przy hero, uruchomiona po dotarciu do CTA.                                                                               |

Pełen ruch grupy trzech kolumn zamyka się w około 710 ms. To krótki akcent przy odkrywaniu sekcji, bez zatrzymywania przewijania czy oczekiwania na możliwość kliknięcia.

## Psy i szczegóły psa

| Miejsce                                             | Propozycja                                                                                                        | Granica                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Lista podopiecznych                                 | Jednoczesne, delikatne pojawienie gotowej siatki przez 160 ms.                                                    | Bez sekwencji kilkudziesięciu kart. Nie odtwarzać ruchu po odświeżeniu danych w tle.                                 |
| Karty psów                                          | Pozostawić zmianę obramowania i tła; zrezygnować z równoczesnego unoszenia całej karty oraz powiększania zdjęcia. | Czytelna reakcja na najechanie i fokus, stabilny układ.                                                              |
| Zmiana psa                                          | Selektor i kontekst aktualizują się bez animowanego przejścia. Gotowa treść może pojawić się przez 160 ms.        | Nigdy nie pokazywać treści poprzedniego psa pod nagłówkiem nowego; ładowanie danych pozostaje oddzielnym stanem.     |
| Dziennik / kalendarz / tabela / zalecenia / analiza | Łagodna zmiana koloru aktywnego widoku. Ewentualnie krótki fade samej nowej treści.                               | Metryczka, pozycja przewinięcia i fokus pozostają stabilne. Bez animacji całej strony lub przesuwania dużych paneli. |
| Formularze i dialogi                                | Zachować Radix; delikatne pojawienie i skala 0,98 → 1 zamiast obecnego 0,95 → 1. 160–240 ms.                      | Bez animowania każdego pola. Zachowane Escape, pułapka fokusu, blokada przewijania i powrót fokusu.                  |
| Zapis, komentarze, błędy                            | Wykorzystać istniejące potwierdzenia i stany oczekiwania.                                                         | Bez drżenia formularza, pulsowania akcji lub odtwarzania całej listy po zapisie komentarza.                          |
| Tabela i wykresy                                    | Wiersze dostępne od razu; wykresy mają szybko pokazywać wynik.                                                    | Bez sekwencji wierszy, liczników od zera i ponownego „rysowania” wykresów przy każdej zmianie widoku.                |

## Zasady realizacji po akceptacji

- Korzystać z obecnego `motion/react` i współdzielonych `motion-tokens.ts`. Bez nowej biblioteki ani zmian routingu, zapytań, zapisów i uprawnień.
- Uporządkować mieszane czasy CSS i Motion w istniejącym fundamencie tokenów. Plan korzysta z już obecnych 160/240/550 ms, 8/16 px oraz odstępu 80 ms. Nie wpisywać osobnych wartości w każdym komponencie.
- Wyzwalanie przez wejście elementu w widok (`once`), nie śledzenie każdej pozycji przewijania. Cofnięcie scrolla w obrębie tej samej wizyty nie odtwarza sekwencji.
- Dla animowanych elementów warunkowych zachować stabilne klucze, obsługę wejścia i wyjścia przez `AnimatePresence`. Nie otaczać całego routera wrapperem, który opóźnia przejścia.
- Animować głównie przezroczystość i transformacje. Nie animować wysokości dużych formularzy, tabel lub całych list ani nie używać `layout` na rozbudowanych poddrzewach.
- Przy `prefers-reduced-motion`: od razu stan końcowy, bez przesunięć, skalowania i sekwencyjnych opóźnień. Początkowa treść musi być dostępna również przed uruchomieniem JavaScript; bez chwilowego znikania tekstu po hydracji.
- Dekoracje nie przechwytują kliknięć, nie zmieniają układu i pozostają ukryte przed czytnikiem ekranu. Ruch nie może zmieniać kontrastu tekstu w stanie końcowym.

Źródło wzorców: dostarczony `motion-patterns/SKILL.md`. Przykład przejść z Next.js nie jest kopiowany do projektu opartego na TanStack Router; plan używa wyłącznie wzorców odpowiednich do istniejącej aplikacji.

## Kolejność i odbiór

1. Najpierw dopracować łapy oraz „Codzienność…” i obejrzeć tempo na desktopie oraz telefonie. Dopiero ten odbiór ustala charakter ruchu dla reszty strony głównej.
2. Następnie ujednolicić pozostałe sekcje landing page. Nie dodawać kolejnych ruchomych ozdób.
3. Na końcu dopracować część operacyjną i sprawdzić zmianę psa, wszystkie widoki oraz dialogi.

Warunki odbioru: szybkie i wolne przewijanie, powrót w górę, odświeżenie w środku strony, wejście przez kotwicę, klawiatura, ograniczony ruch, ekran 390 px, powolne ładowanie danych i ponowne pobranie w tle. Żaden tekst nie pozostaje niewidoczny; żadna czynność nie czeka na zakończenie efektu. Liczba animowanych kart nie rośnie wraz z długością listy.

Plan nie obejmuje migracji ani zmian danych. Przed wydaniem nadal obowiązuje odbiór lokalny, osobna akceptacja PR, kontrola synchronizacji i podglądu Lovable oraz Publish przez właściciela.
