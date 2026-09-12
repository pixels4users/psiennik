# Psiennik

Potrzebuję stworzyć bardzo prostą stronę - nie zużywając na to tysięcy kredytów/tokenów. Dlatego najpierw planujemy i dopiero na końcu robimy. 

— 

Strona dla mnie, mojej żony i psiej behawiorystki. 

Zasadniczo to tabelka do uzupełniania: 

- Data

- Aktywności psa (Lucy) w ciągu dnia ( np. 11 września spacer z Kokosem i Lucy 45 minut po osiedlu | ćwiczenie z miska i poslaniem )

- opis; brak zachowań problemowych lub opis sytuacji problemowej

- jakiś rodzaj tagu/skali - na zasadzie "zielony-dobrze", "pomarańczowy-tak sobie", "zielony - dobrze"

- miejsce na komentarz/zalecenia behawiorystki (pole tekstowe)

— 

Chcę mieć stronkę, bo nie chce mi się konfigurować Excela, tworzyć notatek itd. 

"Pod spodem" to mogą być dane w tabelce (CSV, json, cokolwiek), ale chciałbym aby prezentacja byla w formie bardziej przyjaznej, myślałem o dwóch widokach/ekranach:

1. Lista: data (nagłówek) pod nią karty per "wydarzenie"/sytuacja. Na tej liście chyba najlepiej byłoby dać możliwość edycji wpisów. Do tego jeszcze globalna akcja "Dodaj wydarzenie", może na modelu i tam wybór daty i uzupełnienie poszczególnych pól etc. Komentarz behawiorystki jako osobny input i flow - tworzony po powstaniu samego zapisu wydarzenia. 

2. Kalendarz (od września 2026), gdzie na widoku tygodniowym byłoby widać overview (kolorem) czy dany dzień był bardziej "zielony" czy "czerwony". Do tego fajnie byłoby mieć (nad kalendarzem" jakąś sekcję analiz na podstawie "kolorów" naszych tagów + słów kluczowych (a może wprowadzić typ aktywności)?

Na razie bez logowania i kont

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f71e2a3c-8761-4645-ad08-008348dd3b40).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
