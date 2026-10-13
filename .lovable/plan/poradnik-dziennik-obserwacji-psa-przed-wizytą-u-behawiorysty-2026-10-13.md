# Poradnik: dziennik obserwacji psa przed wizytą u behawiorysty

## Czego szukają ludzie (Semrush, Polska)
- „dziennik behawioralny psa” i „reaktywność psa”: brak danych. Ta fraza raczej nie przyprowadzi ruchu, ale może zostać w tekście.
- „behawiorysta dla psa” około 1 900 miesięcznie, „behawiorysta psów” około 480 (niska trudność).
- „jak oduczyć psa szczekania na inne psy” około 260, „dlaczego pies szczeka na inne psy” około 140, „jak nauczyć psa nie reagować na inne psy” około 170.
- „konsultacja behawioralna” około 20, „jak wygląda konsultacja behawioralna” bez danych.

Wniosek: ludzie nie szukają „dziennika”. Szukają pomocy z konkretnym problemem i behawiorysty. Poradnik odpowiada na pytanie „mój pies reaguje na inne psy — od czego zacząć?”, a dziennik pokazuje jako praktyczny pierwszy krok.

## Strona
- Adres: `/poradnik/dziennik-obserwacji-psa`
- Tytuł: „Pies szczeka na inne psy? Jak prowadzić dziennik obserwacji przed wizytą u behawiorysty”
- Sekcje:
  1. Krótka odpowiedź na górze: co zapisywać i po co.
  2. Dlaczego pies może reagować na inne psy: ogólnie, bez stawiania diagnozy, z zachętą do konsultacji ze specjalistą.
  3. Co zapisywać po każdym spacerze: pora, miejsce, odległość, reakcja, co pomogło, czas powrotu do spokoju, ocena dnia.
  4. Przykładowy tydzień wpisów: nawiązanie do przykładu Humusa ze strony głównej, oznaczony jako przykład.
  5. Jak pokazać dziennik behawioryście i co da Wam to na konsultacji.
  6. Częste błędy: zapisywanie z pamięci, same oceny bez kontekstu.
  7. Na końcu spokojne zaproszenie: „Prowadź dziennik w Psienniku” oraz przyciski dla właściciela i behawiorysty.
- Tytuł i opis dla Google i podglądów linków, adres kanoniczny `https://psiennik.pl/poradnik/dziennik-obserwacji-psa`, dane strukturalne typu Article z autorem „Psiennik”.

## Linki
- Strona główna: link „Jak prowadzić dziennik obserwacji psa” pod sekcją „Dziennik w praktyce”.
- Stopka: link „Poradnik”.
- Poradnik zostanie dopisany do mapy strony (sitemap.xml).

## Treść
- Tekst napiszę w stylu reszty strony. Nie będzie w nim porad zdrowotnych ani obietnic efektów.
- Przed publikacją dobrze, żeby przeczytał go behawiorysta. Tekst ma w tym czasie oznaczenie „Do przeglądu”, które usunie właściciel.

## Technicznie
- Nowy plik trasy `src/routes/poradnik.dziennik-obserwacji-psa.tsx` korzystający z `socialMeta` (obraz `homepage`).
- Edycje: `src/routes/index.tsx` (link), `src/components/site-footer.tsx` (link), `public/sitemap.xml` (nowy adres).
- Bez zmian w bazie i logowaniu. Kontrola: build, Playwright desktop i 390 px, sprawdzenie meta tagów w HTML.
- Strona pojawi się w Google dopiero po publikacji.
