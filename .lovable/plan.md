# Prostsza nawigacja i porządki w widokach

Zakres: punkty 1, 3 i 4. Punkt 2 (połączenie Dziennika, Kalendarza i Tabeli w jeden widok z przełącznikiem) zostawiamy na później, zgodnie z Twoją sugestią — to większa zmiana i lepiej ją zrobić na wypełnionym dzienniku.

## 1. Widoczne „Psy” w nagłówku

Nagłówek (widoczny na każdej stronie po zalogowaniu):

- Komputer: logo · **Twoje psy** / **Psy pod opieką** (zależnie od roli) · **Zaproś klienta** (tylko behawiorysta) · dzwonek · imię z menu
- Telefon: logo · **Psy** · dzwonek · ikona konta z menu

Aktywna sekcja wyróżniona. W menu konta zostają tylko „Mój profil” i „Wyloguj się” (pozycja „Psy” znika z menu, bo jest już linkiem). Strony prawne i kontakt zostają w stopce. Bez bocznego menu i hamburgera.

## 3. Behawiorysta: najpierw klienci, kod dopiero na życzenie

- Pasek z kodem, licznikiem i przyciskami kopiowania znika z góry strony „Psy pod opieką”.
- Zostaje jeden wyraźny przycisk **Zaproś klienta** — kod i kopiowanie pokazują się dopiero w oknie zaproszenia.
- Licznik aktywnych procesów zostaje, ale jako jedna dyskretna linijka tekstu pod nagłówkiem.
- Pusty stan: jeden zestaw działań (Zaproś klienta + Dołącz kodem), bez powtórzenia tych samych przycisków w nagłówku.
- Pełny kod z kopiowaniem pozostaje dostępny w profilu.

## Ekran psa: kto się nim opiekuje

Dla właściciela: jeśli pies ma przypisanego behawiorystę, zamiast przycisku „Dodaj behawiorystę” pokazujemy informację **Behawiorysta: [imię]** (imię lub e-mail z profilu). Gdy behawiorysty brak — przycisk jak dotąd.

## 4. Drobne poprawki

- **Ostatnie wydarzenia** na liście psów: kliknięcie otwiera dziennik psa i przewija do klikniętego wpisu, na chwilę go podświetlając (adres z parametrem wskazującym wpis).
- **Aktywne / Oczekujące / Zakończone**: dopisujemy jedno zdanie wyjaśniające, że chodzi o etap współpracy z behawiorystą, a nie o stan psa. Nazwy zakładek dla właściciela doprecyzujemy tak, by było jasne, czego dotyczą.
- **Powiadomienia e-mail w profilu**: przełącznik z podpisem „Wysyłkę wiadomości uruchomimy w kolejnym kroku” chowamy do czasu uruchomienia powiadomień. Ustawienie w bazie zostaje nietknięte.

## Technicznie

- `src/components/app-header.tsx`: link do `/psy` z `activeProps`, przycisk „Zaproś klienta” dla behawiorysty otwierający istniejący `InviteClientDialog`, skrócone menu konta, wersja mobilna bez etykiet tekstowych poza „Psy”.
- `src/routes/_authenticated/psy.tsx`: usunięcie `BehavioristCodeBar` z góry, uproszczony pusty stan, licznik procesów jako tekst; karty ostatnich wydarzeń linkują do `/pies/$id?wpis=<id>`.
- `src/routes/_authenticated/pies.$id.index.tsx`: odczyt `wpis` z adresu (`validateSearch`), przewinięcie i podświetlenie karty; informacja o behawiorystze z `useDogAccess` (rola `behaviorist`, `profile.display_name`).
- `src/routes/_authenticated/profil.tsx`: ukrycie bloku powiadomień (kod zostaje, tylko niewyświetlany).
- Bez zmian w bazie, uprawnieniach i logice zaproszeń.

## Ryzyka

Zmiany są w warstwie prezentacji. Jedyne miejsce wymagające uwagi to parametr adresu na stronie dziennika — dodajemy go jako opcjonalny, więc dotychczasowe linki działają bez zmian.
