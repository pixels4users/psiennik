# Dzienniczek behawioralny psa

Aplikacja dla właścicieli psów i behawiorystów. Właściciel prowadzi dziennik wydarzeń psa, behawiorysta dodaje komentarze i zalecenia.

Na razie **bez logowania** — rolę wybiera się na wejściu. Struktura danych jest jednak od razu przygotowana pod konta (etap 2), żeby nic nie trzeba było przepisywać.

## Dane (Lovable Cloud)

**`dogs`** — pies jako osobny rekord
- `id`, `name`, `birth_year` (lub wiek), `breed`, `sex` (suka/pies), `photo_url` (opcjonalne zdjęcie), `created_at`
- `owner_id` — puste na razie, gotowe pod konta

**`entries`** — wydarzenia
- `id`, `dog_id` → dogs
- `date`, `title`, `activity_type` (spacer, trening, socjalizacja, goście/wizyta, wypoczynek, inne)
- `time_of_day` — rano / południe / wieczór
- `description` — brak zachowań problemowych albo opis sytuacji
- `rating` — zielony / pomarańczowy / czerwony
- `behaviorist_comment` — komentarz i zalecenia behawiorystki
- `created_at`

Bez logowania: odczyt i zapis publiczny (kto zna adres, ten korzysta). Przy wprowadzaniu kont dokładamy reguły dostępu i tabelę zaproszeń.

## Flow i ekrany

### Wejście — wybór roli (`/`)
Prosty ekran: „Jestem właścicielem" | „Jestem behawiorystą". Wybór zapamiętany w przeglądarce, można go zmienić w nagłówku. To tymczasowa atrapa logowania — docelowo zastąpi ją ekran konta.

### Widok właściciela
1. **Lista psów** (`/psy`) — karty psów ze zdjęciem + „Dodaj psa". Gdy pusto: stan pusty (szkielety) i duże „Dodaj psa".
2. **Dodawanie psa** — formularz: imię, wiek, rasa, płeć, zdjęcie (opcjonalne, wgrywanie pliku). Po zapisie wchodzimy w profil psa.
3. **Profil psa** — zakładki **Lista** i **Kalendarz**:
   - **Lista** (`/pies/$id`): wydarzenia pogrupowane po dacie (nagłówek dnia), pod nim karty wydarzeń z kolorowym tagiem. Edycja wpisu na karcie. Przycisk „Dodaj wydarzenie" (modal: data, typ aktywności, tytuł, opis, tag). Komentarz behawiorystki widoczny na karcie, ale **tylko do odczytu**.
   - **Kalendarz** (`/pies/$id/kalendarz`): widok tygodniowy od września 2026, każdy dzień pokolorowany według najgorszego tagu dnia, nawigacja tydzień w przód/tył. Nad kalendarzem sekcja analiz (poniżej).

### Widok behawiorysty
- **Lista psów** (`/psy`) — te same psy (docelowo tylko te, do których został zaproszony). Bez „Dodaj psa".
- **Profil psa** — te same zakładki Lista | Kalendarz, ale: brak edycji i dodawania wydarzeń; na każdej karcie przycisk „Dodaj komentarz" / „Edytuj komentarz" — jedyne pole, które behawiorysta zmienia.

### Sekcja analiz (nad kalendarzem)
- Rozkład kolorów w tygodniu i ogółem (pasek + procenty).
- Statystyka według typu aktywności (np. „spacery: 80% zielonych").
- Najczęstsze słowa kluczowe z opisów sytuacji problemowych.

## Przygotowanie pod konta (etap 2, nie teraz)
- `dogs.owner_id` już w schemacie.
- Rola trzymana w jednym miejscu w kodzie (prosty hook), żeby podmiana na prawdziwą sesję była jednym krokiem.
- Struktura ekranów (lista psów → profil psa) jest już taka, jak przy kontach — dochodzi tylko logowanie i zapraszanie behawiorysty do konkretnego psa.

## Technicznie
- Lovable Cloud: jedna migracja z dwiema tabelami + storage na zdjęcia psów, bez auth.
- TanStack Start, trasy: `/` (wybór roli), `/psy`, `/pies/$id`, `/pies/$id/kalendarz`.
- shadcn: Dialog, Datepicker, Badge, Card, Tabs, Skeleton.
- Interfejs po polsku, czytelny i prosty; metadane head() na każdej stronie.

## Czego teraz NIE robimy
- Logowanie, konta, zaproszenia (etap 2).
- Eksport CSV, powiadomienia.
