# Wybór roli przy rejestracji

## Co jest dziś

Logika ról istnieje w bazie i działa, ale ekran rejestracji jej nie używa:

- Przy zakładaniu konta wysyłamy tylko imię — baza w takiej sytuacji zawsze zapisuje rolę „właściciel".
- Rola „behawiorysta" nadawana jest wyłącznie wtedy, gdy przy rejestracji przekażemy tę informację; wtedy też automatycznie powstaje stały kod zapraszający dla klientów (`BEH-…`).
- Na stronie głównej przycisk „Jestem behawiorystą" prowadzi do zwykłej rejestracji, więc taka osoba i tak zakłada konto właściciela.
- Aplikacja obecnie „domyśla się" roli po tym, czy ktoś ma przypisanego psa jako behawiorysta. Dlatego świeżo zarejestrowany behawiorysta wygląda jak właściciel i nie ma swojego kodu dla klientów.

Dane: 7 kont, z czego tylko 1 ma rolę behawiorysty (konto demo).

## Co proponuję zrobić

1. **Wybór roli na ekranie rejestracji** — dwa pola wyboru: „Jestem właścicielem psa" / „Jestem behawiorystą", domyślnie właściciel. Wybór trafia do konta i na jego podstawie baza zapisuje rolę oraz tworzy kod dla klientów.
2. **Ścieżka ze strony głównej** — przycisk „Jestem behawiorystą" otwiera rejestrację z już zaznaczoną rolą behawiorysty.
3. **Rola po zalogowaniu czytana z konta, nie zgadywana** — ekrany, które dziś rozpoznają behawiorystę po posiadaniu psa pod opieką, zaczną czytać zapisaną rolę. Dzięki temu behawiorysta bez żadnego psa od razu widzi swój panel i swój kod dla klientów.
4. **Konta już istniejące** — nic się im nie zmienia; osoby, które są behawiorystami, a mają konto właściciela, poprawimy ręcznie na Twoją prośbę (mogę dodać też prostą zmianę roli w profilu, jeśli chcesz — daj znać).

## Szczegóły techniczne

- `src/routes/auth.tsx`: `signUp` przekazuje `options.data.role = "owner" | "behaviorist"`; trigger `private.handle_new_user` już to obsługuje (`user_roles` + `behaviorist_links`). Stan roli sterowany także parametrem wyszukiwania (`?rola=behaviorist`) w `validateSearch`.
- `src/routes/index.tsx`: link „Jestem behawiorystą" → `/auth` z `search: { rola: "behaviorist" }`.
- `src/lib/access.ts`: `useIsBehaviorist` czyta `user_roles` (rola konta) zamiast liczyć wiersze `dog_access`; zachowujemy fallback dla starych kont bez wiersza w `user_roles`.
- Logowanie Google/Apple: rola z parametru przekazywana tak samo przez metadane przy pierwszym logowaniu; jeśli brak — domyślnie właściciel.
- Bez zmian w politykach RLS i w cyklu współpracy.
