# Audyt prywatności i informacji prawnych — Psiennik

Tylko ustalenia i propozycje. Żadnych zmian w kodzie, bazie ani w opublikowanej aplikacji.
Nie jestem prawnikiem — poniższe to analiza techniczna plus mapa wymagań do potwierdzenia z prawnikiem.

## 1. Co potwierdziłem w kodzie i konfiguracji

**Dane zbierane**
- Rejestracja e-mailem: adres e-mail, hasło (po stronie usługi uwierzytelniania), imię/nazwa wyświetlana (`src/routes/auth.tsx`, pole „Imię" → `display_name`).
- Google/Apple: logowanie idzie przez brokera Lovable (`src/integrations/lovable/index.ts`), do bazy trafia e-mail i dane profilu z konta dostawcy. Dokładny zakres pól zależy od konfiguracji providerów — do zweryfikowania w ustawieniach logowania.
- Profil: `profiles` — `display_name`, `email`, `email_notifications`, `plan_type`, `max_active_dogs`.
- Treści: `dogs` (imię, wiek, rasa, płeć, zdjęcie), `entries` (data, tytuł, opis, typy, pory, ocena, `behaviorist_comment`), `dog_access`, `dog_invites`, `owner_behaviorists`, `behaviorist_links`, `dog_views`.
- Zdjęcia: bucket `dog-photos` — **prywatny**, dostęp przez podpisane linki ważne 1 h (`src/lib/dogs.ts`).

**Cookies / localStorage / skrypty zewnętrzne**
- Brak analityki, brak pikseli, brak banera — nic w kodzie (`rg` po gtag/GA/posthog/plausible: 0 trafień).
- `localStorage`: token sesji logowania — technicznie niezbędny do działania usługi.
- Jedyny zewnętrzny zasób: **Google Fonts** ładowane z `fonts.googleapis.com` / `fonts.gstatic.com` (`src/routes/__root.tsx`). To przekazuje adres IP użytkownika do Google przy każdym wejściu — bez zgody jest to sporne (znane orzeczenie LG München I, 3 O 17493/20).
- Brak stopki i jakichkolwiek dokumentów prawnych w aplikacji (przeszukałem cały `src` — zero wystąpień „Regulamin"/„Polityka").

**Infrastruktura i odbiorcy**
- Lovable Cloud (baza zarządzana przez Lovable), plan **Pro**. Region bazy: **AWS eu-west-1 (Irlandia)** — potwierdzone w danych połączenia.
- Odbiorcy/podmioty przetwarzające: Lovable (platforma i hosting), Supabase/AWS jako infrastruktura, Google i Apple przy logowaniu, Google Fonts przy każdym wejściu, dostawca wysyłki e-maili potwierdzających z systemu logowania.
- DPA Lovable: [3](https://lovable.dev/data-processing-agreement) deklaruje DPA dla planów Business/Enterprise — **na planie Pro trzeba potwierdzić, czy DPA Cię obejmuje**. Lista podprocesorów: [1](https://lovable.dev/subprocessors), polityka: [5](https://lovable.dev/privacy).
- Budowanie aplikacji przez AI to osobne przetwarzanie (Twoje prompty i kod) niż dane użytkowników działającej aplikacji — treści dzienników nie są wysyłane do modeli AI przez żaden kod w projekcie.

**Korekta Twojego założenia — ważne**
Nie jest prawdą, że masz dostęp tylko do e-maili. Zasady RLS chronią użytkowników **przed sobą nawzajem**, nie przed operatorem. Przez panel bazy i uprawnienia serwerowe masz techniczny dostęp do wszystkich wpisów i zdjęć (zweryfikowałem to, wykonując zapytania do schematu i polityk). Polityka prywatności musi to uczciwie odzwierciedlać: „dostęp administracyjny ograniczony do niezbędnych przypadków", a nie „nie mamy dostępu".

**Dostęp i cykl życia danych (potwierdzone)**
- RLS włączone na wszystkich tabelach aplikacji; zdjęcia tylko dla osób z `dog_access`, zapis tylko dla zarządzających psem.
- Odebranie dostępu = usunięcie wiersza z `dog_access`; historyczne zalecenia behawiorysty zostają przy wpisach (autor traci wgląd).
- Usunięcie wpisu = trwałe usunięcie wiersza, bez kosza.
- **Brak funkcji usunięcia konta** — ani w `/profil`, ani nigdzie indziej. To luka wobec prawa do usunięcia danych.
- Nie mogę zweryfikować: retencji logów platformy, harmonogramu i okresu kopii zapasowych, czasu usunięcia danych z backupów, zakresu danych w logach dostawcy. To trzeba potwierdzić u Lovable/Supabase.

## 2. Niewiadome — pytania do Ciebie

1. **E-mail kontaktowy** do spraw prywatności i reklamacji (obowiązkowy, nie wymyślę go).
2. Czy chcesz, żeby operatorem był **Pixels4Users** z podanym adresem jako adresem do korespondencji (jest to adres mieszkania — będzie publiczny w regulaminie)?
3. Czy dopuszczasz **samodzielne hostowanie fontów** zamiast Google Fonts (usuwa jedyny sporny transfer i pozwala zostać bez banera cookies)?
4. Czy użytkownicy to konsumenci, czy także behawioryści jako firmy (wpływa na zapisy o odstąpieniu i reklamacjach)?
5. Wiek: czy dopuszczasz konta osób poniżej 16 lat? Rekomendacja: zapis „usługa tylko dla osób 16+".
6. Płatne konta — patrz etap B: model (jednorazowo / miesięcznie / rocznie), odnawianie, okres próbny, zakres planu.
7. Czy chcesz mieć w bazie **rejestr akceptacji regulaminu** (wersja + data + sposób), czy wystarczy archiwum wersji dokumentów?

## 3. Kwestia → status → propozycja

| Kwestia | Status | Propozycja |
|---|---|---|
| Polityka prywatności + obowiązek informacyjny (art. 13 RODO) | Wymagane | Strona `/prywatnosc`, link w stopce i przy rejestracji |
| Regulamin świadczenia usług drogą elektroniczną | Wymagane (uśude art. 8) | Strona `/regulamin`, akceptacja przez zawarcie umowy |
| Dane operatora i kontakt | Wymagane | Nazwa, adres, NIP, REGON, e-mail — w stopce i w dokumentach |
| Baner zgód na cookies | **Warunkowo — dziś niepotrzebny** | Tylko token sesji = wyjątek „niezbędne". Sekcja o cookies w polityce zamiast banera |
| Google Fonts | Rekomendowane do zmiany | Hostować fonty lokalnie; inaczej wymienić Google jako odbiorcę i rozważyć zgodę |
| Usunięcie konta i danych | Wymagane (art. 17 RODO) | Funkcja „Usuń konto" w `/profil` z potwierdzeniem i opisem skutków dla współdzielonych psów |
| Eksport danych | Wymagane na żądanie (art. 20) | Etap A: obsługa mailowa opisana w polityce; później przycisk eksportu |
| Deklaracja „nie mamy dostępu do dzienników" | Do korekty | Opisać dostęp administracyjny zgodnie ze stanem faktycznym |
| Retencja i backupy | Wymagane do opisania | Najpierw uzyskać dane od Lovable; nie wpisywać zmyślonych okresów |
| DPA z Lovable | Do potwierdzenia | Zapytać, czy plan Pro obejmuje DPA; zachować kopię |
| Rejestr czynności przetwarzania (art. 30) | Rekomendowane | Prosty dokument poza aplikacją |
| Powiadomienia e-mail (przełącznik w profilu) | Warunkowo | Transakcyjne — bez zgody; marketingowe wymagałyby osobnej zgody. Dziś marketingu nie ma |
| Zdjęcia i opisy mogące zawierać dane ludzi | Wymagane do opisania | Zapis w regulaminie: nie publikuj danych osób trzecich bez podstawy |

## 4. Tekst przy rejestracji i stopka

Wzorzec bez checkboxa jest **prawidłowy** dla akceptacji umowy i obowiązku informacyjnego — RODO nie wymaga zgody tam, gdzie podstawą jest wykonanie umowy. Musi być widoczny **przed** przyciskiem i nie ukryty.

Pod przyciskami rejestracji oraz pod przyciskami Google/Apple (bo one też tworzą konto):

> Zakładając konto, akceptujesz [Regulamin](/regulamin) Psiennika. Informacje o przetwarzaniu danych znajdziesz w [Polityce prywatności](/prywatnosc).

Przy logowaniu istniejącego użytkownika tej informacji nie pokazujemy.

Stopka (publiczna strona główna i ekrany po zalogowaniu):
`Psiennik — Miłosz Michałowski-Żuk Pixels4Users, Kościelna 4 m. 5, 91-437 Łódź · NIP 7262448188 · REGON 382918503 · kontakt: [e-mail do uzupełnienia] · Regulamin · Polityka prywatności`

Zapis akceptacji — proporcjonalnie: kolumny `terms_version` i `terms_accepted_at` w `profiles`, ustawiane przy pierwszym zalogowaniu, plus wersjonowane pliki dokumentów w repozytorium.

## 5. Etap A — wdrożenie dla obecnej wersji (po Twojej akceptacji)

1. Treści dokumentów w plikach źródłowych + trasy publiczne `/regulamin` i `/prywatnosc`, z `noindex` wyłączonym (mają być indeksowane).
2. Stopka w układzie głównym z danymi operatora i linkami.
3. Notka przy rejestracji (e-mail oraz Google/Apple), bez checkboxa.
4. Funkcja „Usuń konto" w `/profil` — usunięcie profilu, psów, wpisów i zdjęć; decyzja co ze psami współdzielonymi.
5. Zapis wersji regulaminu w profilu.
6. Fonty hostowane lokalnie (jeśli zaakceptujesz).
7. Sekcja „Cookies i pamięć przeglądarki" w polityce — bez banera.

## 6. Etap B — przed uruchomieniem płatnych kont

Decyzje do podjęcia, zanim cokolwiek wdrożymy: model płatności i cykl, odnawianie automatyczne i jego anulowanie, okres próbny, zakres planu bezpłatnego vs płatnego, cena brutto i status VAT.

Do przygotowania: informacja przedumowna i przycisk „Zamawiam z obowiązkiem zapłaty", potwierdzenie umowy na trwałym nośniku, zasady odstąpienia (14 dni; utrata prawa tylko przy wyraźnym żądaniu natychmiastowego rozpoczęcia i przyjęciu tego do wiadomości), zgodność usługi cyfrowej z umową i reklamacje, obsługa nieudanych płatności, dostęp do dzienników po wygaśnięciu planu (rekomendacja: tryb tylko do odczytu, nigdy usunięcie danych), aktualizacja polityki o Stripe jako podmiot przetwarzający dane płatnicze i o dane rozliczeniowe, powiadomienie obecnych użytkowników e-mailem z wyprzedzeniem.

Zasady stałe: Stripe pozostaje operatorem płatności, sprzedawcą jest Pixels4Users; obecne darmowe konta nie mogą zostać automatycznie obciążone; rejestracja pozostaje bez checkboxa, a zamówienie płatnej usługi to osobne, świadome oświadczenie.

Źródła: RODO — [eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX%3A32016R0679), ustawa o świadczeniu usług drogą elektroniczną, ustawa o prawach konsumenta (w tym przepisy o usługach cyfrowych), Prawo komunikacji elektronicznej (cookies — [3](https://sip.lex.pl/akty-prawne/dzu-dziennik-ustaw/prawo-komunikacji-elektronicznej-22035493/art-398)), dokumenty Lovable: [1](https://lovable.dev/subprocessors), [3](https://lovable.dev/data-processing-agreement), [5](https://lovable.dev/privacy).
