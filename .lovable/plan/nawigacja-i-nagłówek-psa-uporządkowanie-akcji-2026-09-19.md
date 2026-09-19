# Nawigacja i nagłówek psa — uporządkowanie akcji

## Kierunek

Wdrażamy wybrany wariant **„Refined header layout”**, dopasowany do obecnego stylu Psiennika. Zachowujemy lekkie, otwarte tło i łapkę — nie przywracamy ciężkiego kafla ani dodatkowych ozdobników z makiety.

## 1. Górna nawigacja

- Dla właściciela usuwamy mały przycisk „+” spomiędzy imion psów.
- Dodajemy normalny przycisk **„Dodaj psa +”** po prawej stronie nawigacji, przed dzwonkiem; otwiera ten sam formularz co obecnie.
- Na wąskim ekranie dodawanie psa pozostaje w menu „Psy”, żeby nagłówek się nie przepełniał.
- Ikona użytkownika i imię stają się zwykłą, statyczną informacją: bez linku, podświetlenia, tła aktywnego i reakcji na kliknięcie.
- „Ustawienia” pozostają jedynym wejściem do profilu, a „Wyloguj” osobnym przyciskiem.
- Zachowujemy obecne zachowanie behawiorysty — bez przycisku „Dodaj psa”.

## 2. Nagłówek strony psa

Na desktopie układamy jedną czytelną linię:

```text
[zdjęcie] [imię + rasa/wiek/płeć] [opieka i dostęp] [Dodaj wydarzenie]
```

- Zdjęcie, imię, dane psa, edycja psa i łapka pozostają.
- **„Behawiorysta: imię”** staje się wyłącznie informacją — bez strzałki, efektu przycisku i bez otwierania okna.
- W tej samej sekcji pokazujemy współwłaściciela, jeśli istnieje.
- Zamiast dwóch akcji otwierających to samo okno zostaje jedna czytelna akcja **„Zarządzaj dostępem”**; gdy brakuje behawiorysty lub współwłaściciela, okno nadal pozwoli ich zaprosić.
- **„Dodaj wydarzenie”** pozostaje głównym przyciskiem i zachowuje dotychczasowe uprawnienia — widzą go tylko osoby mogące edytować wpisy.
- Behawiorysta nadal widzi link „Wszystkie psy”, ale nie dostaje działań właściciela.

Na telefonie elementy układają się kolejno:

1. zdjęcie + imię i dane psa,
2. behawiorysta, współwłaściciel i „Zarządzaj dostępem”,
3. pełnej szerokości „Dodaj wydarzenie”.

Długie imiona i nazwy osób będą mogły się łamać lub skracać bez wypychania przycisków poza ekran.

## 3. Zakładki psa

- Usuwamy separator pod zakładkami Dziennik / Kalendarz / Tabela / Zalecenia / Analiza.
- Zachowujemy obecny aktywny zielony stan, ikony, przewijanie poziome na telefonie i wszystkie adresy widoków.

## Zakres i bezpieczeństwo

- Zmiany dotyczą wyłącznie wyglądu i rozmieszczenia istniejących elementów w górnej nawigacji i nagłówku psa.
- Nie zmieniamy danych, bazy, ról, uprawnień, okien zarządzania dostępem ani działania formularzy.
- Sprawdzimy właściciela i behawiorystę, stany z/bez behawiorysty i współwłaściciela, długie nazwy oraz szerokości 320–390 px i desktop.
- Zweryfikujemy, że formularze otwierają się raz, fokus wraca poprawnie, strona nie ma poziomego przewijania, a „Ustawienia” nie podświetlają już tożsamości użytkownika.
