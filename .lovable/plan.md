# Nowe typy wydarzeń: Podróż, Jedzenie, Czystość

## Cel
Dodać trzy nowe typy aktywności do dziennika wydarzeń psa, aby właściciel mógł lepiej kategoryzować codzienne sytuacje behawioralne.

## Zmiany

### Lista nowych typów
- **Podróż** — wartość `podroz`
- **Jedzenie** — wartość `jedzenie`
- **Czystość** — wartość `czystosc` (krótsza forma od „Nauka czystości")

### Miejsca, które się automatycznie zaktualizują
Nowe typy wystarczy dodać do centralnej stałej `ACTIVITY_TYPES` w `src/lib/dogs.ts`. Dzięki temu od razu pojawią się w:
- formularzu dodawania / edycji wydarzenia,
- filtrze tabeli wydarzeń,
- wyświetlaniu karty wydarzenia,
- statystykach w widoku „Analiza" (zachowują się identycznie jak spacer, socjalizacja itd.).

### Czego NIE robimy
- Nie dodajemy ikon — karty nadal pokazują tylko nazwę typu.
- Nie zmieniamy schematu bazy danych — kolumna `activity_type` to zwykły tekst.
- Nie wprowadzamy osobnej logiki dla nowych typów w analizach.

## Weryfikacja
- `bunx tsc --noEmit` — sprawdzenie typów.
- Podgląd formularza i tabeli, czy nowe typy są dostępne do wyboru.
