# Oceny i zalecenia behawiorysty

## Zakres zmian

- Zmienić nazwy ocen w całej aplikacji:
  - „Dobrze” pozostaje bez zmian,
  - „Tak sobie” → „Wyzwanie”,
  - „Trudne” → „Trudno”.
- Ujednolicić wszystkie teksty widoczne dla użytkownika: zamiast „komentarza behawiorysty” używać wyłącznie „zalecenia” lub „zaleceń”. Obejmuje to przyciski, okna dodawania i edycji, komunikaty, powiadomienia, tabelę, opisy stron i teksty strony głównej.
- Zachować istniejące dane i mechanizm zapisu zaleceń bez zmian w bazie danych.

## Nowa zakładka „Zalecenia”

- Dodać „Zalecenia” do przełącznika widoków psa obok Listy, Kalendarza, Tabeli i Analizy.
- Utworzyć osobny widok pokazujący tylko zalecenia, bez prezentowania wydarzeń; zalecenie może jedynie linkować do powiązanego wydarzenia.
- Każda pozycja pokaże zalecenie wraz z datą i kontekstem wydarzenia, aby właściciel wiedział, czego dotyczy.
- Domyślnie sortować od najnowszego zalecenia; dodać wybór „Najnowsze” / „Najstarsze”.
- Dodać czytelny pusty stan, gdy pies nie ma jeszcze żadnych zaleceń.
- Widok będzie dostępny zarówno właścicielom, jak i behawiorystom mającym dostęp do psa.

## Technicznie

- Nowa chroniona strona `/pies/$id/zalecenia` z własnym tytułem i opisem dla udostępniania.
- Lista skorzysta z już pobieranych wydarzeń i pola zawierającego zalecenie; bez migracji i bez nowych tabel.
- Sortowanie będzie lokalne. Kolejność oprze się na czasie dodania zalecenia, a przy starszych wpisach bez tej daty — na dacie wydarzenia.
- Wewnętrzna nazwa istniejącego pola danych pozostanie bez zmian, aby nie ryzykować utraty danych; zmieni się całe nazewnictwo widoczne w aplikacji.

## Sprawdzenie

- Zweryfikować brak starych określeń w tekstach aplikacji.
- Sprawdzić zakładkę, oba kierunki sortowania i pusty stan.
- Sprawdzić widok na telefonie i komputerze oraz poprawność budowy aplikacji.  
  
  
Używaj istniejących komponentów i styli UI. Jesli tworzysz nowy komponent -> dodaj go do design systemu/biblioteki projektu. 