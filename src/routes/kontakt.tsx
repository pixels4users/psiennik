import { createFileRoute } from "@tanstack/react-router";
import { OPERATOR, contactEmailLabel } from "@/lib/legal";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: socialMeta({
      title: "Kontakt — Psiennik",
      description: "Dane operatora Psiennika, kontakt i reklamacje.",
      path: "/kontakt",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: "https://psiennik.pl/kontakt" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-4xl text-primary">Kontakt</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Operator Psiennika — sprawy związane z usługą, danymi osobowymi i reklamacjami.
      </p>

      <section className="mt-10 grid gap-8 text-base leading-relaxed text-foreground">
        <div>
          <h2 className="text-2xl text-primary">Usługodawca</h2>
          <p className="mt-3 text-muted-foreground">
            {OPERATOR.name}
            <br />
            {OPERATOR.street}
            <br />
            {OPERATOR.city}
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Dane rejestrowe</h2>
          <ul className="mt-3 grid gap-1 text-muted-foreground">
            <li>NIP: PL {OPERATOR.nip}</li>
            <li>REGON: {OPERATOR.regon}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl text-primary">E-mail</h2>
          <p className="mt-3 text-muted-foreground">
            Sprawy ogólne, reklamacje i zgłoszenia dotyczące prywatności:{" "}
            <a className="underline" href={`mailto:${OPERATOR.email}`}>
              {contactEmailLabel()}
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-2xl text-primary">Reklamacje</h2>
          <p className="mt-3 text-muted-foreground">
            Zgłoszenie reklamacyjne rozpatrujemy w terminie 14 dni kalendarzowych od jego otrzymania.
            Prosimy o opis problemu i podanie adresu e-mail powiązanego z kontem.
          </p>
        </div>
      </section>
    </article>
  );
}
