# Zdjęcie psa przy tworzeniu i późniejszej edycji

## Zakres
- Rozszerzyć istniejący formularz psa tak, aby działał zarówno przy dodawaniu, jak i edycji rekordu.
- Przy tworzeniu umożliwić wybór zdjęcia oraz pokazać jego podgląd przed zapisem.
- Na profilu psa pokazać aktualne zdjęcie i, tylko dla właściciela, akcję „Edytuj psa”.
- W edycji pozwolić zmienić dane psa, dodać zdjęcie, zastąpić obecne zdjęcie albo je usunąć.
- Po zapisie odświeżyć zdjęcie i dane na liście psów oraz we wszystkich widokach profilu.

## Szczegóły techniczne
- Wykorzystać istniejące prywatne miejsce na zdjęcia i podpisane adresy obrazów.
- Przy zastąpieniu lub usunięciu zdjęcia usunąć poprzedni plik, aby nie zostawiać nieużywanych zdjęć.
- Ograniczyć wybór do plików graficznych i czytelnie pokazać stan zapisywania oraz błędy.
- Zachować obecne uprawnienia: behawiorysta tylko ogląda zdjęcie, właściciel może je zmieniać.
- Bez zmian w bazie danych — pole zdjęcia i miejsce na pliki już istnieją.

## Weryfikacja
- Sprawdzić dodanie psa ze zdjęciem i bez zdjęcia.
- Sprawdzić dodanie, podmianę i usunięcie zdjęcia istniejącego psa.
- Sprawdzić wygląd oraz działanie na komputerze i telefonie.
