# Galeria przykładowych dzienników psów na stronie głównej

Dodanie do strony głównej sekcji pokazującej, jak Psiennik wygląda dla różnych psów. Wszystkie cztery przesłane fotografie zostaną zachowane w `src/assets/` jako zasoby CDN o uporządkowanych nazwach `dog-profile-1`–`dog-profile-4`.

## Zakres

### 1. Zdjęcia

- Wgrać wszystkie cztery załączniki do CDN i zapisać wskaźniki:
  - `dog-profile-1.jpg.asset.json` — dorosły pies oparty o poduszkę,
  - `dog-profile-2.jpg.asset.json` — czarny szczeniak,
  - `dog-profile-3.jpg.asset.json` — czarny pies na kanapie,
  - `dog-profile-4.jpg.asset.json` — york pod stolikiem.
- Wszystkie cztery pliki pozostaną w katalogu `src/assets/`, także jeśli sekcja wykorzysta tylko wybrane fotografie.

### 2. Nowa sekcja na stronie głównej

- Umieścić sekcję między social proof a kartami funkcji.
- Dodać krótki nagłówek i opis przedstawiający realny sposób używania dziennika.
- Pokazać trzy wybrane psy w czytelnych, responsywnych kafelkach przypominających widok dziennika: zdjęcie, imię, krótki opis ostatniego wydarzenia, pora dnia i kolorystyczna ocena.
- Użyć obecnego systemu kolorów, typografii i komponentów; bez zmiany działania właściwego dziennika.
- Na telefonie kafelki ustawić pionowo, a od większych ekranów w trzech kolumnach.

### 3. Kontrola

- Sprawdzić poprawne ładowanie zdjęć, brak przepełnień tekstu oraz wygląd na komputerze i telefonie.
- Potwierdzić poprawny build i brak błędów w podglądzie.  
  
4. Nowa sekcja ma być stworzona jako rozbudowanie istniejącego design systemu. Nie twórz "jednorazowego" UI.
  &nbsp;