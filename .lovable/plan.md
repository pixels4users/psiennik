# Wideo w przykładowym wydarzeniu i promocja dodawania wideo

## 1. Przykładowe wydarzenie „Spokojny spacer” (strona główna)
- Pod opisem wydarzenia, nad zaleceniem behawiorysty, pojawia się podgląd filmu: kadr ze spaceru, okrągły przycisk odtwarzania na środku i czas trwania w rogu (np. „0:32”).
- To podgląd statyczny, jak reszta przykładu: kliknięcie niczego nie odtwarza, więc nie dochodzi żaden film do pobrania.
- Kolejność w karcie: opis → wideo → zalecenie behawiorysty. Widać, że behawiorystka ogląda film i od razu pisze zalecenie.
- Podpis pod kartą zmienia się na: „Wydarzenie, wideo i zalecenie zawsze obok siebie.”

## 2. Promocja dodawania wideo
- Sekcja z trzema funkcjami („Wydarzenia dnia”, „Kalendarz i analiza”, „Behawiorysta w zespole”) dostaje czwartą: **„Zdjęcia i wideo”**, z opisem: „Dodaj do wydarzenia nagranie ze spaceru lub kilka zdjęć. Behawiorysta obejrzy je tam, gdzie pisze zalecenie — bez szukania w WhatsAppie.”
- Na komputerze sekcja ma 4 kolumny (lub siatkę 2×2 na średnich ekranach), na telefonie jedną pod drugą, tak jak teraz.
- Opis funkcji „Wydarzenia dnia” zostaje bez zmian.

## Szczegóły techniczne
- Kadr do podglądu: nowy obraz wygenerowany w stylu obecnych zdjęć (pies na spacerze, poziomy 16:9), zapisany w `src/assets`. Można też użyć któregoś z istniejących zdjęć, jeśli wolisz.
- `src/routes/index.tsx`: blok podglądu w przykładowej karcie (ikony `Play` z lucide, tokeny kolorów, `aspect-video`, `rounded-xl`); nowy element w `FEATURES` z ikoną `Video`; siatka `md:grid-cols-2 lg:grid-cols-4`.
- Bez zmian w aplikacji po zalogowaniu i w bazie. Sprawdzenie zrzutami na komputerze i telefonie (390 px).
