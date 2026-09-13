# Uodpornienie automatycznego użycia kodu zaproszenia

Link `/auth?code=...` już działa — kod jest używany automatycznie po zalogowaniu lub rejestracji. Ta zmiana usuwa dwa drobne ryzyka w tym mechanizmie.

## Co poprawiamy

1. **Zabezpieczenie przed podwójnym użyciem kodu.** Dziś po udanym użyciu kodu strona może przez chwilę wywołać użycie jeszcze raz, zanim przeniesie użytkownika dalej — grozi to mylącym komunikatem o błędzie tuż po sukcesie. Dodajemy prostą blokadę: kod jest używany dokładnie raz na wejście na stronę.

2. **Kod zapamiętany na czas wizyty.** Jeśli ktoś otworzy link z kodem, ale zamknie kartę lub przejdzie gdzieś indziej przed zalogowaniem, kod dziś przepada. Zapamiętamy go w przeglądarce (tylko na czas otwartej karty), żeby po powrocie na stronę logowania nadal został użyty automatycznie. Po użyciu kod jest usuwany z pamięci.

## Modal „Osoby z dostępem” — nowa hierarchia

Widok psa: przyciski „Dodaj współwłaściciela” i „Dodaj behawiorystę” otwierają ten sam modal. Wewnątrz modalu informacje podzielone są na trzy sekcje:

↪ **Współwłaściciel**
↪↪ Stan wyjściowy: „nie ma współwłaściciela” + przycisk „+ współwłaściciel”. Po kliknięciu przycisku pojawia się sekcja z linkiem, wyjaśnieniem i kodem.
↪ **Behawiorysta**
↪↪ Stan wyjściowy: „nie ma behawiorysty” + przycisk „+ behawiorysta”. Po kliknięciu przycisku pojawia się sekcja z linkiem do zaproszenia behawiorysty itd.
↪ **Osoby z dostępem** — bez zmian.

Tagi/label informujące, który kod jest dla kogo, powinny być większe i bardziej rzucające się w oczy. Przyciski generujące zaproszenia dla współwłaściciela i behawiorysty są powiązane z odpowiednimi sekcjami i kodami.

## Szczegóły techniczne

- `src/routes/auth.tsx`:
  - `useRef` (np. `redeemedRef`) pilnujący, że `redeem.mutate` odpala się raz, nawet gdy efekt uruchomi się ponownie.
  - Przy odczycie `code` z adresu — zapis do `sessionStorage` pod kluczem `psiennik-invite-code`; gdy adres nie ma kodu, odczyt z `sessionStorage` jako rezerwa.
  - Po sukcesie lub błędzie użycia — czyszczenie klucza z `sessionStorage`.
- Bez zmian w bazie danych i pozostałych stronach.

## Weryfikacja

Test w przeglądarce: wejście na `/auth?code=...` z nieistniejącym kodem pokazuje jeden komunikat o błędzie (nie dwa), a strona logowania nadal działa normalnie bez kodu.
