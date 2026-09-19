# Powiadomienia w Psienniku

Dziś „dzwonek" tylko wylicza na bieżąco liczbę nowych wpisów (behawiorysta) albo zaleceń (właściciel) na podstawie daty ostatniej wizyty w dzienniku psa. Nie ma komentarzy, zaproszeń, listy zdarzeń ani znacznika „przeczytane". E-maili aplikacja w ogóle nie wysyła (działają tylko e-maile logowania). Domena nadawcy `notify.psiennik.pl` jest już zweryfikowana.

## Zakres

Cztery rodzaje zdarzeń, każde tworzy powiadomienie dla właściwych osób przy psie:

| Zdarzenie | Kto dostaje |
| --- | --- |
| Nowe wydarzenie w dzienniku | pozostałe osoby przy psie (behawiorysta, współwłaściciel, właściciel) |
| Nowy komentarz | pozostałe osoby przy psie |
| Nowe zalecenie behawiorysty | właściciel i współwłaściciel |
| Zaproszenia i dostęp | ktoś skorzystał z kodu psa, właściciel połączył się z behawiorystą, zakończono współpracę, odebrano dostęp |

Autor zdarzenia nigdy nie dostaje powiadomienia o własnym działaniu.

## Część 1 — powiadomienia na stronie

Nowa tabela powiadomień: odbiorca, pies, typ zdarzenia, powiązany wpis, krótki tekst (imię autora + tytuł wydarzenia), data, moment przeczytania. Wiersze tworzy sama baza w momencie zapisu — nikt nie może dopisać cudzego powiadomienia, a każda osoba widzi wyłącznie swoje.

W interfejsie:
- Dzwonek pokazuje liczbę nieprzeczytanych i listę ostatnich zdarzeń (kto, co, przy którym psie, kiedy) zamiast samych liczników przy psach.
- Kliknięcie pozycji otwiera właściwe miejsce (wydarzenie, zalecenia, strona psa) i oznacza ją jako przeczytaną.
- „Oznacz wszystkie jako przeczytane".
- Lista odświeża się przy wejściu na stronę i co jakiś czas w tle; opcjonalnie na żywo przez subskrypcję zmian.
- Obecne „nowe od ostatniej wizyty" w dzienniku (podświetlenia wpisów) zostaje bez zmian.

Bez ustawień włączania/wyłączania — zgodnie z decyzją.

## Część 2 — powiadomienia e-mail

E-mail wychodzi od razu po zdarzeniu, do osób, które mają włączone dane powiadomienie i podany adres.

Ustawienia użytkownika (ekran Ustawienia):
- główny przełącznik „Powiadomienia e-mail" (dziś ukryty — wraca jako widoczny),
- pod nim cztery przełączniki rodzajów (wydarzenia, komentarze, zalecenia, zaproszenia i dostęp), nieaktywne gdy główny jest wyłączony.

Preferencje trafiają do profilu (cztery nowe pola obok istniejącego `email_notifications`), domyślnie włączone.

### Adres kontaktowy (logowanie przez Apple i „ukryj mój e-mail")

Tak — użytkownik powinien mieć możliwość podania własnego adresu. Dziś w Ustawieniach jest już pole „E-mail", zapisywane w profilu; to jest adres kontaktowy do powiadomień i on będzie używany przy wysyłce. Adres logowania (ten z Apple, także `…@privaterelay.appleid.com`) pozostaje osobny i niezmieniony — tak ma być, bo na nim opiera się logowanie.

Dopracowanie w ramach tego zadania:
- pole nazywamy jasno „Adres do powiadomień", z podpowiedzią, że nie zmienia sposobu logowania,
- gdy adres jest pusty lub jest to adres przekazujący Apple, a powiadomienia e-mail są włączone, pokazujemy krótką prośbę o podanie własnego adresu (Apple przekazuje pocztę dalej, ale tylko dopóki użytkownik tego nie wyłączy),
- adres walidujemy i zapisujemy tylko poprawny.

Zmiana hasła: to osobna sprawa od powiadomień i nie każdy ma hasło — osoby zalogowane przez Apple lub Google konta z hasłem nie mają. Proponuję zostawić poza tym zadaniem i zrobić jako kolejny krok: w Ustawieniach sekcja „Logowanie" z ustawieniem/zmianą hasła (wysyłka linku na adres logowania, bo tylko on jest potwierdzony) oraz informacją, przez co użytkownik się loguje. Jeśli wolisz, dołożę to do tego samego zakresu.

Droga wysyłki: baza po utworzeniu powiadomienia woła wewnętrzny adres aplikacji (chroniony sekretem), a ten renderuje szablon i wysyła go przez wbudowaną obsługę e-maili Lovable. Szablony (React Email, styl Psiennika): nowe wydarzenie, nowy komentarz, nowe zalecenie, zmiana dostępu — każdy z imieniem psa, autorem, fragmentem treści i przyciskiem prowadzącym prosto do wpisu.

Zabezpieczenia: klucz idempotencji na powiadomienie (retry nie dubluje maila), brak maila gdy odbiorca sam wywołał zdarzenie, wypisanie się i odbicia obsługuje platforma.

## Szczegóły techniczne

- Migracja: tabela `public.notifications` (`user_id`, `dog_id`, `entry_id`, `kind`, `actor_id`, `title`, `body`, `created_at`, `read_at`), GRANT dla `authenticated`/`service_role`, RLS: SELECT i UPDATE (tylko `read_at`) dla `user_id = auth.uid()`, INSERT wyłącznie przez funkcje `security definer` w schemacie `private`.
- Funkcja `private.notify_dog_audience(dog_id, actor, kind, ...)` wstawia wiersze dla wszystkich z `dog_access` + właściciela, pomijając aktora. Wywoływana z triggerów AFTER INSERT na `entries` i `entry_comments`, AFTER UPDATE na `entries` (pojawienie się `behaviorist_comment`) oraz z `private.redeem_dog_invite_impl` i `complete_behavioral_process`; odebranie dostępu — trigger na DELETE z `dog_access`.
- Profil: kolumny `notify_entries`, `notify_comments`, `notify_recommendations`, `notify_access` (boolean, default true); `guard_profile_plan` bez zmian.
- E-mail: `email_domain--scaffold_transactional_email_templates`, cztery szablony w `src/lib/email-templates/`, trasa `src/routes/api/public/notifications/send.ts` weryfikująca nagłówek z sekretem (nowy `NOTIFY_WEBHOOK_SECRET`), pobierająca powiadomienie kluczem serwisowym, sprawdzająca preferencje i wołająca `sendTemplateEmail` z `idempotencyKey` = id powiadomienia. Trigger `AFTER INSERT` na `notifications` woła tę trasę przez `pg_net` (asynchronicznie, bez blokowania zapisu).
- Front: `src/lib/notifications.ts` — nowe `useNotifications`, `useUnreadCount`, `useMarkRead`, `useMarkAllRead`; `src/components/app-header.tsx` — lista zdarzeń w dzwonku; `src/routes/_authenticated/profil.tsx` — sekcja przełączników.
- Testy: skrypt bazodanowy (kto dostaje wiersze w każdej roli i statusie współpracy, brak samopowiadomień, RLS na cudze wiersze), Playwright (dzwonek: badge, lista, przejście, oznaczanie), test wysyłki na koncie kontrolnym + podgląd logów e-mail. Dane testowe usuwane po testach.

## Etapy

1. Migracja bazy (tabela, RLS, funkcje i triggery) + testy bazodanowe.
2. Dzwonek i lista powiadomień w aplikacji + testy w przeglądarce.
3. Preferencje e-mail w Ustawieniach.
4. Szablony e-mail, trasa wysyłki i podpięcie `pg_net` + test wysyłki.

Publikacji nie wykonuję.
