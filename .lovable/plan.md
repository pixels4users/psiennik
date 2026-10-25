# Czytelny ekran logowania i rejestracji

## Nowy układ

Na górze karty dwie zakładki: **Logowanie** | **Rejestracja**. Domyślnie Logowanie; Rejestracja, gdy ktoś przychodzi z przycisku „Jestem behawiorystą” albo z wyborem roli.

**Logowanie** (bez wyboru roli):
- Kontynuuj z Google / Kontynuuj z Apple
- separator „albo e-mailem”
- E-mail, Hasło, „Zaloguj się”

**Rejestracja** (rola zawsze na początku):
- „Zakładam konto jako”: Właściciel psa / Behawiorysta
- Kontynuuj z Google / Kontynuuj z Apple — z wybraną rolą
- separator „albo e-mailem”
- Imię, E-mail, Hasło, informacja o Regulaminie, „Załóż konto”

Informacja o Regulaminie pojawia się tylko w Rejestracji. Baner zaproszenia i ekran „Potwierdź adres e-mail” zostają bez zmian.

## Logika

- Google/Apple w Logowaniu nie zmieniają roli (istniejące konto zostaje takie, jakie było; nowe konto dostaje rolę właściciela).
- Google/Apple w Rejestracji przekazują wybraną rolę; rolę behawiorysty dostaje tylko nowe konto bez psów — tak jak dziś na serwerze.
- Bez zmian w bazie i uprawnieniach.

## Kontrola

Sprawdzenie obu zakładek na komputerze i telefonie, przejście z linku „Jestem behawiorystą” od razu do Rejestracji z zaznaczonym behawiorystą.

## Szczegóły techniczne

- Tylko `src/routes/auth.tsx`: `Tabs` obejmuje całą zawartość karty; przyciski OAuth renderowane w obu `TabsContent` — w loginie `oauth(provider)` bez roli (czyści pending role), w rejestracji `oauth(provider, role)`.
- `LegalNotice` tylko w zakładce rejestracji.
