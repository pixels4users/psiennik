# Naprawa edycji wydarzenia i czytelne przyciski na karcie

## Co jest zepsute

Strona edycji wydarzenia nigdy się nie pokazuje. Adres w przeglądarce się zmienia, ale nadal widać ekran szczegółów wydarzenia — dlatego „Edytuj wydarzenie" sprawia wrażenie, że nic nie robi, a formularza edycji nie ma.

Przyczyna: adres edycji leży „wewnątrz" adresu szczegółów wydarzenia, więc ekran szczegółów stał się ekranem nadrzędnym — a nie ma w nim miejsca, w którym podstrona edycji mogłaby się wyświetlić (potwierdzone w wygenerowanym drzewie tras: `/pies/$id/wydarzenie/$entryId` jest rodzicem dla `/edytuj`).

## Naprawa

- Rozdzielenie ekranów: szczegóły wydarzenia przenosimy do osobnego pliku liścia (`pies.$id.wydarzenie.$entryId.index.tsx`), a plik `pies.$id.wydarzenie.$entryId.tsx` zostaje wyłącznie ramką renderującą `<Outlet />` (bez własnego `head()`; parametr `wroc` waliduje ramka, dzieci go czytają).
- Treść ekranu szczegółów, jego `head()` i cała logika zostają bez zmian — tylko przenosimy do pliku `…index.tsx` z `createFileRoute("/_authenticated/pies/$id/wydarzenie/$entryId/")`.
- Ekran edycji (`…edytuj.tsx`) bez zmian w treści — zacznie się po prostu wyświetlać, z działającym zapisem, zmianą daty, typu, opisu i oceny oraz usuwaniem.
- `src/routes/__root.tsx`: wzorzec ukrywający nagłówek i stopkę (`/wydarzenie/(nowe|…/edytuj)`) pozostaje bez zmian — szczegóły nadal z nagłówkiem, edycja i dodawanie bez.
- Sprawdzam też nawigacje do `/pies/$id/wydarzenie/$entryId` (dziennik, kalendarz, zalecenia) — adresy się nie zmieniają, więc linki działają dalej.

## Karta wydarzenia na liście

Dolny pasek karty przebudowujemy na czytelny układ:

```text
[ocena]  [ikona] Komentarze (3)            [Edytuj]  [Szczegóły]
```

- „Szczegóły" — przycisk główny (primary), otwiera ekran szczegółów wydarzenia.
- „Edytuj" — przycisk drugorzędny (outline) z ikoną ołówka i tekstem, prowadzi prosto do działającego ekranu edycji. Widoczny tylko dla osób z prawem edycji.
- Komentarze — zwykły, nieklikalny opis z ikoną: „Komentarze (0)", „Komentarze (3)". Znika obecny link „Dyskusja".
- Liczba pochodzi z już istniejącego licznika (`useEntryCommentCounts`), więc nie ma dodatkowych zapytań do bazy. Dyskusję nadal otwiera się przez „Szczegóły".
- `onOpenDetails` zostaje jako prop karty (używa go też panel dnia w kalendarzu), tylko wywoływany z nowego przycisku.

## Szczegóły techniczne

- Pliki: nowy `src/routes/_authenticated/pies.$id.wydarzenie.$entryId.index.tsx`, przepisany na layout `pies.$id.wydarzenie.$entryId.tsx`, zmiany w `src/components/entry-card.tsx`.
- Bez zmian w bazie, uprawnieniach i adresach stron.
- Po zmianach: `bunx tsgo --noEmit`, build oraz sprawdzenie w przeglądarce (1280 i 390 px): otwarcie szczegółów z karty, przejście do edycji, zapis zmiany opisu i daty, powrót, licznik komentarzy.
