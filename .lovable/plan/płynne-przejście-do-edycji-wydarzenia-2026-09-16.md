# Płynne przejście do edycji wydarzenia

## Cel

Po użyciu „Edytuj” bieżący ekran pozostaje widoczny, dopóki widok edycji nie będzie gotowy. Użytkownik nie zobaczy po drodze pustego formularza, szkieletu ani fragmentu poprzedniej strony bez nagłówka.

## Zmiany

- Przed przejściem pod adres edycji aplikacja wczyta w tle kod tego ekranu.
- Podczas krótkiego oczekiwania przycisk „Edytuj” pokaże stan ładowania i nie przyjmie kolejnego kliknięcia; obecna karta lub ekran szczegółów pozostaną bez zmian.
- Dopiero po przygotowaniu strony nastąpi zmiana adresu i jednoczesne pokazanie widoku „Edytuj wydarzenie”.
- Formularz edycji dostanie wartości wydarzenia już przy pierwszym renderze, zamiast najpierw pokazywać wartości domyślne i uzupełniać je chwilę później.
- To samo zachowanie obejmie oba wejścia do edycji: przycisk na karcie wydarzenia oraz przycisk na stronie szczegółów.
- Nie dodajemy pełnoekranowej animacji. Krótka, dyskretna zmiana stanu przycisku będzie zabezpieczeniem na wolniejszym połączeniu, ale główną naprawą jest wcześniejsze przygotowanie strony.

## Weryfikacja

- Sprawdzę przejście z listy i ze szczegółów wydarzenia na komputerze oraz telefonie.
- Potwierdzę klatka po klatce, że przed gotowym formularzem nie pojawia się inny ekran ani pusty formularz.
- Sprawdzę, że data, typ, opis i ocena są poprawne od pierwszego widocznego momentu oraz że zapis i powrót nadal działają.
- Sprawdzę błędy podglądu i poprawność kompilacji.

## Zakres techniczny

Zmiany dotyczą nawigacji do edycji oraz inicjalizacji istniejącego formularza. Bez zmian w bazie, uprawnieniach i adresach stron.
