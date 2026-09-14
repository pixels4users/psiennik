import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_UPDATED, OPERATOR, contactEmailLabel } from "@/lib/legal";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: socialMeta({
      title: "Regulamin — Psiennik",
      description:
        "Zasady korzystania z Psiennika: konto, dostęp dla behawiorysty, treści użytkownika, reklamacje.",
      path: "/regulamin",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: "https://psiennik.pl/regulamin" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-4xl text-primary">Regulamin Psiennika</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wersja z {LEGAL_UPDATED}. Regulamin określa zasady świadczenia usługi drogą elektroniczną.
      </p>

      <section className="prose-psiennik mt-10 grid gap-8 text-base leading-relaxed text-foreground">
        <div>
          <h2 className="text-2xl text-primary">1. Usługodawca</h2>
          <p className="mt-3 text-muted-foreground">
            Usługę Psiennik świadczy {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}, NIP{" "}
            {OPERATOR.nip}, REGON {OPERATOR.regon}. Kontakt w sprawach usługi i reklamacji:{" "}
            {contactEmailLabel()}.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">2. Czym jest Psiennik</h2>
          <p className="mt-3 text-muted-foreground">
            Psiennik to aplikacja internetowa do prowadzenia dziennika zachowania psa i dzielenia
            się nim z zaproszonymi osobami: współwłaścicielem oraz behawiorystą. Usługa polega na
            udostępnieniu narzędzia — nie jest poradą weterynaryjną ani behawioralną. Za treść
            zaleceń odpowiada osoba, która je wpisuje.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">3. Konto</h2>
          <p className="mt-3 text-muted-foreground">
            Do korzystania z aplikacji potrzebne jest konto zakładane adresem e-mail i hasłem albo
            przez logowanie Google lub Apple. Konto jest osobiste; nie udostępniaj danych logowania
            innym osobom. Usługa przeznaczona jest dla osób, które ukończyły 16 lat. Umowa o
            korzystanie z Psiennika zostaje zawarta z chwilą założenia konta i jest bezpłatna w
            obecnym zakresie funkcji.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">4. Wymagania techniczne</h2>
          <p className="mt-3 text-muted-foreground">
            Do korzystania z usługi potrzebne jest urządzenie z dostępem do internetu, aktualna
            przeglądarka internetowa z obsługą JavaScript oraz czynny adres e-mail.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">5. Treści wprowadzane przez użytkownika</h2>
          <p className="mt-3 text-muted-foreground">
            Wpisy, opisy i zdjęcia dodajesz na własną odpowiedzialność. Nie umieszczaj w nich
            danych innych osób ani ich wizerunku, jeżeli nie masz do tego podstawy. Zabronione jest
            wprowadzanie treści bezprawnych. Zachowujesz prawa do swoich treści — udzielasz
            usługodawcy jedynie prawa do ich przechowywania i wyświetlania w zakresie niezbędnym do
            działania usługi.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">6. Udostępnianie dziennika</h2>
          <p className="mt-3 text-muted-foreground">
            Właściciel psa decyduje, kto ma dostęp do dziennika, zapraszając kodem współwłaściciela
            lub behawiorystę. Dostęp można w każdej chwili odebrać w aplikacji. Zalecenia dodane
            wcześniej przez behawiorystę pozostają przy wpisach, do których je dodano.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">7. Reklamacje</h2>
          <p className="mt-3 text-muted-foreground">
            Reklamację zgłoś na adres {contactEmailLabel()}, opisując problem i adres e-mail konta.
            Odpowiedź otrzymasz w terminie 14 dni na adres, z którego wysłano zgłoszenie.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">8. Rozwiązanie umowy</h2>
          <p className="mt-3 text-muted-foreground">
            Możesz w każdej chwili zrezygnować z usługi, usuwając konto w ustawieniach profilu.
            Usunięcie konta kasuje profil, psy, których jesteś głównym właścicielem, ich wpisy i
            zdjęcia. Usługodawca może rozwiązać umowę z zachowaniem 14-dniowego terminu, jeżeli
            użytkownik rażąco narusza regulamin.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">9. Zmiany regulaminu</h2>
          <p className="mt-3 text-muted-foreground">
            O zmianie regulaminu poinformujemy w aplikacji lub e-mailem z co najmniej 14-dniowym
            wyprzedzeniem. Jeżeli nie akceptujesz zmian, możesz usunąć konto przed ich wejściem w
            życie.
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">10. Dane osobowe</h2>
          <p className="mt-3 text-muted-foreground">
            Zasady przetwarzania danych opisuje Polityka prywatności.
          </p>
        </div>
      </section>
    </article>
  );
}
