# Widoczne, jednokrotne animacje Psiennika

## Ustalenie
Animacje są obecne w aktualnym kodzie i działają przy świeżym wejściu na stronę od samej góry. Test przeglądarkowy potwierdził zmianę elementu spoza ekranu z `opacity: 0` i przesunięcia 16 px do pełnej widoczności w 550 ms oraz brak powtórki po ponownym przewinięciu.

Problem dotyczy sposobu wejścia widocznego obecnie w Preview: adres kończy się `#dziennik-w-praktyce`. Po bezpośrednim przeskoku do tej sekcji obecny mechanizm celowo nie ukrywa treści, która jest już w ekranie podczas uruchamiania strony. W efekcie użytkownik może nie zobaczyć żadnego ujawnienia, mimo że kolejne sekcje mają animacje. Sam ruch jest też bardzo subtelny (8–16 px i zanikanie), więc łatwo go przeoczyć.

## Plan zmian
1. **Ujednolicić mechanizm ujawniania strony głównej**
   - Zachować treść widoczną w HTML przed uruchomieniem skryptów i podczas ładowania.
   - Po uruchomieniu strony przygotowywać wyłącznie elementy, które rzeczywiście czekają poniżej ekranu.
   - Dla wejścia przez odnośnik `#dziennik-w-praktyce` uruchomić jedno krótkie ujawnienie sekcji docelowej po zakończeniu przewinięcia, zamiast pomijać je jako „już widoczne”.
   - Zachować zasadę `once`: powrót w górę i ponowne przewinięcie nie odtworzą animacji.

2. **Poprawić czytelność bez zmiany projektu**
   - Pozostawić istniejące tempo i kierunek, ale skorygować próg obserwacji tak, aby wejście zaczynało się w widocznej części ekranu, a nie kończyło przed zauważeniem go przez użytkownika.
   - Zachować sekwencję kolumn i kart na komputerze; na telefonie bloki będą wchodziły osobno bez opóźniającej kolejki.
   - Nie animować rozmiaru ani położenia układu, dzięki czemu nie pojawią się przesunięcia treści.

3. **Zachować krótkie przejścia części zalogowanej**
   - Potwierdzić przejścia dziennika, kalendarza, tabeli, zaleceń i analizy po zmianie zakładki i psa.
   - Klucz animacji pozostanie związany z psem/widokiem, nie z ponownym pobraniem danych, aby odświeżenie nie animowało całej listy ani wykresów.
   - Nie dodawać animacji poszczególnym wpisom ani metryczce psa.

4. **Dostępność i wydajność**
   - Ustawienie ograniczonego ruchu pokaże całą treść natychmiast, również po zmianie preferencji w otwartej stronie.
   - Fokus klawiatury nadal natychmiast ujawni element, aby żaden aktywny odnośnik nie był niewidoczny.
   - Bez animacji ciągłych; dekoracyjne łapy pojawią się tylko raz.

## Odbiór
- Świeża strona od góry: kolejne sekcje ujawniają się podczas przewijania.
- Kliknięcie „Zajrzyj do dziennika” i bezpośrednie wejście z `#dziennik-w-praktyce`: docelowa sekcja ma widoczne, jednorazowe wejście.
- Przewinięcie góra–dół: brak powtórek.
- Telefon 320, 390 i 643 px oraz komputer: brak poziomego przewijania, przesunięć układu i ukrytej treści.
- Ograniczony ruch od startu i po zmianie ustawienia: treść od razu widoczna.
- Dziennik i pięć zakładek: krótkie przejście po nawigacji; zwykłe odświeżenie danych bez ponownej animacji list i wykresów.
- Kontrola konsoli, błędów działania oraz końcowego stanu kompilacji i testów.

## Zakres
Tylko animacje i ich testy. Bez zmian danych, uprawnień, tekstów, układu funkcjonalnego i bez publikacji.
