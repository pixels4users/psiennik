# Ustawienia: potwierdzenie zapisu jako tekst, aktywny przycisk przy zmianach

Zakres: wyłącznie stopka formularza w `src/routes/_authenticated/profil.tsx` (linie 241–249). Bez zmian w bazie, logice zapisu i dirty state.

## Problem

Po zapisie przycisk primary „Zapisano zmiany" pozostaje na ekranie, ale wygaszony (disabled) — przygaszona zieleń słabo kontrastuje i użytkownik może nie zauważyć, że zapis się udał.

## Zmiana

W stopce formularza zamiast jednego przycisku w trzech stanach:

1. **Bez zmian (po zapisie lub świeże wejście)** — brak przycisku. Zamiast niego zwykły tekst potwierdzenia, np.:
   - `<p>` z ikoną `Check` (lucide, kolor `text-foreground` lub success) + „Zapisano zmiany"
   - Bez emoji (zgodnie z docs/design.md) — ikona `Check` z lucide-react.
   - Tekst pokazujemy tylko, gdy `saved === true` (czyli po udanym zapisie w tej sesji); świeże wejście na stronę → stopka pusta.
2. **Zmiany do zapisania (dirty)** — aktywny przycisk primary „Zapisz zmiany" (pełny kontrast, disabled tylko podczas `saving`).
3. **W trakcie zapisu** — przycisk z etykietą „Zapisywanie…" (disabled).

Warunki renderowania:

```text
saving            → przycisk "Zapisywanie…" (disabled)
dirty && !saving  → przycisk "Zapisz zmiany"
!dirty && saved   → tekst "✓ Zapisano zmiany" (Check + p)
!dirty && !saved  → nic (świeże wejście, stopka pusta)
```

Stan `saved` ustawiany po udanym zapisie (istniejący mechanizm bez zmian); `dirty` przywraca przycisk automatycznie, więc tekst znika w momencie pierwszej edycji.

## Niezmienne

- Logika zapisu, walidacja, przełączniki powiadomień, karta „Konto" (Wyloguj) i reszta strony.
- Pozycja stopki: wyrównana do prawej, bez zmian odstępów.

## Weryfikacja

- `bunx tsgo --noEmit`, `bun run test:ui`, build.
- Playwright: świeże Ustawienia → stopka pusta; zmiana pola → przycisk „Zapisz zmiany"; zapis → tekst „Zapisano zmiany" z ikoną (czytelny kontrast); kolejna zmiana → z powrotem przycisk; desktop + mobile bez poziomego scrolla.
