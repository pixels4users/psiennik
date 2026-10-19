## Ustawienia w trzech zakładkach

Strona Ustawienia dostaje u góry zakładki. Wybrana zakładka zapisuje się w adresie, więc można do niej linkować (np. prosto do „Dostępy”).

### 1. Profil i dane (domyślna)
- Nazwa wyświetlana (z „Zapisz zmiany” jak dziś)
- Miejsce na pliki
- Połącz swój Psiennik z ChatGPT
- Twoje dane (Pobierz moje dane)
- Konto (Wyloguj się | Usuń konto + okno z ostrzeżeniem)

### 2. Dostępy
- Dla każdego psa krótka karta: zdjęcie i imię psa, a pod spodem:
  - Współwłaściciel — imię albo „Brak”
  - Behawiorysta — imię i status współpracy (aktywna / zakończona) albo „Brak”
- Przycisk „Zarządzaj dostępem” otwiera to samo okno „Osoby z dostępem”, które jest na stronie psa (zapraszanie, kody, odbieranie dostępu) — nic nie budujemy od nowa.
- Kod behawiorysty (dla kont behawiorystów) przenosi się tutaj.
- Stare karty „Twoi behawioryści” / „Twoi klienci” znikają — ich rolę przejmuje lista psów.
- Gdy brak psów: krótka informacja i przycisk „Dodaj psa”.

### 3. Powiadomienia
- Adres do powiadomień
- Przełącznik główny e-mail i przełączniki rodzajów (jak dziś), z własnym „Zapisz zmiany”.

Na telefonie zakładki mieszczą się w jednym rzędzie (krótkie nazwy).

### Szczegóły techniczne
- `src/routes/_authenticated/profil.tsx`: `validateSearch` z `tab: "profil" | "dostepy" | "powiadomienia"`; `Tabs` z shadcn sterowane przez search param (`navigate({ search, replace: true })`).
- Obecny formularz rozdzielony na dwa: nazwa (zakładka 1) i adres + przełączniki (zakładka 3), każdy z własnym stanem „niezapisanych zmian”; ten sam zapis do `profiles`.
- Nowy `DogAccessOverview`: `useDogs()` + dla każdego psa `useDogAccess(dog.id)` (współwłaściciel = `role='owner'` inny niż właściciel, behawiorysta = `role='behaviorist'` z `process_status`), przycisk otwiera istniejący `AccessDialog` z `src/components/invite-dialog.tsx`.
- Usunięcie `OwnerBehavioristsCard`, `BehavioristOwnersCard` i powiązanych wierszy z `profil.tsx`; hooki w `access.ts` zostają (używane gdzie indziej lub bez szkody).
- Bez zmian w bazie i uprawnieniach.
- Weryfikacja: typy, build, Playwright desktop + mobile na koncie testowym (przełączanie zakładek, otwarcie okna dostępu, zapis w obu formularzach).
