Wznawianie zakończonej współpracy przez behawiorystę

Dziś behawiorysta może tylko zakończyć proces — powrót do pracy z tym samym psem wymaga obejścia, bo ponowne zaproszenie kończy się komunikatem „Masz już dostęp do tego psa”. Dodajemy jawną akcję „Wznów współpracę”.

## Co się zmieni dla behawiorysty

- Na stronie psa z zakończoną współpracą, w miejscu banera „Współpraca została zakończona…”, pojawia się przycisk **„Wznów współpracę”** (widoczny tylko dla behawiorysty przypisanego do tego psa, gdy jego status to „zakończona”).
- Na liście „Psy pod opieką”, w zakładce **Zakończone**, ta sama akcja przy karcie psa — żeby nie trzeba było wchodzić w psa.
- Po kliknięciu okno potwierdzenia: „Wznowić współpracę przy psie [imię]? Pies wróci do aktywnych, cała dotychczasowa historia pozostaje bez zmian.”
- Po potwierdzeniu pies wraca do zakładki „Aktywne”, znika baner tylko-do-odczytu, wracają komentarze i zalecenia; wpisy, zalecenia i komentarze zostają nietknięte.

## Sytuacje, w których wznowienie się nie uda

- **Pełny limit aktywnych procesów** — komunikat: „Nie możesz wznowić współpracy — masz już maksymalną liczbę aktywnych procesów (2/2). Zakończ jeden z nich, aby zwolnić miejsce.” Przycisk pozostaje aktywny, licznik limitu jest już liczony w aplikacji, więc komunikat pokazujemy od razu, bez wysyłania żądania.
- **Właściciel odebrał dostęp** — wtedy pies w ogóle nie jest już widoczny na liście behawiorysty, więc przycisku nie ma gdzie kliknąć. Zabezpieczamy jednak przypadek nieaktualnego ekranu (druga karta przeglądarki, dostęp cofnięty w międzyczasie): gdy zapis nie znajdzie już przypisania, pokazujemy komunikat „Nie możesz wznowić współpracy. Poproś właściciela, aby ponownie zaprosił Cię do psa [imię].” i odświeżamy listę.

## Powiadomienia

Właściciel i współwłaściciel dostają powiadomienie w aplikacji (i e-mail, jeśli ma włączone „Zaproszenia i dostęp”): „Współpraca przy psie [imię] została wznowiona”. Wznowienie nie zmienia reguł dostępu — właściciel nadal w każdej chwili może odebrać dostęp osobno.

## Bez zmian

- Właściciel nie wznawia współpracy samodzielnie — to decyzja behawiorysty; właściciel może jedynie ponownie zaprosić, jeśli wcześniej odebrał dostęp.
- Zakończenie procesu i odebranie dostępu pozostają dwoma odrębnymi działaniami.
- Brak ograniczeń czasowych — proces sprzed roku można wznowić tak samo.

## Szczegóły techniczne

Baza już na to pozwala: polityka `dog_access_update` dopuszcza zmianę własnego wiersza behawiorysty, `guard_dog_access_update` blokuje podmianę psa/roli, a `guard_dog_access_limit` egzekwuje limit aktywnych procesów przy przejściu na `active`. Zmiana statusu z `completed` na `active` przywraca `can_discuss_dog` i `useDogRole.canEditEntries`.

- Migracja (jedyna zmiana w bazie): RPC `resume_behavioral_process(p_dog_id)` na wzór `complete_behavioral_process` — `SECURITY INVOKER` wrapper wywołujący implementację w `private`, ustawia `process_status = 'active'` dla wiersza `role='behaviorist' AND user_id = auth.uid() AND process_status='completed'`; brak wiersza → wyjątek z komunikatem o poproszeniu właściciela; limit egzekwuje istniejący trigger (kod błędu `P0002`). Dodatkowo gałąź w `private.notify_access_update`: `OLD.process_status='completed' AND NEW.process_status='active'` → `notify_dog_audience(..., 'process_resumed', ..., 'all')`.
- `src/lib/access.ts`: hook `useResumeProcess(dogId)` (RPC + unieważnienie `dog-access`, `dog-role`, `dogs`, `subscription-limits`) oraz mapowanie błędów bazy na komunikaty powyżej; `useSubscriptionLimits.atLimit` do blokady po stronie UI.
- `src/lib/notifications.ts`, `src/routes/api/public/notifications/send.ts`: nowy rodzaj `process_resumed` (szablon `notify-access`, preferencja `notify_access`).
- `src/components/dog-nav.tsx`: przycisk w banerze tylko-do-odczytu, warunkowany rolą behawiorysty i statusem `completed`.
- `src/routes/_authenticated/psy.tsx`: akcja w karcie psa w zakładce „Zakończone”.
- `useDogRole` udostępnia już `processStatus` i `role`, więc nie trzeba nowych zapytań.

Weryfikacja: test bazy (wznowienie własnego zakończonego procesu, odrzucenie przy pełnym limicie, odrzucenie po odebraniu dostępu, brak wpływu na wpisy i komentarze), przejście w przeglądarce na koncie behawiorysty (zakończ → wznów → dodanie zalecenia), sprawdzenie powiadomienia u właściciela, `tsgo`, `test:ui`, build. Dane testowe usuwane po teście; bez publikacji.
