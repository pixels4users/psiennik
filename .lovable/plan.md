# Wyraźniejsza „naciśnięta" łapka

## Co się zmieni
- Zwykła łapka zostaje bez zmian: ciemnozielona z białym obrysem.
- Łapka nad przyciskami i linkami („naciśnięta"):
  - obrys zmienia się z ciemnego na **biały** i jest grubszy,
  - wypełnienie jest wyraźnie jaśniejsze, żywsza zieleń,
  - łapka jest trochę mniejsza, jak teraz,
  - dodajemy cienki, delikatny cień wokół obrysu, żeby biały obrys był widoczny także na kremowym tle strony.
- Pola tekstowe i nieaktywne przyciski działają tak jak teraz.

## Szczegóły techniczne
- Edytujemy tylko `public/paw-cursor-press.svg`: fill `#6fb07d`, stroke `#ffffff`, stroke-width 2.2, a pod spodem kopia kształtów z obrysem `rgba(31,61,39,0.35)` (szerokość 3.5) jako halo.
- `src/styles.css` bez zmian.
