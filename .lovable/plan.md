# Poprawki: dodawanie plików, miniatury na liście, galeria

## 1. Formularz wydarzenia — dodawanie plików
- Przycisk „Wybierz zdjęcia lub wideo” zmienia styl z głównego (zielonego) na najlżejszy (tertiary: bez wypełnienia, tekstowy z ikoną).
- Ikona zdjęcia zamieniona na ikonę „upload”.
- Krótszy przebieg: po wybraniu plików (lub upuszczeniu na ramkę) przesyłanie rusza od razu. Każdy plik pokazuje się jako miniatura z paskiem postępu, a po przesłaniu z przyciskiem „Usuń”.
- Znika krok „Prześlij pliki” i komunikat „Kliknij »Prześlij pliki«…”. Gdy przesyłanie jeszcze trwa, „Dodaj wydarzenie” czeka i pokazuje „Przesyłanie plików…”.
- Limity bez zmian: 5 zdjęć, 1 wideo, 20 MB na film, 50 MB na konto. Plik ponad limit jest odrzucany z komunikatem i nie zaczyna się przesyłać.
- Linki bez zmian (osobne „Zapisz link” / „Usuń link”).

## 2. Lista wydarzeń — miniatura
Kolejność wyboru miniatury:
1. Pierwsze dodane zdjęcie lub film z dysku.
2. Kadr z linku, jeśli da się go pobrać (YouTube lub bezpośredni link do zdjęcia).
3. Jeśli są tylko linki bez kadru: ikona wideo na jasnym tle (bez nazwy strony).
4. Brak materiałów: łapka, jak teraz.
Licznik „+N” zostaje.

## 3. Galeria w szczegółach — duży podgląd
- „X” w rogu dostaje wyraźne, okrągłe tło i leży nad zdjęciem lub filmem, więc jest zawsze widoczny.
- Dolny pasek: po lewej „Zamknij”, na środku licznik „x / N”, po prawej „Poprzednie” | „Następne”. Przy jednym materiale zostaje tylko „Zamknij”.

## Szczegóły techniczne
- `entry-form.tsx`: `addFiles` po walidacji od razu wywołuje upload (kolejka sekwencyjna, stan per plik: uploading/done/error); usunięcie `pending` jako osobnego kroku; przycisk `variant="ghost"` z `Upload`.
- `entry-card.tsx` + nowa funkcja w `video.ts` wybierająca miniaturę (pliki → linki z kadrem → ikona `Video` → `MediaPlaceholder`); test w `scripts/video.test.ts` dla kolejności wyboru.
- `entry-video.tsx` (MediaGallery): własny przycisk zamknięcia z `bg-background/90 shadow`, dolny pasek trzykolumnowy z `DialogClose`.
