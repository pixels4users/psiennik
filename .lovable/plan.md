## Jedna sekcja „Konto” w Ustawieniach

- Zamiast osobnych kart „Wyloguj” i „Usunięcie konta” zostaje jedna karta z tytułem „Konto”, bez opisu.
- W karcie są dwa przyciski obok siebie: „Wyloguj się” (z obramowaniem) i „Usuń konto” (czerwony).
- Po kliknięciu „Usuń konto” otwiera się okno z informacjami:
  - Usunięcie konta jest nieodwracalne. Skasujemy: Twój profil i dane logowania; psy, których jesteś głównym właścicielem — razem z wpisami, zaleceniami i zdjęciami; Twoje dostępy do cudzych psów oraz powiązania z behawiorystami.
  - Lista psów, które znikną, i liczba osób, które stracą dostęp (tak jak teraz).
  - Jeśli chcesz zachować dane, pobierz je najpierw przyciskiem „Pobierz moje dane”.
  - Pole do wpisania słowa „usuń” i przyciski „Anuluj” / „Usuń konto” — działają jak dotąd.

### Szczegóły techniczne
- `src/routes/_authenticated/profil.tsx`: połączyć `SignOutCard` i `DeleteAccountCard` w jedną kartę `AccountCard`. Opis i podsumowanie skutków przenieść do `AlertDialogDescription`/treści okna. Logika usuwania bez zmian.
