# # Lepsze UX zaproszeń kodem — instrukcja i link dla zapraszanej osoby

Obecnie właściciel kopiuje surowy kod zaproszenia, ale w oknie nie ma wyjaśnienia, co z nim zrobić. Osoba zapraszana musi sama trafić na `/auth` i wpisać kod. Planuje się dodać gotowy link z kodem oraz krótką instrukcję bezpośrednio w oknie zaproszenia i w profilu behawiorysty.

## Co zmieniamy

1. W oknie „Osoby z dostępem” (widok psa) pod wygenerowanym kodem pokazujemy:

  - gotowy adres `https://<host>/auth?code=<kod>`,

  - przycisk „Kopiuj link” obok przycisku „Kopiuj kod”,

  - krótką instrukcję: „Wyślij ten link osobie, którą zapraszasz. Po zalogowaniu lub rejestracji zostanie automatycznie dodana do psa.”

2. W profilu behawiorysty, w sekcji „Kod zapraszający behawiorysty”, dodajemy analogiczny link `/auth?code=<kod>` i instrukcję dla właściciela.

3. Na stronie `/auth` poprawiamy komunikat o kodzie, aby był bardziej przyjazny (np. „Masz zaproszenie — zaloguj się lub załóż konto, aby dołączyć”).

4. Weryfikujemy, że `/auth?code=...` działa dla wszystkich ról: współwłaściciel (przekierowanie do psa) i behawiorysta (przekierowanie do listy psów).

5. Pytanie, czy konto nie będące behawiorystą nie powinno też mieć przycisku "Dołącz kodem"?  
  
6. Na widoku 'pies' w sytuacji, gdy nie ma jeszcze Współwłaściciela - obok przycisku 'Dodaj wydarzenie' dodajmy przycisk (secondary) 'Dodaj współwłaściciela', który otworzy warstwę osoby z dostępem ('Osoby z dostępem'). Do tego przycisk 'Dodaj behawiorystę' z analogiczną akcją. Przycisk "Dodaj współwłaściciela' powinien być ukryty, gdy pies ma już współwłaściciela, a przycisk "Dodaj behawiorystę" powinien być ukryty, gdy dany pies ma już dodanego behawiorystę. Spójrz

## Szczegóły techniczne

- W `src/components/invite-dialog.tsx` obliczamy `inviteUrl =` ${window.location.origin}/auth?code=${invite.code}``.

- Dodajemy drugi przycisk z ikoną `Link` (lub podobną) kopiujący cały URL.

- Tekst instrukcji pod kodem, w mniejszej szarości.

- W `src/routes/_authenticated/profil.tsx` w komponencie `BehavioristCodeCard` dodajemy analogiczny link i przycisk „Kopiuj link”.

- W `src/routes/auth.tsx` rozszerzamy obecny komunikat o kodzie, aby był czytelniejszy.

- Nie tworzymy wysyłki e-mail/SMS z aplikacji — link kopiujemy do schowka i użytkownik wysyła go sam.

## Czego nie robimy

- Nie dodajemy wysyłki zaproszeń e-mailem/SMS-em (poza zakresem, wymagałoby infrastruktury e-mail).

- Nie zmieniamy logiki zaproszeń po stronie bazy — tylko warstwa UI.