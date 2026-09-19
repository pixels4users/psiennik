# Animacje — odbiór lokalny, 19.09.2026

Na podstawie obrazu i stanów odczytanych w przeglądarce: zaakceptowane animacje są wdrożone lokalnie. Układ i kolory pozostają zgodne z wcześniejszym refreshem. Gałąź: `codex/psiennik-ui-refresh`; bez commita, push, PR, publikacji Lovable i migracji.

## Potwierdzone scenariusze

| Scenariusz                          | Wynik                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Łapy przy hero                      | Uchwycono pierwszy odcisk w trakcie pojawiania, gdy dwa kolejne jeszcze czekały. Docelowo trzy odciski; zachowane obroty.                                                                                                                                                    |
| „Codzienność…” — desktop 1280 × 900 | Uchwycono kolejne etapy trzech kolumn (przezroczystość 0,955 / 0,868 / 0,651). Po animacji wszystkie mają 1 i brak transformacji.                                                                                                                                            |
| Ponowny scroll w górę i w dół       | Kolumny pozostały widoczne, nie odtworzyły wejścia.                                                                                                                                                                                                                          |
| Mobile 390 × 844                    | Brak przewijania strony w poziomie. Przy granicy ekranu pierwszy blok był widoczny, drugi wchodził, trzeci poniżej ekranu nadal czekał.                                                                                                                                      |
| Podgląd i końcowe CTA               | Zdjęcie oraz tekst CTA pozostają stabilne. Dolny trop pojawia się po dotarciu do sekcji.                                                                                                                                                                                     |
| HTML przed uruchomieniem JS         | Nagłówek i 13 kontenerów `Reveal` są w HTML serwera. Żaden kontener treści nie otrzymuje ukrywającego stylu w SSR.                                                                                                                                                           |
| Ograniczony ruch                    | Izolowana emulacja `matchMedia` i reguł CSS na rzeczywistych komponentach: od startu oraz po zmianie preferencji w otwartej stronie. Treść i łapy od razu widoczne, transformacje wyłączone, opóźnienia 0. Dialog bez widocznej animacji. Tymczasowy ekran testowy usunięty. |
| Właściciel                          | Dziennik, kalendarz, tabela, zalecenia i analiza otwierają się. Gotowy panel ma przejście 160 ms; metryczka nie ma animacji.                                                                                                                                                 |
| Zmiana Humus → Lunka                | Pozostał widok analizy; selektor i metryczka pokazują Lunkę, podsumowanie pokazuje jej pusty dziennik.                                                                                                                                                                       |
| Behawiorysta                        | Aktywne / oczekujące / zakończone pokazują odpowiednio 6 / 1 / 1 psów. Jedno przejście siatki 160 ms, karty bez transformacji.                                                                                                                                               |
| Dialog psa                          | 240 ms wejścia i skala 0,98. Shift+Tab / Tab utrzymują fokus wewnątrz, Escape zamyka i odblokowuje scroll. Po poprawce klawiaturowe otwarcie i zamknięcie przywraca fokus do „Edytuj psa”.                                                                                   |

## Poprawka znaleziona podczas testów

Natywne `autoFocus` pól wyprzedzało obsługę fokusu Radix. Usunięto je z trzech formularzy dialogowych i dodano powrót do wcześniej skupionego elementu we wspólnym `DialogContent`, z zachowaniem nadpisanych handlerów. Pierwsze pole nadal otrzymuje fokus przez Radix. Ta zmiana dotyczy obsługi klawiaturą, nie zapisu formularzy.

## Granice sprawdzenia

Przeglądarka lokalna i dane przykładowe w pamięci. Emulacja ograniczonego ruchu nie jest testem ustawień systemowych na fizycznym telefonie. W tej iteracji nie powtarzano testów rzeczywistych uploadów, zaproszeń, RLS ani opóźnionej sieci. Kod zapytań, autoryzacji, uprawnień i bazy pozostaje bez zmian. Brak powtórek przy refetch wynika ze stabilnych kluczy i użycia `isLoading`, a nie `isFetching`; nie wykonywano osobnej symulacji refetch.

## Materiały

- [Sekcja na desktopie](screenshots/animations-desktop.png)
- [Sekcja na telefonie](screenshots/animations-mobile.png)
- [Siatka behawiorysty](screenshots/animations-behaviorist.png)

Sprawdzenia końcowe: build produkcyjny i TypeScript przeszły; 6/6 istniejących testów selektora psa przeszło; ESLint zmienionych plików: 0 błędów, jedno wcześniejsze ostrzeżenie `react-refresh/only-export-components` w `button.tsx`; `git diff --check` bez błędów.

Podczas zmieniania wspólnej sesji w kilku otwartych kartach wystąpiły komunikaty hydracji nagłówka i strony logowania. Po zakończeniu sesji testowych i czystym odświeżeniu publicznej strony głównej nie pojawiły się nowe błędy konsoli. Nie zmieniano mechanizmu autoryzacji w ramach animacji.
