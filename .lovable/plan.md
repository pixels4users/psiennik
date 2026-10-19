# Prostsza sekcja „Tak wygląda Wasz dziennik” (strona główna)

## Nowy układ (wszystko wyśrodkowane)

1. Nagłówek: **„Tak wygląda Wasz dziennik”**
2. Podtytuł: **„Problemy, wideo i zalecenia w jednym miejscu”**
3. Przykładowa karta wydarzenia „Spokojny spacer” (Humus, ocena, opis, podgląd wideo, zalecenie behawiorysty), bez znacznika „Przykład”. Karta ma umiarkowaną szerokość, żeby dobrze się czytała.
4. Pod kartą grafika główki psa (ta sama, która teraz stoi w rogu sekcji).

## Co znika

- Zdjęcie pary z border collie po lewej stronie.
- Napis „Za każdym wpisem stoi Wasz wspólny dzień.” Zostaje ukryty w kodzie, więc łatwo go później przywrócić.
- Znacznik „Przykład”.
- Podpis „Wydarzenie, wideo i zalecenie zawsze w jednym miejscu.”, bo tę samą myśl niesie teraz podtytuł.

## Bez zmian

- Link „Zajrzyj do dziennika” w górnej części strony dalej przewija do tej sekcji.
- Pozostałe sekcje strony głównej i aplikacja po zalogowaniu.

## Szczegóły techniczne

- `src/routes/index.tsx`, sekcja `#dziennik-w-praktyce`: usunąć dwukolumnową ramkę i `heroAsset` (import zostaje, jeśli jest używany gdzie indziej, inaczej go usunąć); blok „Za każdym wpisem” zakomentować.
- Nagłówek jako `h2.section-title`, podtytuł jako `text-muted-foreground`, karta w kontenerze `max-w-xl mx-auto text-left`, `DogDoodle` wyśrodkowany pod kartą (`mx-auto w-32`, bez obrotu i pozycjonowania absolutnego).
- Sprawdzenie zrzutami na komputerze i telefonie (390 px).
