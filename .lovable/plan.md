# Dzienniczek behawioralny Lucy

Prosta aplikacja dla 3 osób (właściciele + behawiorystka) do zapisywania dni psa Lucy. Bez logowania — jeden wspólny adres strony.

## Dane (Lovable Cloud — wspólna baza, żeby wszyscy widzieli te same wpisy)

Tabela `entries` (jeden wiersz = jedno wydarzenie):
- `date` — data wydarzenia
- `title` — typ/nazwa aktywności (np. "Spacer z Kokosem", "Ćwiczenie z miską")
- `activity_type` — kategoria z listy (spacer, trening/ćwiczenie, socjalizacja, wizyta/goście, wypoczynek, inne) — do analiz
- `description` — opis: brak zachowań problemowych albo opis sytuacji problemowej
- `rating` — tag: zielony (dobrze) / pomarańczowy (tak sobie) / czerwony (trudny dzień)
- `behaviorist_comment` — komentarz/zalecenia behawiorystki (osobne pole, edytowane po utworzeniu wpisu)
- `created_at`

Baza bez logowania: publiczny zapis/odczyt (każdy, kto zna adres, może edytować — wystarczające przy prywatnym użyciu).

## Ekrany

### 1. Lista (strona główna `/`)
- Wpisy pogrupowane po dacie (nagłówek dnia), pod spodem karty wydarzeń: godz./typ, opis, kolorowy tag.
- Edycja wpisu z poziomu karty (ikona ołówka, ten sam formularz co dodawanie).
- Przycisk „Dodaj wydarzenie" otwiera formularz: data (datepicker), typ aktywności, tytuł, opis, tag kolorowy.
- Komentarz behawiorystki: osobny przycisk/pole na karcie — można dodać lub edytować już po powstaniu wpisu; wizualnie wyróżniony (np. jasne tło, podpis „Behawiorystka").

### 2. Kalendarz (`/kalendarz`)
- Widok tygodniowy (od września 2026), nawigacja tydzień w tył/w przód.
- Każdy dzień kolorowany według „najgorszego" tagu dnia (czerwony > pomarańczowy > zielony); kliknięcie dnia przewija/filtruje do listy wpisów tego dnia.
- Nad kalendarzem sekcja „Analiza" (dla wybranego tygodnia i ogółem):
  - podział dni/wydarzeń: ile zielonych, pomarańczowych, czerwonych (pasek/procenty),
  - statystyka wg typu aktywności (np. „spacery: 80% na zielono"),
  - najczęstsze słowa kluczowe w opisach sytuacji problemowych (prosta lista słów z liczbą wystąpień).

## Technicznie
- Lovable Cloud (baza) — jedna tabela, jedna migracja, bez auth.
- TanStack Start: `/` (lista + modal dodawania), `/kalendarz` (kalendarz + analiza), wspólny nagłówek z przełączaniem widoków.
- Komponenty shadcn: Dialog (formularz), Calendar/Datepicker, Badge (tagi), Card.
- Prosty, czytelny styl; polskie teksty interfejsu.
- head() metadata po polsku na obu stronach.

## Czego NIE robimy (świadomie)
- Logowanie, konta, role.
- Zdjęcia, pliki, eksport CSV (można dodać później).
