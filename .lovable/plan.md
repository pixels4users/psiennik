# Nowa strona główna Psiennika — split-screen i podział grup docelowych

Przebudowa landing page'u `/` w nowoczesny układ typu care.com: białe tło, głęboka ciemna zieleń na tekstach i głównych przyciskach, wyraźny podział na właścicieli i behawiorystów.

## Zakres zmian

### 1. Przygotowanie zdjęć (assets)
- Wgrać dwa obrazy z `/mnt/user-uploads/` do CDN przez `lovable-assets` i zapisać wskaźniki w `src/assets/`:
  - `couple-enjoying-time-with-border-collie-dogs-outsi-2026-01-09-01-18-14-utc.jpg` jako zdjęcie Hero.
  - `IMG_2827.jpg` jako awatar w pasku social proof.
- Usunąć oryginalne pliki z repo po utworzeniu wskaźników `.asset.json`.

### 2. Nagłówek (`src/components/app-header.tsx`)
- Z lewej: logo tekstowe "Psiennik" (bez zmian).
- Z prawej: przycisk "Zaloguj się" — wypełniony kolorem `primary` (ciemna zieleń), biały tekst, `rounded-md`, rozmiar `sm`.
- Dla zalogowanego użytkownika pozostawiaj obecny układ menu.

### 3. Hero Section (`src/routes/index.tsx`)
- Układ siatki `grid-cols-1 lg:grid-cols-2` z dużą ilością paddingu i odstępów.
- **Lewa strona (tekst i akcja):**
  - `h1`: "Dziennik behawioralny psa, który prowadzi się sam" — font display, kolor `primary`, duży rozmiar (np. `text-4xl md:text-5xl lg:text-6xl`).
  - Paragraf: szary `text-muted-foreground`, `text-lg`, `max-w-lg`.
  - Grupa dwóch przycisków:
    - "Jestem właścicielem" — `variant="default"`, `size="lg"`, prowadzi do `/auth`.
    - "Jestem behawiorystą" — `variant="outline"`, `size="lg"`, ciemnozielona ramka i tekst (`border-primary text-primary`), prowadzi do `/auth`.
  - Na mobile przyciski układają się jeden pod drugim (`flex-col sm:flex-row`).
- **Prawa strona (obraz):**
  - Zdjęcie Hero z CDN, `object-cover`, `rounded-2xl`, `shadow-xl`, pełna wysokość sekcji, proporcjonalne wymiary.

### 4. Pasek Social Proof
- Pełna szerokość ekranu, tło `bg-muted` lub `bg-slate-50`.
- Wyśrodkowany tekst: "Aplikacja przetestowana na prawdziwych spacerach i brudnych łapach."
- Obok tekstu okrągły awatar `w-12 h-12 rounded-full object-cover` ze zdjęcia `IMG_2827.jpg`.

### 5. Sekcja Features
- Tło sekcji: białe lub bardzo jasnoszare (`bg-background` / `bg-slate-50`).
- 3 karty w rzędzie (`grid-cols-1 md:grid-cols-3`), duże odstępy (`gap-6` lub `gap-8`).
- Każda karta: `bg-slate-50`, `border`, `rounded-xl`, `p-6`.
- Ikony Lucide: `PawPrint`, `CalendarRange`, `MessageSquareText` — kolor `primary`.
- Nagłówki kart w stylu display, opisy w `text-muted-foreground`.

### 6. Responsywność i oddech
- Duże paddingi między sekcjami (`py-16 lg:py-24`).
- Kontener `max-w-6xl` lub `max-w-7xl` dla Hero, features w `max-w-5xl` lub `max-w-6xl`.
- Zastosować `md:` i `lg:` do podziału i rozmiarów.

### 7. Weryfikacja
- `bunx tsc --noEmit` — brak błędów typów.
- Build OK w logach.
- Podgląd desktop i mobile (Playwright lub ręcznie) — sprawdzenie:
  - podziału 50/50 na desktopie,
  - pionowego układu na mobile,
  - poprawnego ładowania obu zdjęć,
  - działania przycisków CTA.

## Pliki do edycji
- `src/routes/index.tsx` — nowy układ strony głównej.
- `src/components/app-header.tsx` — styl przycisku logowania.
- Nowe: `src/assets/hero.jpg.asset.json`, `src/assets/avatar.jpg.asset.json`.

## Czego NIE robimy
- Nie zmieniamy logiki autentykacji ani strony `/auth`.
- Nie dodajemy nowych tras.
- Nie zmieniamy palety kolorów w `src/styles.css` — używamy istniejących tokenów.
