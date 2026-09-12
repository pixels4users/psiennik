# Kalendarz ocen i nowy widok Analiza

## Kalendarz
- Usuniemy z Kalendarza kartę „Aktywności” oraz trzy obecne karty analityczne, aby na tym ekranie pozostał sam kalendarz tygodniowy.
- Każdy dzień pokaże zawsze trzy kropki w stałej kolejności: zieloną, pomarańczową i czerwoną.
- Wielkość i widoczność kropki pokaże liczbę ocen: brak — mała i przygaszona, 1 — średnia, 2 lub więcej — duża. Dokładne liczby znajdą się w opisie dostępnym dla czytników ekranu i po najechaniu kursorem.
- Zrezygnujemy z obecnego kolorowania całego kafelka według najtrudniejszej oceny; dzięki temu mieszany dzień będzie czytelniejszy i nie będzie wyglądał wyłącznie na czerwony.
- Kliknięcie dnia nadal otworzy istniejący panel ze wszystkimi wydarzeniami.

## Nowy widok „Analiza”
- Dodamy czwartą zakładkę „Analiza” obok Listy, Kalendarza i Tabeli oraz osobny adres psa `/pies/$id/analiza`.
- Przeniesiemy tam karty „Ten tydzień”, „Bilans ogólny” i „Powtarzające się tematy”. Karta „Aktywności” nie zostanie przeniesiona.
- Pod podsumowaniami dodamy trzy czytelne, responsywne wykresy:
  1. **Wydarzenia na dzień** — liczba wszystkich wydarzeń dla kolejnych dat.
  2. **Bilans ocen tygodniowo** — skumulowane słupki zielonych, pomarańczowych i czerwonych ocen dla kolejnych tygodni.
  3. **Aktywności według pory dnia** — dla każdego typu aktywności porównanie wpisów rano, w południe i wieczorem.
- Puste zbiory danych otrzymają prosty komunikat zamiast pustego wykresu.
- Wykresy użyją obecnych kolorów ocen i pozostałych kolorów systemu strony; bez zmian w danych i bazie.

## Szczegóły techniczne i weryfikacja
- Użyjemy dostępnego już mechanizmu wykresów i tych samych pobranych wpisów, więc nie dojdą nowe zależności ani zapytania.
- Nowa strona otrzyma własny tytuł i opis udostępniania.
- Sprawdzimy kalendarz i wszystkie wykresy na komputerze oraz telefonie, w tym dni mieszane, dni puste i brak historii.
