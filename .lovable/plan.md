# Ustawienia: wylogowanie poza Powiadomieniami + „Zapisz" tylko przy zmianach

Zakres: wyłącznie `src/routes/_authenticated/profil.tsx` (front-end, bez zmian w bazie i uprawnieniach).

## 1. „Wyloguj się" — własne miejsce

Obecnie przycisk „Wyloguj się" stoi w stopce formularza ustawień, tuż nad „Zapisz" (linia ~235), czyli wygląda, jakby należał do sekcji Powiadomienia.

Zmiana:
- Usuwamy przycisk z formularza (formularz zostaje z samym „Zapisz", wyrównanym do prawej).
- Dodajemy nową, prostą kartę „Konto" (tytuł sekcji, krótki opis: „Wylogujesz się z Psiennika na tym urządzeniu.") umieszczoną między `OwnerBehavioristsCard` / `BehavioristOwnersCard` a `DeleteAccountCard` — czyli tuż nad sekcją „Usunięcie konta", w kolejności renderowania: `<OwnerBehavioristsCard />` → `<BehavioristOwnersCard />` → `<SignOutCard />` → `<DeleteAccountCard />`.
- Karta zawiera istniejącą logikę `signOut` (cancelQueries → clear → signOut → /auth) przeniesioną z `ProfilePage` do nowego komponentu w tym samym pliku.

## 2. „Zapisz" — disabled bez zmian do zapisania

Zgoda — przycisk powinien być aktywny tylko wtedy, gdy coś faktycznie zmieniono. To standardowy wzorzec (dirty state) i lepiej komunikuje stan niż stale aktywny przycisk.

Zmiana:
- Dodajemy pochodny stan `dirty`: porównuje bieżące wartości formularza (`displayName`, `email`, `notifications`, `kinds`) z wartościami wczytanymi z profilu.
- Przycisk „Zapisz": `disabled={saving || !dirty}`; gdy brak zmian, etykieta zostaje „Zapisz" (bez zmian tekstu).
- Po udanym zapisie `invalidateQueries` odświeża profil → `dirty` wraca do `false`, przycisk gaśnie do kolejnej zmiany. Toast „Ustawienia zapisane" bez zmian.

## Niezmienne
- Układ, treść i kolejność pozostałych kart (Twoje dane, kody zaproszeń, behawioryści/klienci, usunięcie konta).
- Logika zapisu, walidacja e-maila, przełączniki powiadomień — bez zmian.

## Weryfikacja
- `bunx tsgo --noEmit`, `bun run test:ui`, build.
- Playwright: świeże Ustawienia → „Zapisz" nieaktywny; zmiana pola → aktywny; zapis → znów nieaktywny; karta „Konto" nad „Usunięciem konta"; desktop + mobile bez poziomego scrolla.
