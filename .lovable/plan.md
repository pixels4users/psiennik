# Wielokrotny wybór typu wydarzenia i pory dnia

## Jak to będzie działać

- W formularzu wydarzenia „Typ aktywności" i „Pora dnia" przestają być listami z jednym wyborem — zamiast nich pojawią się klikalne etykiety, gdzie można zaznaczyć kilka opcji naraz (np. spacer + socjalizacja, rano + wieczór).
- W porach dnia dochodzi opcja **Cały dzień**: jej kliknięcie zaznacza rano, południe i wieczór. Odznaczenie którejkolwiek pory automatycznie wyłącza „Cały dzień".
- Trzeba wybrać przynajmniej jeden typ i jedną porę — inaczej zapis pokaże czytelny komunikat.

## Gdzie to będzie widoczne

- **Karta wydarzenia** (dziennik, kalendarz, dzień w kalendarzu): wszystkie wybrane typy i pory wypisane po przecinku; komplet pór pokaże się jako „Cały dzień".
- **Tabela**: kolumny „Typ aktywności" i „Pora dnia" pokażą wszystkie wartości; filtry działają tak, że wpis pasuje, jeśli zawiera wybraną wartość.
- **Analiza**: wpis z kilkoma typami liczy się w każdym z nich, a z kilkoma porami — w każdej porze. Sumy w statystykach mogą więc być wyższe niż liczba wpisów; opis pod tabelą to wyjaśni.

## Dotychczasowe wpisy

Wszystkie istniejące wydarzenia zostaną automatycznie przeniesione na nowy format jako pojedyncza wartość na liście — nic nie zniknie i niczego nie trzeba poprawiać ręcznie.

## Szczegóły techniczne

- Migracja: nowe kolumny `activity_types text[]` i `times_of_day text[]` w tabeli `entries`, wypełnione z obecnych `activity_type` / `time_of_day`, `NOT NULL` z domyślnymi wartościami. Stare kolumny zostają na razie nietknięte (bezpieczny rollback) i nie są już używane przez aplikację; zapis nadal wypełnia je pierwszą wybraną wartością, żeby dane pozostały spójne.
- „Cały dzień" nie jest osobną wartością w bazie — to skrót UI zaznaczający wszystkie trzy pory; wyświetlanie skraca komplet trzech pór do etykiety „Cały dzień".
- Nowy mały komponent wielokrotnego wyboru (toggle-chipy) w stylu istniejących przycisków oceny; bez nowych bibliotek.
- Aktualizacja: `src/lib/dogs.ts` (helper do etykiet list), `entry-form-dialog.tsx`, `entry-card.tsx`, `pies.$id.tabela.tsx` (filtry + kolumny), `pies.$id.analiza.tsx` (zliczanie), `src/lib/demo.functions.ts` (dane demo).
- Weryfikacja: dodanie i edycja wpisu z kilkoma typami i „Cały dzień", filtry w tabeli, liczniki w analizie, widok mobilny.
