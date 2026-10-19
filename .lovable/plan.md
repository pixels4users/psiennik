# Modal kawy: trzy przyciski z kwotami

Zamiast jednego „Postaw kawę” modal pokaże układ jak w oryginalnym widżecie BuyCoffee.

## Co zobaczy użytkownik
- Nagłówek i tekst bez zmian.
- Etykieta „Postaw kawę za:”.
- Trzy kafelki obok siebie (na telefonie też w rzędzie, mniejsze): ikona kawy + kwota
  - 9 zł → `https://buycoffee.to/psiennik?coffeeSize=small`
  - 16 zł → `...?coffeeSize=medium`
  - 25 zł → `...?coffeeSize=large`
- Pod spodem „Może później” bez zmian.

## Zachowanie
- Kliknięcie dowolnej kwoty: otwiera BuyCoffee w nowej karcie, wycisza modal na 60 dni, zamyka modal.
- „Może później”, krzyżyk, Escape: wyciszenie 30 dni (bez zmian).
- Podgląd w Ustawieniach działa jak dotąd.

## Szczegóły techniczne
- Tylko `src/components/coffee-prompt-dialog.tsx`; kafelki jako linki `<a target="_blank">` stylowane tokenami (karta, obramowanie, zielona ikona), z `aria-label` np. „Postaw kawę za 9 zł”.
- Ikony z lucide (`Coffee`, `CupSoda`) — różne dla każdej kwoty.
- Bez zmian w bazie i logice wyświetlania.
