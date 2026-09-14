import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_UPDATED, OPERATOR, contactEmailLabel } from "@/lib/legal";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/prywatnosc")({
  head: () => ({
    meta: socialMeta({
      title: "Polityka prywatności — Psiennik",
      description:
        "Jakie dane zbiera Psiennik, kto ma do nich dostęp, jak długo je przechowujemy i jakie masz prawa.",
      path: "/prywatnosc",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: "https://psiennik.pl/prywatnosc" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-4xl text-primary">Polityka prywatności</h1>
      <p className="mt-2 text-sm text-muted-foreground">Wersja z {LEGAL_UPDATED}.</p>

      <section className="mt-10 grid gap-8 text-base leading-relaxed text-foreground">
        <div>
          <h2 className="text-2xl text-primary">Administrator danych</h2>
          <p className="mt-3 text-muted-foreground">
            Administratorem Twoich danych jest {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city},
            NIP {OPERATOR.nip}, REGON {OPERATOR.regon}. Kontakt w sprawach danych:{" "}
            {contactEmailLabel()}.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Jakie dane zbieramy</h2>
          <ul className="mt-3 grid gap-2 text-muted-foreground">
            <li>
              <strong>Konto:</strong> adres e-mail, hasło w postaci zaszyfrowanej, nazwa
              wyświetlana. Przy logowaniu Google lub Apple otrzymujemy adres e-mail oraz imię lub
              nazwę z Twojego konta u tego dostawcy — nie mamy dostępu do Twojego hasła.
            </li>
            <li>
              <strong>Treści dziennika:</strong> dane psa (imię, wiek, rasa, płeć, zdjęcie), wpisy
              (data, tytuł, opis, typ wydarzenia, pora dnia, ocena) oraz zalecenia behawiorysty.
            </li>
            <li>
              <strong>Współpraca:</strong> zaproszenia kodem, powiązania właściciel–behawiorysta,
              informacja o ostatnim otwarciu dziennika (do oznaczania nowości).
            </li>
            <li>
              <strong>Ustawienia:</strong> preferencja powiadomień e-mail, informacja o akceptacji
              regulaminu (wersja, data, sposób).
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Dane dotyczące psa nie są same w sobie danymi osobowymi człowieka, ale są powiązane z
            Twoim kontem. Pamiętaj, że w opisach i zdjęciach możesz przypadkowo umieścić informacje
            o ludziach — prosimy tego unikać.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Po co i na jakiej podstawie</h2>
          <ul className="mt-3 grid gap-2 text-muted-foreground">
            <li>
              Prowadzenie konta i udostępnienie funkcji aplikacji — wykonanie umowy (art. 6 ust. 1
              lit. b RODO).
            </li>
            <li>
              Wiadomości niezbędne do działania usługi (potwierdzenie adresu, reset hasła) —
              wykonanie umowy.
            </li>
            <li>
              Bezpieczeństwo, obsługa zgłoszeń i dochodzenie roszczeń — prawnie uzasadniony interes
              (art. 6 ust. 1 lit. f RODO).
            </li>
            <li>Obowiązki podatkowe i księgowe, gdy wystąpią — obowiązek prawny.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Nie prowadzimy marketingu e-mailowego i nie profilujemy użytkowników.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Kto ma dostęp do danych</h2>
          <p className="mt-3 text-muted-foreground">
            Dziennik psa widzą wyłącznie osoby, którym właściciel nadał dostęp: współwłaściciel i
            zaproszony behawiorysta. Dostęp innych użytkowników jest blokowany na poziomie bazy
            danych.
          </p>
          <p className="mt-3 text-muted-foreground">
            Administrator posiada techniczną możliwość dostępu do danych w bazie, ponieważ
            odpowiada za utrzymanie usługi. Korzystamy z tej możliwości wyłącznie wtedy, gdy jest to
            niezbędne — na przykład przy usuwaniu awarii lub obsłudze zgłoszenia — i nigdy w celu
            przeglądania treści dzienników.
          </p>
          <p className="mt-3 text-muted-foreground">
            Dane powierzamy dostawcom, którzy przetwarzają je na nasze zlecenie: dostawcy platformy
            i hostingu aplikacji (Lovable) oraz infrastruktury bazy danych i przechowywania plików.
            Baza danych aplikacji działa na serwerach w Unii Europejskiej (Irlandia). Przy
            logowaniu Google lub Apple dane uwierzytelniające przetwarzają ci dostawcy zgodnie z
            własnymi zasadami. Strona pobiera też kroje pisma z serwerów Google Fonts, co wiąże się
            z przekazaniem adresu IP przeglądarki do Google.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Cookies i pamięć przeglądarki</h2>
          <p className="mt-3 text-muted-foreground">
            Nie używamy analityki, reklam ani narzędzi śledzących. W pamięci przeglądarki
            przechowujemy wyłącznie token sesji logowania — bez niego nie dałoby się pozostać
            zalogowanym. Jest to element niezbędny do świadczenia usługi na Twoje żądanie, dlatego
            nie prosimy o zgodę na cookies. Sesję usuwa wylogowanie lub wyczyszczenie danych
            przeglądarki.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Jak długo przechowujemy dane</h2>
          <p className="mt-3 text-muted-foreground">
            Dane konta i treści dziennika przechowujemy do czasu usunięcia konta. Usunięcie konta w
            ustawieniach profilu kasuje profil, psy, których jesteś głównym właścicielem, ich wpisy
            oraz zdjęcia. Kopie zapasowe i logi techniczne prowadzą nasi dostawcy infrastruktury i
            dane mogą pozostawać w nich jeszcze przez krótki czas po usunięciu.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Twoje prawa</h2>
          <p className="mt-3 text-muted-foreground">
            Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania,
            przenoszenia oraz sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym
            interesie. Konto możesz usunąć samodzielnie w profilu; kopię swoich danych otrzymasz po
            napisaniu na adres {contactEmailLabel()}. Przysługuje Ci też skarga do Prezesa Urzędu
            Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Zmiany polityki</h2>
          <p className="mt-3 text-muted-foreground">
            O istotnych zmianach poinformujemy w aplikacji lub e-mailem. Aktualna wersja jest zawsze
            dostępna na tej stronie.
          </p>
        </div>
      </section>
    </article>
  );
}
