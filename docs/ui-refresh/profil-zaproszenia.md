# Profil i kody zaproszeń — odbiór lokalny 19.09.2026

Na podstawie obrazu i stanów w przeglądarce: właściciel i behawiorysta mają widoczne „Wpisz kod zaproszenia” w profilu oraz w menu konta. W profilu właściciela nazwa behawiorysty pochodzi z danych, a długa nazwa zawija się w szerokości 390 px. Po ponownej kontroli zgodności usunięto zależność od nowej funkcji Supabase. Bieżący pakiet nie wymaga migracji; [aktualny odbiór](zgodnosc-z-lovable.md).

## Zmiany

- `ProfilePage` i `AppHeader` otwierają wspólny `JoinDialog`, bez uzależnienia tej opcji od posiadania psa lub roli behawiorysty. Kod do udostępniania i jego link pozostają w profilu behawiorysty.
- Ze szczegółów konkretnego psa usunięto „Dołącz kodem”. Dodatkowe przyciski na liście psów używają wspólnej nazwy „Wpisz kod zaproszenia”.
- Formularz korzysta z istniejącego `redeem_dog_invite`. Przyjmuje wklejony kod ze spacjami, zamienia małe litery na wielkie, blokuje pusty formularz i ponowną wysyłkę podczas sprawdzania. Błąd jest powiązany z polem przez `aria-describedby`, `aria-invalid` i `role="alert"`.
- Kod psa prowadzi do jego dziennika. Kod behawiorysty pozostawia użytkownika w profilu i odświeża listę współpracy. Anulowanie usuwa kod i błąd. Zamknięcie oddaje fokus do przycisku w profilu albo do menu konta.
- Lista „Twoi behawioryści” pokazuje nazwę z `profiles.display_name`, z istniejącym fallbackiem do e-maila. Sam status współpracy i operacje na niej pozostają bez zmian. Błąd pobierania listy ma przycisk ponowienia.

## Odczyt nazw bez migracji

Repozytorium definiuje odczyt `profiles` dla własnego konta lub osoby ze wspólnym psem (`private.shares_dog`). Profil korzysta teraz z tego samego odczytu co strona psa: wybiera `id`, `display_name`, `email` dla identyfikatorów zapisanych w istniejących relacjach `owner_behaviorists`. Błąd samego zapytania daje możliwość ponowienia, a prawidłowy pusty wynik nie przerywa wyświetlania współpracy.

Kod behawiorysty może połączyć konta jeszcze przed wspólnym psem. Jeżeli obecne reguły nie udostępniają wtedy nazwy, UI pokazuje „Behawiorysta” i status współpracy. Nie zgaduje imienia i nie rozszerza uprawnień. Po udostępnieniu psa odczyt może zwrócić nazwę.

Wcześniejszą, niewdrożoną migrację `20260919113000_collaboration_profile_names.sql`, jej typ RPC, obsługę w podglądzie i nieaktualny test SQL usunięto z lokalnego pakietu. Pliki Supabase są zgodne z `origin/main`. Nie wykonywano operacji na zdalnej bazie. Testy odbioru nie stanowią potwierdzenia aktualnego stanu produkcyjnych polityk.

## Wyniki

| Przypadek | Wynik |
| --- | --- |
| Właściciel: wejście z menu oraz profilu | PASS |
| Behawiorysta: wejście z menu oraz profilu, własny kod i link nadal widoczne | PASS |
| Poprawny kod behawiorysty wpisany małymi literami i ze spacjami | PASS w lokalnym API: po zamknięciu formularza pojawia się nazwa współpracy |
| Kod psa dla obu ról | PASS w lokalnym API: przejście do właściwego psa |
| Nieistniejący i wykorzystany kod | PASS: komunikat przy polu, formularz pozostaje otwarty |
| Anulowanie, ponowne otwarcie, Escape, fokus | PASS: brak starego kodu/błędu; powrót do właściwego przycisku |
| Konto bez wspólnego dostępu do psa z behawiorystą | PASS po korekcie: brak dostępu do nazwy nie powoduje błędu listy; widoczna etykieta „Behawiorysta” i aktywna współpraca |
| Długa nazwa zmieniona w lokalnych danych | PASS: nowa nazwa widoczna, brak poziomego przewijania przy 390 px; po teście przywrócono poprzednią nazwę |
| Kontrast komunikatu błędu / tła | 5,65:1; zwykły tekst / tło 16,44:1; szczegóły w `profile-contrast.json` |
| `npm run build`, TypeScript, lint dotkniętych komponentów i hooków | PASS |
| Końcowy profil w konsoli przeglądarki | Brak błędów |
| Brak nowej funkcji bazy w środowisku testowym | PASS po korekcie: właściciel i behawiorysta korzystają z list, a kod behawiorysty i kod psa nadal działają |

Przeglądarka: szerokości 969 i 390 px, kontrolki w istniejącej palecie i typografii. Widoczny fokus i komunikat błędu sprawdzono na obrazie. Nie jest to pełny audyt WCAG ani test fizycznej klawiatury ekranowej. Testy zaproszeń w UI używają danych w pamięci; nie potwierdzają wszystkich reguł, limitów i wyścigów istniejącego zdalnego `redeem_dog_invite`.

## Materiały

- [Profil właściciela](screenshots/profile-owner-desktop.png)
- [Profil behawiorysty](screenshots/profile-behaviorist-desktop.png), [telefon](screenshots/profile-behaviorist-mobile.png)
- [Błąd kodu i fokus na telefonie](screenshots/profile-invite-error-mobile.png)
- [Długa nazwa na telefonie](screenshots/profile-owner-long-name-mobile.png)

Powtórzony odbiór obu ról, dynamicznej zmiany nazwy oraz czystego builda opisuje [raport zgodności z Lovable](zgodnosc-z-lovable.md).

Gałąź `codex/psiennik-ui-refresh`. Bez commita, push, PR, synchronizacji Lovable, Publish i operacji na zdalnej bazie. Istniejące lokalne dane zachowano przy restarcie podglądu.
