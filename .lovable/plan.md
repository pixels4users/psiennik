# Spójne karty wydarzeń i ikony aktywności

## Cel
Ujednolicić wygląd wydarzeń w aplikacji z atrakcyjniejszymi kartami ze strony głównej oraz ożywić stronę „Twoje psy” i „Psy pod opieką” ostatnimi wpisami.

## Ikony typów aktywności
Dodamy jeden centralny zestaw ikon Lucide, używany konsekwentnie w aplikacji:

- **Spacer** — PawPrint
- **Trening / ćwiczenie** — Footprints
- **Socjalizacja** — Dog
- **Goście / wizyta** — CakeSlice
- **Wypoczynek** — Umbrella
- **Podróż** — CarFront
- **Jedzenie** — Bone
- **Czystość** — Sparkles
- **Inne** — Shapes

Ikony pojawią się:
- na kartach wydarzeń w dzienniku i szczegółach dnia w kalendarzu,
- przy opcjach typu aktywności w formularzu dodawania i edycji,
- na kartach „Ostatnie wydarzenia”,
- na przykładowych kartach dziennika na stronie głównej.

Przy wydarzeniu z kilkoma typami pokażemy wszystkie wybrane typy jako czytelne zestawy ikona + nazwa. W tabeli i na wykresach pozostawimy sam tekst, aby nie zwiększać wizualnego zagęszczenia.

## Spójność kart wydarzeń
Karty w aplikacji przejmą najważniejsze elementy wizualne kart ze strony głównej:
- ikonę aktywności w jasnym, okrągłym polu,
- wyraźny tytuł wydarzenia,
- porę dnia z ikoną zegara,
- opis,
- ocenę z kolorową kropką,
- istniejące zalecenie oraz akcje edycji bez zmiany ich działania.

Przykładowe karty na stronie głównej będą korzystać z tego samego centralnego przypisania ikon, dzięki czemu nie rozjadą się ponownie z właściwą aplikacją.

## Ostatnie wydarzenia nad listą psów
Na stronie `/psy` pokażemy **3 najnowsze wydarzenia** zarówno właścicielowi, jak i behawioryście, nad listą psów.

Każdy wpis pokaże:
- zdjęcie psa, a gdy go nie ma — istniejący placeholder z łapą,
- imię psa i datę,
- tytuł wydarzenia,
- wszystkie typy aktywności z ikonami,
- ocenę.

Kliknięcie karty przeniesie do dziennika właściwego psa. Sekcja nie pojawi się, jeśli użytkownik nie ma jeszcze żadnych wydarzeń. Pobieranie ostatnich wpisów zostanie rozszerzone o zdjęcie psa, z zachowaniem obecnych zasad dostępu.

## Weryfikacja
- Sprawdzimy karty z jednym i kilkoma typami aktywności.
- Sprawdzimy formularz, dziennik, panel dnia w kalendarzu oraz stronę główną.
- Sprawdzimy ostatnie wydarzenia dla właściciela i behawiorysty, ze zdjęciem i bez zdjęcia.
- Sprawdzimy układ na komputerze i telefonie oraz poprawność budowy aplikacji.
