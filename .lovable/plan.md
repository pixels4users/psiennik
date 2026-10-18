# Wideo w wydarzeniach: plik z telefonu albo link

## Co zobaczy użytkownik

- W formularzu dodawania i edycji wydarzenia nowa sekcja „Wideo” z dwiema drogami:
  - „Dodaj wideo z telefonu” (domyślna): wybór z galerii lub nagranie aparatem (MP4, MOV, WebM), maks. 20 MB na plik, podpowiedź „Najlepiej 15–45 sekund kluczowej sytuacji”. Po wybraniu od razu podgląd i pasek postępu wysyłania.
  - „Lub wklej link”: YouTube, Dysk Google lub Vimeo. Film odtwarza się w Psienniku, bez wychodzenia z aplikacji. Inne linki pokażą się jako zwykły link „Otwórz wideo”.
- Jedno wideo na wydarzenie (plik albo link).
- Szczegóły wydarzenia: odtwarzacz nad opisem, pod nim komentarze i zalecenia — behawiorystka ogląda i od razu odpisuje.
- Karta wydarzenia na liście: mała ikona „Wideo”, bez odtwarzacza (lista zostaje lekka).
- Usuwanie: w edycji wydarzenia przycisk „Usuń wideo” — tekst, ocena i komentarze zostają, zwalnia się tylko miejsce.
- Ustawienia: nowa sekcja „Miejsce na pliki” — pasek zajętości (np. „31 z 50 MB”) i lista wszystkich wideo (pies, data, tytuł wydarzenia, rozmiar) z przyciskiem usuwania.
- Bez automatycznego kasowania. Przy przekroczeniu limitu jasny komunikat: „Brakuje miejsca. Usuń starsze wideo w Ustawieniach albo wklej link”.

## Limity

- Wspólny limit konta na zdjęcia psów i wideo: 50 MB (zamiast 20 MB).
- Pojedynczy plik wideo: maks. 20 MB, sprawdzane w przeglądarce i w bazie.
- Bez kompresji wideo w przeglądarce (zbyt ciężkie dla telefonów); zdjęcia nadal są zmniejszane jak dziś.
- Wideo widzą tylko osoby z dostępem do psa (te same zasady co dziennik). Dodawać i usuwać może ten, kto może edytować wydarzenia.

## Szczegóły techniczne

- Baza (migracja addytywna): w `entries` nowe kolumny `video_path text`, `video_size bigint`, `video_url text`; CHECK, że nie są ustawione jednocześnie plik i link.
- Nowy prywatny bucket `dog-videos` (limit pliku 20 MB, typy video/*). Ścieżka `dogId/entryId/plik`. Polityki `storage.objects`: odczyt dla `has_dog_access`, zapis/usuwanie dla `can_edit_entries`, plus kontrola limitu konta.
- Limit: `private.photo_quota_ok` rozszerzona do sumy obu bucketów i progu 50 MB (nazwa komunikatu wspólna dla zdjęć i wideo); aktualizacja `PHOTO_QUOTA_MESSAGE` w `src/lib/dogs.ts`.
- Usunięcie wydarzenia lub wideo usuwa też plik ze storage (w kodzie formularza; sprzątanie osieroconych plików przy usuwaniu wpisu).
- Link: parser w `src/lib/video.ts` zamieniający adresy YouTube/youtu.be/Shorts, Dysku Google (`/file/d/ID` → `/preview`) i Vimeo na adres embed; iframe z `sandbox`/`allow` minimalnymi, `loading="lazy"`, proporcje 16:9 (Shorts 9:16).
- Odtwarzanie pliku: `<video controls playsInline preload="metadata">` z podpisanym adresem (odnawianym jak przy zdjęciach).
- Pliki: `entry-form.tsx` (sekcja wideo, upload z postępem), szczegóły wydarzenia, `entry-card.tsx` (ikona), `profil.tsx` (sekcja miejsca i lista wideo), nowe `src/components/entry-video.tsx`.
- Eksport danych konta uwzględni listę wideo; usunięcie konta usuwa pliki.
- Testy: jednostkowe parsera linków i limitu 20/50 MB; test bazy, że osoba bez dostępu nie odczyta ani nie wgra wideo, a przekroczenie limitu jest odrzucane; Playwright 390 px: dodanie wideo, odtworzenie, usunięcie. Dane testowe usuwane po teście. Bez publikacji.
