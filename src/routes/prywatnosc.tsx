import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_UPDATED, LEGAL_VERSIONS, MINIMUM_AGE, OPERATOR, contactEmailLabel } from "@/lib/legal";
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
            <a className="underline" href={`mailto:${OPERATOR.email}`}>
              {contactEmailLabel()}
            </a>
            .
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
            <li>
              <strong>Rejestr czynności dotyczących dokumentów:</strong> techniczny identyfikator
              konta, rodzaj dokumentu, wersja pokazana użytkownikowi, czas zapisany przez nasz
              serwer i sposób wykonania czynności.
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
            Baza danych aplikacji działa na serwerach w Unii Europejskiej (Irlandia). Szczegóły
            umowy powierzenia, podprocesorów, retencji kopii zapasowych i logów ustalamy z Lovable —
            do czasu ich potwierdzenia nie deklarujemy ich w tej polityce.
          </p>
          <p className="mt-3 text-muted-foreground">
            Przy logowaniu Google lub Apple dane uwierzytelniające przetwarzają ci dostawcy zgodnie
            z własnymi zasadami. Korespondencję kontaktową, reklamacje i zgłoszenia dotyczące
            prywatności obsługujemy przez skrzynkę w Google Workspace.
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
          <p className="mt-3 text-muted-foreground">
            Pobieranie krojów pisma nie powoduje połączenia z serwerami Google — fonty serwujemy z
            własnego serwera na podstawie licencji SIL Open Font License.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Jak długo przechowujemy dane</h2>
          <ul className="mt-3 grid gap-2 text-muted-foreground">
            <li>
              <strong>Konto i treści dziennika:</strong> do czasu usunięcia konta przez użytkownika.
              Usunięcie z aplikacji kasuje profil, psy, których jesteś głównym właścicielem, ich
              wpisy oraz zdjęcia.
            </li>
            <li>
              <strong>Zalecenia behawiorysty:</strong> treść pozostaje przy wpisie właściciela
              (jego dokumentacja), ale po usunięciu konta behawiorysty zrywamy powiązanie z jego
              kontem i pokazujemy „Behawiorysta — konto usunięte". Treść może zawierać dane
              osobowe, więc możesz zgłosić żądanie jej usunięcia lub zmiany na{" "}
              <a className="underline" href={`mailto:${OPERATOR.email}`}>
                {contactEmailLabel()}
              </a>
              .
            </li>
            <li>
              <strong>Kopie zapasowe i logi techniczne:</strong> prowadzą nasi dostawcy
              infrastruktury. Dane usunięte z aplikacji mogą pozostawać w ich kopiach do czasu rotacji
              — szczegóły retencji podamy po potwierdzeniu przez Lovable.
            </li>
            <li>
              <strong>Rejestr czynności dotyczących dokumentów:</strong> dowody akceptacji
              regulaminu przechowujemy przez czas trwania umowy o prowadzenie konta, a po jej
              zakończeniu do końca szóstego roku kalendarzowego liczonego od roku zakończenia
              umowy. Usuwamy je wcześniej, jeżeli przestaną być potrzebne. Jeżeli toczy się
              konkretna sprawa sporna, zachowujemy wyłącznie dowody potrzebne w tej sprawie i
              wyłącznie do czasu jej zakończenia i rozliczenia. To nasza wewnętrzna zasada dowodowa,
              a nie termin nakazany przepisami o ochronie danych. Zapisy o samym powiadomieniu o
              zmianie dokumentu przechowujemy według rodzaju powiadomienia — okres ustalamy razem z
              wprowadzeniem danego powiadomienia, a zakończenie umowy nigdy go nie przedłuża.
            </li>
            <li>
              <strong>Konta nieużywane:</strong> nie kasujemy ich automatycznie, ale co roku
              przeglądamy zasadność dalszego przechowywania. Po 24 miesiącach bezczynności możemy
              wysłać przypomnienie, a następnie podjąć decyzję o usunięciu lub pozostawieniu konta.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Rejestr czynności dotyczących dokumentów</h2>
          <p className="mt-3 text-muted-foreground">
            Zapisujemy dowód akceptacji regulaminu oraz, odrębnie, udostępnienia Ci informacji o
            przetwarzaniu danych. Wpis potwierdza wykonanie konkretnej czynności i udostępnienie
            dokumentu w określonej wersji — nie stanowi potwierdzenia, że dokument został
            przeczytany.
          </p>
          <p className="mt-3 text-muted-foreground">
            Wpis zawiera wyłącznie: techniczny identyfikator konta, rodzaj dokumentu, wersję, która
            została Ci pokazana, czas zapisany przez nasz serwer oraz sposób, w jaki czynność
            nastąpiła (założenie konta, logowanie przez zewnętrznego dostawcę albo ekran z prośbą o
            akceptację zmiany). Nie zapisujemy adresu IP ani danych Twojego urządzenia.
          </p>
          <p className="mt-3 text-muted-foreground">
            Podstawą jest nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO) polegający na
            możliwości wykazania treści zawartej umowy i wykonania obowiązku informacyjnego.
          </p>
          <p className="mt-3 text-muted-foreground">
            Po usunięciu konta w rejestrze nie zostaje Twój adres e-mail ani imię — wyłącznie
            techniczny identyfikator konta. Oznacza to, że wartość dowodowa takiego zapisu jest
            ograniczona: odnalezienie właściwego wpisu na podstawie samego nazwiska lub adresu
            e-mail zwykle nie jest możliwe i wymaga informacji przekazanych przez osobę zgłaszającą.
            Świadomie nie dodajemy w tym celu żadnego dodatkowego powiązania z Twoimi danymi.
          </p>
          <p className="mt-3 text-muted-foreground">
            Możesz w każdej chwili wnieść sprzeciw wobec tego przechowywania, pisząc na{" "}
            <a className="underline" href={`mailto:${OPERATOR.email}`}>
              {contactEmailLabel()}
            </a>
            . Ocenimy zgłoszenie indywidualnie, biorąc pod uwagę Twoją sytuację, i usuniemy wpis,
            jeżeli nie będziemy mieli ważnych prawnie uzasadnionych podstaw do jego zachowania.
          </p>
        </div>



        <div>
          <h2 className="text-2xl text-primary">Twoje prawa</h2>
          <p className="mt-3 text-muted-foreground">
            Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania,
            przenoszenia oraz sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym
            interesie. Konto możesz usunąć samodzielnie w profilu. Kopię swoich danych możesz pobrać
            w profilu (psy, wpisy, zalecenia, zdjęcia) lub uzyskać po zgłoszeniu na{" "}
            <a className="underline" href={`mailto:${OPERATOR.email}`}>
              {contactEmailLabel()}
            </a>
            . Przysługuje Ci też skarga do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2,
            00-193 Warszawa).
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Dostęp do danych i eksport</h2>
          <p className="mt-3 text-muted-foreground">
            Możesz poprosić o dostęp do swoich danych oraz ich kopię w formacie czytelnym dla
            człowieka i maszyny. Eksport z profilu obejmuje psy, wpisy i zalecenia w pliku tekstowym
            oraz zdjęcia w oryginalnych formatach. Żądanie możesz złożyć również mailowo; rozpatrujemy
            je w terminie 30 dni.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Zmiany polityki</h2>
          <p className="mt-3 text-muted-foreground">
            O istotnych zmianach poinformujemy w aplikacji lub e-mailem. Aktualna wersja jest zawsze
            dostępna na tej stronie.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Archiwum wersji</h2>
          <ul className="mt-3 grid gap-2 text-muted-foreground">
            {LEGAL_VERSIONS.filter((v) => v.kind === "privacy").map((v) => (
              <li key={v.version}>
                Wersja {v.version} z {v.date}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
