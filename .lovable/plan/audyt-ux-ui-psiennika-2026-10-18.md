# Audyt UX/UI Psiennika

Tylko audyt: bez zmian w kodzie, bazie i bez publikacji. Wynik to raport z listą problemów i rekomendacjami do osobnej akceptacji.

## Metoda (wg dwóch przesłanych instrukcji)
1. **Przegląd kodu wg Web Interface Guidelines** (pobrane świeże zasady Vercel): dostępność, fokus, formularze, przyciski vs linki, stany ładowania/błędów, teksty, obrazy, animacje. Wynik w formacie `plik:linia — problem`.
2. **Walidacja wizualna na zrzutach ekranu** (zasada: „nie działa, dopóki zrzut nie pokaże, że działa”): desktop 1280, tablet 768, telefon 390 i 320.

## Zakres ekranów
- Publiczne: strona główna, lista poradników, wpis poradnika, logowanie/rejestracja, kontakt, prywatność, regulamin.
- Właściciel (konto demo): Twoje psy (0/1/wiele), strona psa i 5 widoków (Dziennik, Kalendarz, Tabela, Analiza, Zalecenia), szczegóły wydarzenia z galerią i dużym podglądem, dodawanie/edycja wydarzenia (pliki, linki, limity), komentarze, Ustawienia (powiadomienia, miejsce na pliki, konto), dzwonek powiadomień, dialogi (pies, kod zaproszenia, dostęp).
- Behawiorysta (konto demo): gabinet, statusy współpracy, zakończ/wznów, zalecenia, tryb tylko do odczytu.

## Kryteria
- Spójność z `docs/design.md`: przyciski owalne, pola 48 px, promienie kart, hierarchia przycisków (primary/tertiary), typografia Cormorant/Inter, paleta.
- Kontrast (WCAG AA), widoczny fokus, nazwy dla przycisków z ikoną, obsługa klawiatury i Escape w dialogach, ograniczony ruch.
- Teksty: spójne nazewnictwo („wydarzenie”, „film/wideo”, „Zapisz”), komunikaty błędów i pustych stanów.
- Telefon: brak poziomego przewijania, zawijanie długich nazw, dostępność „Dodaj wydarzenie”, galeria na małym ekranie.
- Stany: ładowanie, puste, błąd, brak dostępu, przekroczony limit miejsca.

## Wynik
Tabela: **Ekran | Problem | Waga (krytyczny/ważny/drobny) | Dowód (zrzut lub plik:linia) | Rekomendacja**, plus krótkie top 5 rzeczy do poprawy. Zrzuty i raport w pliku `docs/ui-refresh/audyt-2026-10-18.md`. Dane testowe (jeśli powstaną) usuwane po audycie.

## Szczegóły techniczne
- Playwright (Python) w `/tmp/browser/audit`, sesja konta demo przez mintowanie sesji; zrzuty elementów zamiast pełnych stron.
- Automatyczny skan dostępności (axe-core wstrzyknięty przez Playwright) na każdym ekranie.
- Przegląd plików: `entry-form.tsx`, `entry-card.tsx`, `entry-video.tsx`, `app-header.tsx`, `dog-nav.tsx`, `profil.tsx`, `psy.tsx`, trasy `pies.$id.*`, `index.tsx`, `auth.tsx`.
