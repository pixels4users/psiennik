# Większe odstępy między sekcjami formularza wydarzenia

## Cel
Poprawić czytelność ekranu dodawania/edycji wydarzenia przez zwiększenie pionowych odstępów między głównymi sekcjami formularza.

## Co się zmieni
- W `src/components/entry-form.tsx` zwiększony zostanie odstęp między sekcjami formularza (obecnie `grid gap-4` na elemencie `<form>`).
- Wewnętrzne odstępy wewnątrz sekcji (etykieta → pole) pozostaną bez zmian.
- Odstępy przycisków na dole pozostaną bez zmian.

## Propozycja techniczna
- Zmiana `className="grid gap-4"` na `className="grid gap-6"` (lub `gap-8`, jeśli preferujesz wyraźniejszy podział) na głównym elemencie formularza.
- Weryfikacja wizualna w podglądzie — zarówno na desktopie, jak i na wąskim ekranie.

## Zakres
- Tylko plik `src/components/entry-form.tsx`.
- Bez zmian w logice, polach ani zachowaniu formularza.
