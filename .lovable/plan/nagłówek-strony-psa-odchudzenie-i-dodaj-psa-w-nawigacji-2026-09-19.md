# Nagłówek strony psa: odchudzenie i „Dodaj psa" w nawigacji

## Moja ocena Twoich uwag

Wszystkie cztery są zasadne:

1. **Dropdown „Twoje psy" — tak, do usunięcia.** Wybór psów przeniósł się do górnej nawigacji (imiona na desktopie, menu „Psy" na mobile i przy ≥4 psach), więc drugi wybór psa na stronie psa to duplikacja.
2. **„Dodaj psa" w nagłówku — tak.** To działanie globalne (nie dotyczy aktualnie otwartego psa), więc naturalne miejsce to nawigacja, a nie nagłówek konkretnego psa.
3. **„Wasza wspólna historia" — usuwamy.** Dla spójności odchudzenia znika cały nadrzędny napis (eyebrow), także „Dziennik podopiecznego" u behawiorysty — jeśli chcesz zachować ten drugi, to drobna korekta później.
4. **Lżejszy nagłówek — tak.** Zielone tło i duże paddingi schodzą, łapka zostaje w tle po prawej.

## Co zrobimy

### 1. Zniknięcie „Twoje psy" ze strony psa
- Właściciel: usuwamy pole wyboru (Select) i etykietę „Twoje psy" z góry strony psa — wybór psa odbywa się wyłącznie w górnej nawigacji.
- Behawiorysta: bez zmian — zostaje link wstecz „Wszystkie psy".
- Zapamiętywanie ostatnio oglądanego psa działa dalej (nie jest związane z tym Selectem).

### 2. „Dodaj psa" w górnej nawigacji (tylko właściciel)
- Desktop przy 1–3 psach: dyskretny przycisk z ikoną „+" zaraz za imionami psów (etykieta dla czytników ekranu i podpowiedź „Dodaj psa").
- Menu „Psy" (mobile oraz ≥4 psy): pozycja „Dodaj psa" na końcu listy imion, oddzielona separatorem.
- Otwiera to samo okno formularza co dziś (DogFormDialog bez psa — tryb dodawania).
- Behawiorysta przycisku nie widzi; na stronie listy psów (/psy) przycisk „Dodaj psa" zostaje bez zmian.

### 3. Teksty i lżejszy nagłówek psa
- Usuwamy napis „Wasza wspólna historia" / „Dziennik podopiecznego".
- Sekcja nagłówka psa traci zielone tło (bg-secondary) i zaokrąglenia — jest na tle strony, bez „kafelka".
- Padding zredukowany z dużych (p-5 / p-8) do minimalnych odstępów; tytuł i avatar o jeden stopień mniejsze, żeby sekcja była proporcjonalnie lżejsza.
- Łapka (grafika) zostaje w tle po prawej stronie, bez zmian.

## Zakres plików

- `src/components/dog-nav.tsx` — usunięcie Selecta (właściciel), przycisku „Dodaj psa" i napisu eyebrow; nowa, jaśniejsza postać nagłówka.
- `src/components/app-header.tsx` — „Dodaj psa" w nawigacji właściciela („+" przy imionach i pozycja w menu „Psy").
- `src/styles.css` — sprzątnięcie reguł `.dog-masthead` dotyczących eyebrow.

## Nie ruszamy

- Zakładek (Dziennik/Kalendarz/Tabela/Zalecenia/Analiza), widoków, bazy, uprawnień, redirectów, listy psów, zaproszeń.

## Ryzyko i uwagi

- Praca mała, ryzyko niskie — wyłącznie warstwa prezentacji, bez zmian danych i logiki.
- Nagłówek jest współdzielony przez wszystkie zakładki psa, więc zmiana objawia się jednolicie na każdej z nich.
- Do sprawdzenia po wdrożeniu: telefon 320–390 px (długie imiona, przycisk „+"), stan bez psów, klawiatura (fokus na nowym przycisku w nagłówku).
