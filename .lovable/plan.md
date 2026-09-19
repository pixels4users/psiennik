# Nawigacja górna: psy po imieniu, Ustawienia, prostszy awatar

## Moja ocena Twojej koncepcji

**Opcja 1 (imiona psów w nagłówku) — rekomendowana.** Pasuje do realnego użycia: właściciel ma 1–2 psy i chce jednym kliknięciem wejść do właściwego dziennika. Jest też zgodna z tym, co już robimy (właściciel z psami i tak jest przekierowywany z listy prosto do psa).

**Opcja 2 (Dziennik / Zalecenia / Analiza w górnej nawigacji) — odradzam.** Zalecenia i Analiza zawsze dotyczą konkretnego psa, więc górne zakładki musiałyby domyślać się, „o którym psie mówimy". Przy dwóch psach to źródło pomyłek: klikasz „Analiza" i nie wiesz, czyja. Poza tym te same zakładki już są na stronie psa — powstałyby dwa poziomy tej samej nawigacji.

Twoje spostrzeżenie, że **Lista / Kalendarz / Tabela to tylko sposoby patrzenia na te same dane**, jest trafne — ale to zmiana wewnątrz strony psa i lepiej zrobić ją osobno, na wypełnionym dzienniku (to był odłożony punkt 2 z wcześniejszego planu). Tu jej nie ruszam.

**Ustawienia i uproszczony awatar — tak, zgadzam się w całości.** Trzy pozycje nie zasługują na rozwijane menu, a etykieta „Behawiorysta / Właściciel" faktycznie nic użytkownikowi nie mówi.

## Co zrobimy

### Nagłówek — właściciel
Zamiast jednego linku „Twoje psy":

- 1–3 psy: imiona jako osobne linki, np. `Luna` · `Hummus`. Aktywny pies wyróżniony.
- 4 i więcej psów: jeden przycisk „Psy" rozwijający listę imion (żeby nagłówek się nie rozjechał).
- Telefon: zawsze jeden przycisk „Psy" z listą imion.
- Na końcu listy pozycja „Wszystkie psy" prowadząca na dotychczasową stronę listy.

### Nagłówek — behawiorysta
Bez zmian w paradygmacie: zostaje „Psy pod opieką" (klient może mieć kilkunastu podopiecznych, imiona nie mają sensu) plus „Zaproś klienta".

### Ustawienia
- Nowa pozycja w nagłówku: **Ustawienia** → prowadzi na dotychczasową stronę profilu (`/profil`), dla obu ról.
- Nagłówek strony zmienia się z „Mój profil" na „Ustawienia".
- Adres `/profil` zostaje taki sam — żadne linki i zakładki nie przestaną działać.

### Awatar zamiast rozwijanego menu
Po prawej: `[ikona] [Imię]` (link do Ustawień) + `Wyloguj`. Rozwijane menu konta znika.
Pozycja „Wpisz kod zaproszenia" przenosi się z menu na stronę Ustawień (tam już istnieje jej odpowiednik) oraz zostaje na stronie listy psów, gdzie jest dziś.

### Etykieta roli
Napis „Behawiorysta / Właściciel" w menu konta znika razem z menu. W Ustawieniach pokażemy ją wyłącznie w środowisku roboczym (podgląd/dev), na psiennik.pl nie będzie widoczna.

## Nakład pracy i ryzyko

- **Praca:** mała–średnia. Realnie jeden plik nagłówka (`src/components/app-header.tsx`), drobna zmiana tytułu w `src/routes/_authenticated/profil.tsx` i przeniesienie okna „Wpisz kod zaproszenia".
- **Skomplikowanie:** niskie. Nie ruszamy bazy, uprawnień, tras ani logiki psów — imiona bierzemy z zapytania, które nagłówek i tak może wykonać.
- **Ryzyko:** niskie, ograniczone do warstwy prezentacji. Największe uwagi: (1) nagłówek zacznie pobierać listę psów, więc trzeba obsłużyć stan ładowania i brak psów bez migotania; (2) długie imiona i telefon 320 px — przycinanie tekstu; (3) fokus klawiatury po zamknięciu okna zaproszenia, które przenosimy.
- **Nie ruszamy:** przekierowania właściciela z `/psy` na psa, zakładek na stronie psa, ról, RLS, zaproszeń.

## Technicznie

- `src/components/app-header.tsx`: `useDogs()` + `useIsBehaviorist()`; dla właściciela render imion (`<Link to="/pies/$id" params>` z `activeProps`) albo `DropdownMenu` przy ≥4 psach i na mobile; usunięcie `DropdownMenu` konta na rzecz `Link` do `/profil` i przycisku wylogowania; `JoinDialog` usuwany z nagłówka.
- `src/routes/_authenticated/profil.tsx`: tytuł i `head()` → „Ustawienia"; dodanie karty/pozycji „Wpisz kod zaproszenia” (`JoinDialog`) dla obu ról; etykieta roli za warunkiem `import.meta.env.DEV` lub hosta podglądu.
- Bez zmian w `routeTree`, bazie i uprawnieniach.
