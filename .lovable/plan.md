# Spójne podglądy linków i informacje dla wyszukiwarek

Każdy typ strony otrzyma własny, rozpoznawalny podgląd. Publiczna strona główna będzie opisywana dla Google, natomiast logowanie i wszystkie ekrany po zalogowaniu pozostaną poza wynikami wyszukiwania.

## Zakres

### 1. Trzy grafiki społecznościowe 1200×630
- **Strona główna:** kadr z obecnego zdjęcia głównego, uzupełniony dyskretnym logo Psiennika.
- **Logowanie i rejestracja:** czysta plansza marki z przesłanym logo, bez zdjęć użytkowników.
- **Lista psów i pozostałe ekrany prywatne:** neutralna, przykładowa karta dziennika Humusa na bazie istniejącego zdjęcia i przykładowych treści ze strony głównej.
- Zapisanie zoptymalizowanych plików w publicznych zasobach strony, aby komunikatory mogły je pobrać bez logowania.

### 2. Indywidualne podglądy linków
- Ustawić dla każdej strony własny tytuł, opis, `og:title`, `og:description`, `og:image`, `twitter:image`, `og:url` i odpowiedni format dużej karty.
- Strona główna użyje grafiki ze zdjęciem głównym.
- `/auth` użyje planszy z logo.
- `/psy`, profil i wszystkie widoki konkretnego psa użyją wspólnej, neutralnej grafiki przykładowego dziennika.
- Wszystkie adresy podglądów będą absolutne i oparte o `https://psiennik.pl`.

### 3. Zasady widoczności w Google
- Ustawić `https://psiennik.pl/` jako kanoniczny adres strony głównej.
- Dodać `noindex, nofollow` do logowania/rejestracji oraz całej części dostępnej po zalogowaniu; prywatne dane i ekrany użytkowników nie powinny trafiać do Google.
- Pozostawić indeksowaną wyłącznie publiczną stronę główną.
- Usunąć `/auth` z mapy strony i zmienić adres mapy z technicznego na `https://psiennik.pl/`.
- Dodać odwołanie do mapy strony w pliku dla robotów wyszukiwarek.

### 4. Kontrola jakości
- Sprawdzić wygenerowany kod HTML każdej reprezentatywnej strony: `/`, `/auth`, `/psy` i widok psa.
- Potwierdzić dokładnie jeden właściwy obraz, tytuł i opis dla każdej strony oraz brak odziedziczonego obrazu strony głównej.
- Sprawdzić rozmiar i wagę grafik, dostępność bez logowania oraz poprawne kadrowanie 1200×630.
- Zweryfikować brak błędów budowania strony.

## Uwagi praktyczne
- Podgląd linku zależy od komunikatora i może odświeżyć się z opóźnieniem po publikacji.
- Dla ekranów prywatnych używamy wyłącznie materiałów demonstracyjnych — nigdy danych ani zdjęć prawdziwych użytkowników.
- Po wdrożeniu zmiany będą wymagały publikacji, aby zadziałały pod adresem `psiennik.pl`.
