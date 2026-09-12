# Szersza lista i widok tabeli

## Zakres

- Ujednolicić szerokość widoku „Lista” z widokiem „Kalendarz”.
- Dodać trzeci przełącznik „Tabela” w profilu psa.
- Dodać stronę tabeli zbierającą wszystkie wydarzenia psa.

## Tabela i filtry

- Kolumny: data, wydarzenie, typ aktywności, pora dnia, ocena, opis i komentarz behawiorysty.
- Sortowanie: najnowsze, najstarsze, najtrudniejsze.
- Filtry: zakres dat (domyślnie cała historia), typ aktywności, pora dnia i ocena.
- Przycisk wyczyszczenia filtrów oraz liczba pokazanych wyników.
- Na węższych ekranach tabela będzie przewijana poziomo, bez ściskania treści.

## Technicznie

- Nowa trasa `/pies/$id/tabela` z własnymi metadanymi.
- Filtry będą działały lokalnie na już pobranych wpisach, bez zmian w bazie danych.
- Wybór dat zostanie oparty o istniejący kalendarz i zakres dwóch dat.

#Jeszcze pytanie o widok Kalendarza i "Powtarzające się tematy" - jak to będzie działało? Czy mamy jakiś algorytm, który stworzy tam opis, wylistuje słowa kluczowe czy jak? 