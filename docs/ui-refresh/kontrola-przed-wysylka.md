# Kontrola przed wysyłką do GitHub — 19.09.2026

> Raport historyczny: opisuje stan sprzed usunięcia zależności od nowej funkcji Supabase. Ten warunek został następnie usunięty lokalnie. Bieżące wyniki i zakres zawiera [aktualny odbiór zgodności](zgodnosc-z-lovable.md). Poniższe hashe patcha i wyniki odnoszą się do wcześniejszego stanu.

Stan sprawdzony ponownie o 12:00 CEST. Audyt nie zmienił implementacji, indeksu roboczego ani historii gałęzi. Nie wykonano commita, push, merge, publikacji ani zapisu do zdalnej bazy.

**Wynik: zgodność z aktualnym `main` potwierdzona. Instalacja i build zgodne z obecną konfiguracją Lovable. Cały pakiet nie ma jeszcze potwierdzonej gotowości do wydania, ponieważ odczyt współpracy w profilu wymaga nowej funkcji Supabase.**

## 1. Punkt startowy i konflikty

Repozytorium: `pixels4users/psiennik`. Gałąź: `codex/psiennik-ui-refresh`.

| Sprawdzenie | Wynik |
| --- | --- |
| Pobranie `origin/main` przed rozpoczęciem pracy | Reflog: 18.09.2026, 17:33:39 CEST |
| Utworzenie gałęzi roboczej | Reflog: 18.09.2026, 17:34:14 CEST, bezpośrednio z `origin/main` |
| Commit bazowy | `01f73b6c7b97fc1ab342042fc6fb26502467530a` |
| Aktualny `origin/main` po ponownym `git fetch origin --prune` | Ten sam commit |
| `git rev-list --left-right --count HEAD...origin/main` | `0 0` |
| Najnowszy commit projektu Lovable, odczyt przez konektor | Ten sam commit; projekt `ready`, brak błędu, agent zakończył pracę |
| Otwarte PR-y w repozytorium, wyszukiwanie przez konektor GitHub | Brak wyników |
| Nałożenie pełnego patcha implementacji na pobrany `origin/main` | PASS: `git apply --cached --check --whitespace=error`, osobny tymczasowy indeks |
| `git diff --check` | PASS |

Lokalna gałąź `main` jest starsza, ale nie była punktem startowym tych zmian. Gałąź odświeżenia powstała z aktualnego wtedy `origin/main`, 35 sekund po fetchu. Zmiany odświeżenia nadal są niecommitowane.

Sprawdzony patch obejmuje zmodyfikowane pliki śledzone oraz 10 nowych plików kodu, testów, podglądu i migracji. Jego SHA-256: `c345b7e9f534e2a104cc5fb6f350990a4c6d3406385d662a73101ccd97425cf2`.

Nie zmieniano aktywnej gałęzi w Lovable. Konektor potwierdza commit projektu, ale nie zwraca nazwy śledzonej gałęzi. Panel w przeglądarce wymagał zalogowania, więc ustawienia gałęzi nie zostały osobno odczytane. Przed późniejszym merge należy ponowić fetch i potwierdzić, że Lovable śledzi `main`.

## 2. Instalacja, build i uruchomienie

Test wykonano w osobnym katalogu tymczasowym: 238 plików aplikacji i testów, bez istniejącego `node_modules`, bez kopiowania `.env` i bez prywatnych materiałów. Build otrzymał wyłącznie zastępcze wartości Supabase z domeną `.invalid`; test nie łączył się z produkcyjną bazą.

| Sprawdzenie | Wynik |
| --- | --- |
| Bun 1.3.6: `bun install --frozen-lockfile` | PASS; 462 pakiety; `bun.lock` pozostał identyczny |
| `bun run build` | PASS: klient, SSR i wynik Nitro `cloudflare-module` |
| TypeScript: `tsc --noEmit` | PASS |
| `bun run test:ui` | 6/6 PASS, w tym wybór psa dostępnego dla konta, brak dostępu do zapamiętanego psa, brak localStorage i SSR |
| Lokalny Worker: Wrangler 4.135.0, `dev --local` z wygenerowanym plikiem konfiguracji | Uruchomiony poprawnie |
| HTML strony głównej i przejście do logowania w buildzie Workera | PASS; warstwa obrazów Lovable nie jest odtwarzana przez lokalny Worker |
| Wejście do `/profil` bez sesji | Przekierowanie do `/auth`; dodatkowa uwaga o hydratacji poniżej |
| Wyszukanie lokalnego API, kont i tokenów testowych w wynikowym kliencie | Brak trafień |
| `SUPABASE_SERVICE_ROLE_KEY` w wynikowym kliencie | Brak trafień |
| Porównanie manifestu źródeł po audycie | Implementacja pozostała identyczna |

`vite.config.ts`, konfiguracja TanStack/Lovable, serwer SSR, integracja logowania, broker sesji podglądu i dotychczasowe zmienne środowiskowe pozostają bez zmian. Nowa zależność `motion@13.4.0` deklaruje zgodność z React 18/19; instalacja używa React 19.2.8. Lokalny serwer danych przykładowych uruchamia się wyłącznie przez osobny skrypt `dev:ui-review` i nie trafia do builda aplikacji.

Lovable używa Bun i pliku blokady zależności. [Dokumentacja pakietów npm](https://docs.lovable.dev/tips-tricks/npm-packages). Wygenerowany build Cloudflare sprawdzono przez Wrangler, zgodnie z [dokumentacją Nitro](https://nitro.build/deploy/providers/cloudflare).

## 3. Warunek przed wydaniem: baza

`src/lib/access.ts:198` bezwarunkowo wywołuje `get_collaboration_profiles()` przy pobieraniu niepustej listy współpracy, zarówno dla właściciela, jak i behawiorysty. Przy braku tej funkcji pobieranie listy zakończy się błędem. Sam działający build tego nie wykryje.

Funkcję definiuje lokalna migracja `supabase/migrations/20260919113000_collaboration_profile_names.sql`. Nie została przez nas zastosowana zdalnie. Próba odczytu metadanych bazy przez konektor Lovable została odrzucona: operacja SQL wymaga zakresu `projects:write`, którego połączenie nie posiada. Nie zmieniano uprawnień połączenia ani bazy. Istnienia funkcji i bieżących polityk w zdalnej bazie nie potwierdzono.

Istniejąca w repozytorium reguła `profiles_select_self_or_shared` już pozwala odczytać profil osoby ze wspólnym psem. Nowa migracja rozszerza odczyt na powiązanie kodem przed pojawieniem się wspólnego psa. Nie jest potrzebna do samego przycisku wpisania kodu ani do odczytu nazwy osoby ze wspólnym psem. Obecna implementacja profilu mimo to uzależnia cały odczyt od nowej funkcji.

Przed wysyłką należy usunąć tę obowiązkową zależność, korzystając z istniejącego odczytu profili, albo osobno zaakceptować, zastosować i zweryfikować migrację na właściwym Supabase. Dla samego odświeżenia UI rekomendowane jest zachowanie zgodności z istniejącą bazą. Testy SQL z poprzedniego odbioru były izolowane i nie stanowią potwierdzenia wdrożenia — szczegóły w [odbiorze profilu](profil-zaproszenia.md).

## 4. Pozostałe ustalenia

- **Hydratacja:** sekwencja strona główna → logowanie → bezpośrednie wejście do `/profil` bez sesji zgłosiła React #418. Ten sam scenariusz odtworzono na osobno zbudowanym, niezmienionym `origin/main`; wystąpił ten sam błąd. Świeże wejście do profilu w nowej karcie nie zgłosiło go w obu wersjach. Przekierowanie działa. To istniejący problem do osobnego dopracowania, a nie dowód regresji odświeżenia. [Znaczenie błędu w dokumentacji React](https://react.dev/errors/418).
- **Podgląd produkcyjny:** zwykły `vite preview` szuka `dist/server/server.js`, podczas gdy obecny preset generuje `.output/server/index.mjs`. W tej konfiguracji sprawdzono aplikację przez lokalny Wrangler. Skryptu ani presetu nie zmieniano w odświeżeniu.
- **Obrazy Lovable:** lokalny Worker zwraca 404 dla ścieżek `/__l5e/assets-v1/...`, ponieważ ten test nie odtwarza obsługi zasobów platformy Lovable. Istniejące manifesty `src/assets/*.asset.json` pozostają bez zmian. Test Workera potwierdza uruchomienie kodu i nawigację, a poprawne ładowanie tych obrazów trzeba potwierdzić także w docelowym podglądzie Lovable.
- **Lint:** sprawdzono 32 zmienione lub nowe pliki TS/TSX. Jedyny plik z błędami to generowany `src/integrations/supabase/types.ts`: 403 zgłoszenia formatowania, wobec 397 na `main` — sześć dodatkowych dotyczy średników w nowym typie RPC. Dwa ostrzeżenia Fast Refresh w komponentach istniały także na `main`. Nie należy opisywać tego jako pełnego zielonego linta; kompilacja i TypeScript przechodzą.
- **Ostrzeżenia builda:** dotychczasowe `inputValidator()` w `role.functions.ts`, informacja o natywnej obsłudze ścieżek w Vite oraz ostrzeżenie bundlera o `inlineDynamicImports`. Nie zatrzymały builda.
- **Zakres testów:** aktualny audyt nie obejmował zapisu na rzeczywistych kontach, produkcyjnego logowania, rzeczywistych zaproszeń ani przesyłania plików. Odbiory UI korzystały z lokalnych danych przykładowych. Nowego kodu nie ma jeszcze w środowisku Lovable, więc jego końcowy odbiór w tym środowisku pozostaje późniejszym krokiem.

## 5. Dalsza kolejność

1. Uporządkować zależność profilu od bazy i powtórzyć test dla obu ról na uzgodnionym backendzie.
2. Po akceptacji lokalnej wykonać ponowny fetch. Przy ewentualnej zmianie `main` rozwiązać konflikty lokalnie i ponowić wymagane sprawdzenia.
3. Przygotować commit i PR z kompletem nowych plików. Nie dodawać zbiorczo istniejących prywatnych katalogów `Zasoby i instrukcje/` i `docs/plany/` ani wyników builda.
4. Po akceptacji PR wykonać merge bez przepisywania opublikowanej historii. Potwierdzić commit oraz podgląd w Lovable. Lovable ma pobrać kod, bez ponownej implementacji. [Zasady synchronizacji GitHub](https://docs.lovable.dev/integrations/github).
5. Użytkownik wykonuje Publish po odbiorze. Publikacja jest osobnym krokiem od synchronizacji kodu. [Dokumentacja publikacji](https://docs.lovable.dev/features/publish).
