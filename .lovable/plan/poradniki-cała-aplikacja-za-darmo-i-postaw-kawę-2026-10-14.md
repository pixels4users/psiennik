# Poradniki, cała aplikacja za darmo i „Postaw kawę”

## 1. Poradniki jako lista wpisów
- Nowa strona `/poradnik`: siatka kart (zdjęcie, tytuł, opis przycięty do 2 wierszy, przycisk „Czytaj”). Na telefonie karty jedna pod drugą, na komputerze trzy w rzędzie.
- Trzy wpisy:
  1. **Pies szczeka na inne psy** — istniejący wpis (adres bez zmian), zdjęcie psa patrzącego przez bramę.
  2. **Lęk separacyjny u psa: co zapisywać, gdy zostaje sam** — nowy, zdjęcie psa patrzącego w górę na osiedlu.
  3. **Pies niszczy buty i przedmioty: jak to obserwować** — nowy, zdjęcie szczeniaka gryzącego but; zdjęcie szczeniaka z sandałami w środku tekstu.
- Nowe wpisy mają ten sam układ co obecny: krótka odpowiedź, co zapisywać, przykładowy tydzień (oznaczony jako przykład), jak pokazać dziennik behawioryście, częste błędy, zaproszenie do Psiennika. Bez porad medycznych; przy lęku separacyjnym zachęta do kontaktu z behawiorystą i weterynarzem.
- „Poradniki” w nawigacji górnej (dla zalogowanych i niezalogowanych, na telefonie w menu). W stopce link prowadzi do listy.
- Każdy wpis i lista mają własny tytuł, opis, podgląd linku ze swoim zdjęciem i adres kanoniczny; wszystkie trafiają do mapy strony.

## 2. Cała aplikacja darmowa
- Usuwamy limit 2 aktywnych psów u behawiorysty: znikają blokady przy kodach, przy wznawianiu współpracy, status „oczekujące” z powodu limitu, licznik miejsc i komunikaty o planie darmowym/PRO.
- Psy, które dziś czekają z powodu limitu, stają się aktywne.
- Kolumny planu w bazie zostają nieużywane (bez kasowania danych).

## 3. Limit miejsca na zdjęcia
Obecnie: 4 zdjęcia, razem ok. 9 MB (średnio ok. 2,2 MB na zdjęcie, bo zapisujemy oryginały).
- Zdjęcia psów będą przed zapisem zmniejszane do ok. 1200 px (zwykle 200–400 KB) — to największa oszczędność.
- Limit łączny: **20 MB na użytkownika** (ok. 50–100 zdjęć po zmniejszeniu). Przy przekroczeniu: „Brak miejsca na zdjęcia. Usuń jedno ze starszych zdjęć psa.” Sprawdzane w bazie, nie tylko na stronie.
- Szacunek: 10 zdjęć × ok. 0,3 MB = ok. 3 MB na osobę, czyli 1 GB wystarcza dla ok. 300 osób, 10 GB dla ok. 3 000. Przestrzeń na pliki to jedna z tańszych pozycji w chmurze; dokładną cenę i wliczony pakiet sprawdzisz w ustawieniach Cloud — wartość limitu łatwo zmienić później.

## 4. „Postaw kawę” (buycoffee.to)
- Nawigacja górna: mały przycisk „Postaw kawę” z ikoną kubka, otwiera https://buycoffee.to/psiennik w nowej karcie (oficjalna grafika 468×122 jest za duża do paska).
- Stopka: oficjalny przycisk-grafika buycoffee.to w zmniejszonym rozmiarze, z opisem „Postaw kawę dla Psiennik na buycoffee.to”.

## Technicznie
- Zdjęcia przez `lovable-assets` → `src/assets/guide-*.jpg.asset.json`; og:image z kopii 1200×630.
- Trasy: `poradnik.index.tsx` (lista), istniejący wpis, `poradnik.lek-separacyjny-psa.tsx`, `poradnik.pies-niszczy-przedmioty.tsx`; wspólne dane wpisów w `src/lib/guides.ts`, karta jako komponent design systemu.
- Migracja: `guard_dog_access_limit` i `handle_new_dog` bez sprawdzania limitu; aktualizacja istniejących `pending` → `active`; nowa funkcja i polityka INSERT na `storage.objects` (suma rozmiarów plików właściciela ≤ 20 MB).
- Frontend: usunięcie `useSubscriptionLimits`, licznika i komunikatów o limicie (`access.ts`, `resume-process-button.tsx`, `psy.tsx`, profil); zmniejszanie zdjęcia w `dog-form-dialog.tsx`.
- `app-header.tsx`, `site-footer.tsx`, `public/sitemap.xml`.
- Kontrola: typy, testy, build, Playwright desktop/390 px, test bazy (przekroczenie limitu zdjęć odrzucone), meta tagi każdej strony.
