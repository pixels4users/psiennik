# Design Psiennika

Lokalna propozycja refreshu z 18.09.2026. Zachowuje istniejącą paletę: forest, sage, keylime, mint, cream. Źródłem tokenów kolorów pozostaje `src/styles.css`; nie duplikujemy ich w osobnym theme.css.

## Charakter

Ciepły, spokojny, redakcyjny. Cormorant Garamond dla nagłówków; Inter dla kontrolek i treści. Duża typografia na stronie publicznej, umiarkowana w dzienniku. Psie fotografie i własne wektorowe łapy/pysk jako dekoracja. Bez gradientów, emoji, nowych płatnych fontów lub pobierania ilustracji Evergreen.

## Kompozycja

Strona publiczna: centralny hero, podgląd dziennika, trzy obszary funkcji, przykładowe historie, zdjęcie z życia z psem i końcowe CTA. Dziennik: kontekst psa, metryczka z akcjami, pięć widoków i treść. Gabinet: ostatnie wydarzenia oraz siatka psów z dotychczasowymi statusami.

Po korekcie z 19.09.2026 nagłówek hero zawiera wyłącznie tekst; zdjęcie psa pomiędzy słowami zostało usunięte. Psie motywy pozostają w dekoracjach i kolejnych sekcjach.

Przyciski są owalne. Pola: 48 px wysokości i promień 18 px. Karty: promień 22 px, obramowanie zamiast ciężkiego cienia. Metryczka i dialogi: 26 px; duże sekcje strony głównej: 32 px. Nie zamieniać każdej sekcji w osobną kartę.

Wybór zdjęcia psa: miniatura i przycisk tertiary „Wybierz plik” (`ghost`), bez ramki pola pliku i komunikatu „Nie wybrano pliku”. Nazwę nowo wybranego pliku pokazujemy jako zwykły tekst. Zapisane zdjęcie pozostaje widoczne do czasu jego zastąpienia lub usunięcia.

Przypisany behawiorysta: przycisk tertiary „Behawiorysta: {nazwa z bazy} →”, bez obramowania i ikony dodawania. Gdy behawiorysty jeszcze nie ma, pozostaje „Dodaj behawiorystę”. Oba stany otwierają dotychczasowy panel dostępu. Nazwy osób i metryczki w danych przykładowych nie zawierają technicznych dopisków „podgląd”.

Profil i menu konta obu ról udostępniają akcję tertiary „Wpisz kod zaproszenia”. Ze szczegółów psa usunięto osobny skrót „Dołącz kodem”; na liście psów pozostaje dodatkowe wejście z taką samą nazwą jak w profilu. Formularz obsługuje istniejące kody psa i behawiorysty, pokazuje błąd przy polu oraz oddaje fokus do przycisku otwierającego.

Lista „Twoi behawioryści” pokazuje „Behawiorysta: {nazwa z bazy}” i dotychczasowy status współpracy. Długie nazwy zawijają się na telefonie. Nazwy pochodzą z istniejącej tabeli `profiles`, z tymi samymi regułami dostępu co na stronie psa. Jeśli połączenie kodem nie daje jeszcze dostępu do nazwy, pozostaje etykieta „Behawiorysta” i status współpracy. Odświeżenie nie zmienia uprawnień ani schematu bazy. [Odbiór profilu i zaproszeń](ui-refresh/profil-zaproszenia.md).

## Ruch

`src/lib/motion-tokens.ts` zawiera wspólny fundament Motion: 160/240/550 ms, krzywa `[0.22, 1, 0.36, 1]`, stagger 80 ms. `Reveal` animuje tylko sekcje początkowo poza ekranem, raz przy wejściu, z przesunięciem 8–16 px. Treść w SSR pozostaje widoczna. Na telefonie bloki wchodzą niezależnie, bez opóźnień przeznaczonych dla kolumn desktopowych. Nagłówek hero, zdjęcie podglądu i końcowe CTA pozostają stabilne.

Łapy pojawiają się od dołu ku górze, każda przez 240 ms, ze startami co 80 ms, raz po wejściu tropu w ekran. Obrót SVG pozostaje niezależny od delikatnej animacji skali. Nie ma zapętlonych dekoracji ani parallax.

W części operacyjnej gotowa treść pojawia się przez 160 ms, bez przesuwania metryczki, animowania pojedynczych wierszy i ponownego rysowania wykresów. Kluczem widoku jest pies, nie wynik zapytania ani liczba wpisów. Karty reagują kolorem i obramowaniem, bez unoszenia i powiększania zdjęć. CSS odpowiada za krótkie wejście treści, bez przetrzymywania poprzedniego widoku przez `AnimatePresence`.

Dialogi zachowują Radix: 240 ms wejścia, 160 ms wyjścia, skala 0,98–1. Radix wybiera pierwsze pole i zachowuje pułapkę fokusu. Wspólny dialog przywraca poprzedni fokus również bez `DialogTrigger`. Natywne `autoFocus` usunięto z formularza psa, dołączania kodem i zaleceń, aby nie wyprzedzało mechanizmu Radix.

`prefers-reduced-motion` wyłącza przesunięcia, skalowanie i opóźnienia. `usePrefersReducedMotion` reaguje także na zmianę ustawienia podczas otwartej strony. Dodatkowe reguły CSS chronią stan końcowy przy ograniczonym ruchu i podczas drukowania.

Wzorce z dostarczonego motion-patterns zastosowano do ujawniania treści. Ponieważ paczka nie zawierała motion-foundations, używamy małego lokalnego fundamentu tokenów. [Zaakceptowany plan z 19.09.2026](ui-refresh/plan-animacji.md) wdrożono lokalnie; [wyniki sprawdzenia](ui-refresh/animacje-odbior.md). Bez push i publikacji.
