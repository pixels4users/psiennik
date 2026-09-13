# Nowe materiały marki i odświeżone podglądy stron

Podmienimy obecne materiały na najnowszy zestaw. Jasne warianty zostaną użyte na ciemnych tłach, a wszystkie dostarczone pliki pozostaną dostępne w zasobach projektu.

## Zakres

### 1. Logo, ikony i favicona
- Zastąpić logo w nagłówku nowym plikiem `psiennik-logo-3`.
- Ustawić nową faviconę na podstawie dostarczonych plików PNG i ICO, z właściwymi odwołaniami dla przeglądarek.
- Zapisać w zasobach oba warianty logo i ikony:
  - standardowe: `psiennik-logo-3`, `psiennik-icon-3`,
  - na ciemne tła: `psiennik-logo-light`, `psiennik-icon-light`.
- Zachować także pliki, które nie będą obecnie wyświetlane, bez usuwania ich z zestawu marki.

### 2. Trzy podglądy linków 1200×630
- **Strona główna:** odświeżyć obecną kompozycję i użyć jasnego logo, aby było czytelne na ciemnozielonej warstwie.
- **Logowanie i rejestracja:** przebudować planszę marki z nowym logo i spójnymi kolorami.
- **Prywatne widoki aplikacji:** odświeżyć neutralną przykładową kartę dziennika, używając wyłącznie treści demonstracyjnych i nowej identyfikacji.
- Zoptymalizować wszystkie obrazy pod kątem podglądów w komunikatorach i serwisach społecznościowych.

### 3. Przypisanie i kontrola
- Zachować osobne obrazy dla strony głównej, `/auth` i ekranów prywatnych.
- Zachować adresy podglądów oparte o `https://psiennik.pl` oraz dotychczasowe zasady indeksowania.
- Sprawdzić logo i faviconę w interfejsie oraz każdy podgląd pod kątem czytelności, kadrowania, wymiarów i dostępności.
- Sprawdzić wersję komputerową i mobilną oraz brak błędów strony.

## Szczegóły techniczne
- Materiały logo i ikon zostaną zapisane jako zasoby CDN; favicony pozostaną rzeczywistymi plikami publicznymi wymaganymi przez przeglądarki.
- Istniejące odwołania do logo zostaną przełączone na nowy standardowy wariant, a jasny wariant będzie używany tylko tam, gdzie wymaga tego ciemne tło.
- Po zmianie informacji społecznościowych strona będzie wymagała ponownej publikacji, aby nowe podglądy pojawiły się pod publicznym adresem.
