# Poprawki przed publikacją

## Odpowiedź na Twoje pytania

- Błąd `src/lib/access.ts(93,14): error TS2352` jest już naprawiony — aktualny `bunx tsc --noEmit` przechodzi bez błędów.
- Strona **nie jest jeszcze gotowa do opublikowania**. Są dwa krytyczne problemy bezpieczeństwa w politykach dostępu do zdjęć psów, które blokują publikację.

## Co blokuje publikację

Skan bezpieczeństwa wykrył dwa błędy poziomu `error`:

1. **Publiczny dostęp do zdjęć psów** — polityki `storage.objects` pozwalają niezalogowanym użytkownikom (anon) na odczyt, upload i usuwanie plików w bucketcie `dog-photos`.
2. **Brak weryfikacji własności** — nawet dla zalogowanych użytkowników polityki nie sprawdzają, czy dany użytkownik ma dostęp do psa, którego zdjęcie dotyczy. Każdy zalogowany użytkownik mógłby nadpisać lub usunąć zdjęcia innych psów.

## Plan naprawy

1. Zmienić konwencję ścieżek w bucketcie `dog-photos` na `dogs/{dog_id}/{nazwa_pliku}`.
2. Zaktualizować kod klienta:
   - `uploadDogPhoto(file, dogId)` zapisuje plik pod ścieżką zawierającą `dog_id`.
   - Formularz dodawania psa najpierw tworzy rekord psa, potem uploaduje zdjęcie i aktualizuje `photo_url`.
   - Przy edycji psa używa istniejącego `dog_id`.
3. Ustawić bucket `dog-photos` jako publiczny i uprościć odczyt:
   - Odczyt (SELECT) pozostaje całkowicie publiczny, dzięki czemu front renderuje zwykłe adresy obrazków bez podpisanych linków.
   - `useDogPhotoUrl` przechodzi z `createSignedUrl` na publiczny adres pliku.
4. Napisać nowe polityki RLS na `storage.objects` wyłącznie dla zapisu:
   - Blokujemy `INSERT`, `UPDATE` i `DELETE` — każda z nich sprawdza `private.has_dog_access`.
   - Ścieżka musi mieć postać `dogs/{dog_id}/{nazwa_pliku}`.
   - Przed rzutowaniem `::uuid` sprawdzamy wyrażeniem regularnym, że `(storage.foldername(name))[1]` jest poprawnym UUID — inaczej niepasujący plik wywoła błąd w Postgresie.
5. Przeprowadzić migrację starych zdjęć skryptem TypeScript, nie SQL-em:
   - `UPDATE` na `storage.objects` nie przenosi plików; używamy `supabase.storage.from('dog-photos').move(oldPath, newPath)`.
   - Po każdym udanym przeniesieniu skrypt aktualizuje `dogs.photo_url` z poziomu kodu.
5. Przetestować:
   - upload zdjęcia przy tworzeniu psa,
   - podmianę i usunięcie zdjęcia przy edycji,
   - podgląd zdjęcia na liście psów i w formularzu,
   - dostęp behawiorysty do psa ze zdjęciem.
6. Ponownie uruchomić `bunx tsc --noEmit`, `bun run build`, skan bezpieczeństwa i Playwright na desktopie oraz telefonie.
7. Opublikować aplikację.

## Szczegóły techniczne

- Migracja SQL: `DROP POLICY ... ON storage.objects`, nowe polityki z użyciem `storage.foldername(name)` lub porównania prefiksu ścieżki, oraz `GRANT`/`ALTER TABLE` jeśli tworzona jest pomocnicza tabela.
- Kod klienta: `src/lib/dogs.ts` (funkcje `uploadDogPhoto`, `deleteDogPhoto`) oraz `src/components/dog-form-dialog.tsx` (kolejność insert → upload → update).
- Polityki storage mogą wyglądać np. tak:

```text
CREATE POLICY "Dog photos select by access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dog-photos'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND private.has_dog_access(
        (storage.foldername(name))[1]::uuid,
        auth.uid()
      )
);
```

- Podobne polityki dla `INSERT`, `UPDATE`, `DELETE`.

## Weryfikacja końcowa

- `bunx tsc --noEmit` — bez błędów.
- `bun run build` — sukces.
- Skan bezpieczeństwa — brak krytycznych usterek.
- Playwright — przepływy właściciela i behawiorysty na desktopie i mobile.
