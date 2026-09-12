# Zmiana nazwy zakładki „Lista” → „Dziennik”

## Cel
W widoku pojedynczego psa zmienić etykietę zakładki z „Lista” na „Dziennik” i ujednolicić powiązane teksty oraz wewnętrzne nazewnictwo aktywnego stanu.

## Zakres
1. `src/components/dog-nav.tsx`
   - Typ `active`: wartość `"lista"` → `"dziennik"`.
   - Warunek stylu aktywnej zakładki: `active === "dziennik"`.
   - Etykieta linku: `Lista` → `Dziennik`.
2. `src/routes/_authenticated/pies.$id.index.tsx`
   - Prop `<DogNav active="lista" />` → `<DogNav active="dziennik" />`.
   - Meta `description` i `og:description`: `Lista wydarzeń` → `Dziennik wydarzeń`.
   - Tytuł pozostaje „Dziennik wydarzeń — Psiennik” (już aktualny).
3. Inne wystąpienia:
   - `src/routes/_authenticated/psy.tsx` zawiera frazę „Lista psów” na stronie listy wszystkich psów — pozostawiamy bez zmian, bo dotyczy innego widoku.
   - Komentarze w `src/lib/access.ts` („Lista behawiorystów…”, „Lista właścicieli…”) to opisy JSDoc, nie widoczne dla użytkownika — pozostawiamy bez zmian.

## Weryfikacja
- `rg -n -i "\\bLista\\b" src` — upewnić się, że w widoku psa nie zostało żadne wystąpienie „Lista”.
- Typecheck i build.
- Playwright: otworzyć stronę psa i sprawdzić, czy zakładka wyświetla się jako „Dziennik” i jest podświetlona.
