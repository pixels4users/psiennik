# Szczegóły dnia w kalendarzu

## Zakres
- Kliknięcie dowolnego dnia w tygodniowym kalendarzu otworzy szczegóły tej daty bez opuszczania widoku Kalendarz.
- Na komputerze szczegóły pojawią się w panelu wysuwanym z prawej strony; na telefonie panel zajmie cały ekran.
- Nagłówek panelu pokaże pełną datę i liczbę wydarzeń.
- W panelu pojawią się wszystkie wydarzenia z wybranego dnia, wykorzystujące istniejące karty wydarzeń, oceny, opisy i komentarze behawiorysty.
- Pusty dzień pokaże czytelny komunikat o braku wydarzeń.
- Panel będzie można zamknąć przyciskiem, klawiszem Escape i kliknięciem poza nim na komputerze.
- Zmienimy obecną podpowiedź pod kalendarzem, aby opisywała nowe zachowanie.

## Uprawnienia i akcje
- Właściciel zachowa możliwość edycji wydarzenia bezpośrednio z panelu.
- Behawiorysta zachowa możliwość dodawania i edycji komentarza bezpośrednio z panelu.
- Po zapisaniu zmian lista dnia i kalendarz odświeżą się przez istniejący mechanizm danych.

## Szczegóły techniczne
- Bez zmian w bazie danych i adresach stron.
- Wybrana data będzie stanem lokalnym widoku kalendarza.
- Użyjemy istniejących komponentów kart, formularza wydarzenia i komentarza oraz responsywnego panelu modalnego zgodnego z obecnym design systemem.
- Sprawdzimy działanie dla dnia z wieloma wpisami i bez wpisów na komputerze oraz telefonie.
