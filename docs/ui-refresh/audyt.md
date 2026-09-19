# Audyt UX/UI Psiennika — 18 września 2026

Zakres: lokalny refresh na `codex/psiennik-ui-refresh`, baza `origin/main` = `01f73b6`. Bez push, publikacji, zmian w bazie i regułach dostępu. Istniejące dokumenty w `docs/plany` oraz `Zasoby i instrukcje` pozostają poza tym zakresem.

## Rozpoznanie

| Obszar        | Obserwacja                                                                                                    | Zmiana                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Strona główna | Typowy układ tekst + prostokątne zdjęcie, następnie podobna sekcja. Duże cienie konkurują z lekką typografią. | Centralny nagłówek z portretem psa, ślady łap, podgląd wpisu i zalecenia; zróżnicowanie rytmu sekcji.                          |
| Tożsamość     | Kolory i fonty tworzą dobrą bazę, ale psie motywy poza zdjęciami są mało widoczne.                            | Własne proste ilustracje wektorowe pyska i łap. Dotychczasowa paleta oraz Cormorant Garamond / Inter.                          |
| Właściciel    | `/psy` jest listą, a najważniejsze czynności wymagają wejścia do psa.                                         | Automatyczne wejście do ostatnio wybranego dostępnego psa; przy pierwszej wizycie do pierwszego psa. Selektor nad dziennikiem. |
| Behawiorysta  | Lista i ostatnie wydarzenia konkurują o uwagę; niewielkie poziome karty słabo eksponują psy.                  | Siatka 1/2/3/4 kolumn, duże zdjęcia, czytelne imię i wejście do dziennika. Zachowane statusy i ostatnie wydarzenia.            |
| Profil psa    | Metryczka, zakładki i akcje są rozproszone.                                                                   | Wspólny nagłówek: selektor, zdjęcie, metryczka, czynności i zakładki poniżej.                                                  |
| Kontrolki     | Przyciski 32–40 px, delikatne obramowania pól i niespójne cienie.                                             | Przyciski 40–48 px, wyraźne obramowania pól, widoczny fokus, łagodniejsze karty.                                               |
| Dialogi       | Bazowy dialog nie ogranicza wysokości do ekranu telefonu.                                                     | Maksymalna wysokość zależna od `dvh`, przewijanie treści, margines od krawędzi i zachowanie mechanizmów Radix.                 |

Strona produkcyjna oraz benchmark zostały obejrzane w przeglądarce. Początkowy audyt ekranów zalogowanych opierał się na aktualnym kodzie; weryfikacja wizualna odbywa się na lokalnych danych przykładowych, co nie dowodzi poprawności produkcyjnego RLS.

## Inspiracja i warianty

[Evergreen](https://www.evergreen.so/) jest odniesieniem dla dużej typografii, kompozycji zdjęć w nagłówku i dekoracji wychodzących poza ramkę produktu. Załączone DESIGN-3.md i tokeny opisują Evergreen — ich nakazy używania czerni, innych fontów i kolorów nie są wymaganiami dla Psiennika.

Zaproponowano wariant ciepły/redakcyjny oraz bardziej figlarny/ilustracyjny. Do lokalnej propozycji przyjęto pierwszy, zgodny z podanym benchmarkiem. To propozycja do wspólnego odbioru, nie akceptacja użytkownika ani publikacja.

## Sposób skrócenia ścieżki

Zachowujemy `/pies/$id` i wszystkie podstrony. `/psy` rozpoznaje dotychczasową rolę konta i u właściciela przechodzi do dostępnego dziennika z `replace`. Nie powstaje drugi dziennik ani osobna logika wydarzeń. Behawiorysta pozostaje na liście. Przełączanie psa zachowuje aktualną zakładkę. Brak psów pokazuje istniejący proces dodania pierwszego psa.

Wybór psa w localStorage to wyłącznie preferencja interfejsu, osobna dla każdego użytkownika. Przed użyciem identyfikatora sprawdzamy go na aktualnej liście zwróconej przez istniejące zapytanie. Nie nadaje to żadnych uprawnień.

## Granice i kwestie do osobnego ustalenia

- Zachowane zapytania do danych, rola wobec konkretnego psa, funkcje zaproszeń, limity, dyskusje, zalecenia i formularze zapisu. Przeniesiono miejsca wywołania istniejących akcji.
- Istniejące grupowanie statusów na liście korzysta z pierwszego `dog_access`. Nie przebudowano tej reguły przy odświeżeniu UI; wymaga osobnej kontroli danych na kontach o wielu relacjach.
- Dotychczasowa reguła `isReadOnly` pozostaje bez zmian; refresh nie rozstrzyga od nowa dostępu po zakończeniu współpracy.
- Treści prawne, płatności, plan cenowy i zapowiadane w innych planach wideo nie są częścią pracy.
- Nie zmieniono konfiguracji Supabase ani migracji. Wspólny odbiór z rzeczywistymi kontami pozostaje wymagany przed PR.
