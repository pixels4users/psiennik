# Zapraszanie klientów na stronie „Psy pod opieką”

Behawiorysta po zalogowaniu nie widzi, jak zdobyć pierwszego klienta — kod zapraszający jest tylko w profilu. Przenosimy zapraszanie na stronę z psami i robimy z niego akcję główną.

## Hierarchia strony (widok behawiorysty)

```text
1  Nagłówek strony
   H1: Psy pod opieką
   [Zaproś klienta]  (primary)   [Dołącz kodem]  (secondary)

2  Pasek kodu zapraszającego  (widoczny zawsze, gdy kod istnieje)
   KOD: BEH-XXXXXXXX      [kopiuj kod] [kopiuj link] [nowy kod]
   Aktywne procesy: 2 / 5

3  Ostatnie wydarzenia   (tylko gdy są wpisy)

4  Zakładki: Aktywne / Oczekujące / Zakończone
   karty psów
```

Gdy behawiorysta nie ma jeszcze żadnego psa, zamiast zakładek pojawia się jeden ekran startowy:

```text
   Zaproś pierwszego klienta
   Wyślij właścicielowi link — po rejestracji jego psy trafią pod Twoją opiekę.
   [Zaproś klienta]   [Dołącz kodem]
```

Widok właściciela zostaje bez zmian (Dodaj psa / Dołącz kodem).

## Zaproś klienta

Przycisk otwiera okno „Zaproś klienta”:

- duży kod i link `/auth?code=…`,
- przyciski: kopiuj link, kopiuj kod, wygeneruj nowy kod,
- jedno zdanie wyjaśniające, co właściciel ma zrobić.

Jeśli konto nie ma jeszcze kodu, okno tworzy go od razu przy otwarciu — bez osobnego kroku „wygeneruj”.

## Kopia (zwięźle, bez tłumaczenia działania systemu)

- Przycisk: „Zaproś klienta”
- Okno: tytuł „Zaproś klienta”, zdanie: „Wyślij ten link właścicielowi. Po rejestracji jego psy trafią pod Twoją opiekę.”
- Pasek kodu: sam kod + ikony, bez akapitu wyjaśnień.

## Szczegóły techniczne

- Nowy komponent `src/components/behaviorist-invite.tsx`: okno zapraszania + kompaktowy pasek kodu; korzysta z istniejących `useBehavioristLink` i `useCreateBehavioristLink` z `src/lib/access.ts`. Brak zmian w bazie i w logice zaproszeń.
- `src/routes/_authenticated/psy.tsx`: dla `isBehaviorist` przycisk „Zaproś klienta” jako primary, „Dołącz kodem” jako outline; pasek kodu łączymy z istniejącym paskiem „Aktywne procesy”; nowy pusty stan dla behawiorysty bez psów.
- Usuwamy powielony przycisk „Dołącz kodem” (obecnie renderowany dwa razy dla właściciela i behawiorysty).
- Profil: karta „Kod zapraszający behawiorysty” zostaje, ale skracamy ją do tego samego komponentu, żeby kod i treść nie rozjeżdżały się w dwóch miejscach.
- Górna nawigacja bez zmian — akcja jest kontekstowa dla listy psów.
