import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_URL, socialMeta } from "@/lib/seo";

const PATH = "/poradnik/dziennik-obserwacji-psa";
const TITLE = "Pies szczeka na inne psy? Jak prowadzić dziennik obserwacji przed wizytą u behawiorysty";
const DESCRIPTION =
  "Co zapisywać po spacerze, gdy pies reaguje na inne psy, jak wygląda przykładowy tydzień wpisów i jak pokazać dziennik behawioryście.";

export const Route = createFileRoute("/poradnik/dziennik-obserwacji-psa")({
  head: () => ({
    meta: [
      ...socialMeta({ title: TITLE, description: DESCRIPTION, path: PATH, image: "homepage" }).filter(
        (m) => !("property" in m && m.property === "og:type"),
      ),
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${PATH}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          inLanguage: "pl",
          author: { "@type": "Organization", name: "Psiennik", url: SITE_URL },
          publisher: { "@type": "Organization", name: "Psiennik", url: SITE_URL },
          mainEntityOfPage: `${SITE_URL}${PATH}`,
        }),
      },
    ],
  }),
  component: GuidePage,
});

const WHAT_TO_NOTE = [
  ["Pora i miejsce", "Rano na osiedlu czy wieczorem w parku — reakcje często zależą od otoczenia."],
  ["Odległość", "Z jakiej odległości pies zauważył drugiego psa i kiedy zaczął reagować."],
  ["Reakcja", "Co dokładnie się stało: zatrzymanie, wpatrywanie się, szczekanie, ciągnięcie na smyczy."],
  ["Co pomogło", "Zwiększenie dystansu, zmiana kierunku, spokojna komenda, smakołyk."],
  ["Powrót do spokoju", "Ile czasu minęło, zanim pies znów mógł iść spokojnie."],
  ["Ocena dnia", "Prosta skala: dobrze, wyzwanie, trudno. Bez szukania winnych."],
];

const EXAMPLE_WEEK = [
  ["Poniedziałek", "Wyzwanie", "Pies za płotem, ok. 10 m. Szczekanie, po zmianie strony ulicy spokój po 2 minutach."],
  ["Środa", "Trudno", "Spotkanie zza rogu, ok. 3 m. Silna reakcja, potrzebowaliśmy wrócić do domu."],
  ["Piątek", "Dobrze", "Dwa psy z daleka, ok. 20 m. Humus popatrzył i wrócił do węszenia."],
  ["Niedziela", "Dobrze", "Spacer w nowym miejscu o spokojnej porze. Bez reakcji."],
];

function GuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 text-base leading-relaxed">
      <p className="eyebrow">Poradnik</p>
      <h1 className="mt-4 text-4xl text-primary sm:text-5xl">
        Pies szczeka na inne psy? Zacznij od dziennika obserwacji
      </h1>
      <p className="mt-6 rounded-2xl bg-secondary p-5 text-primary">
        <strong>W skrócie:</strong> po każdym spacerze zapisz, gdzie i kiedy pies zareagował, z jakiej odległości, co
        pomogło i jak szybko wrócił do spokoju. Po kilku tygodniach widać wzorce, a behawiorysta dostaje konkretny
        materiał zamiast wspomnień z ostatnich dni.
      </p>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Dlaczego pies reaguje na inne psy?</h2>
        <p className="mt-3 text-muted-foreground">
          Powodów może być wiele: strach, frustracja na smyczy, brak doświadczeń, ból albo po prostu zbyt mały dystans.
          Z zewnątrz te reakcje często wyglądają podobnie. Dlatego nie warto zgadywać przyczyny na własną rękę — ocenę
          zostaw behawioryście, a sam zbieraj rzetelne obserwacje. Jeśli zachowanie zmieniło się nagle, porozmawiaj też
          z lekarzem weterynarii.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Co zapisywać po każdym spacerze</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {WHAT_TO_NOTE.map(([term, desc]) => (
            <div key={term} className="rounded-xl border border-primary/15 p-4">
              <dt className="font-medium text-primary">{term}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-muted-foreground">
          Zapisuj od razu po powrocie — to zajmuje minutę, a szczegóły z pamięci szybko się zacierają.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Przykładowy tydzień wpisów</h2>
        <p className="mt-3 text-sm text-muted-foreground">Przykład — tak mógłby wyglądać tydzień Humusa.</p>
        <ul className="mt-5 grid gap-3">
          {EXAMPLE_WEEK.map(([day, rating, note]) => (
            <li key={day} className="rounded-xl bg-secondary/60 p-4">
              <p className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-primary">{day}</span>
                <span className="text-muted-foreground">{rating}</span>
              </p>
              <p className="mt-1 text-sm text-foreground">{note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-muted-foreground">
          Już z czterech wpisów widać, że najtrudniej jest przy małym dystansie i nagłych spotkaniach, a lepiej przy
          kilkunastu metrach. To dobry punkt wyjścia do rozmowy ze specjalistą.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Jak pokazać dziennik behawioryście</h2>
        <p className="mt-3 text-muted-foreground">
          Przed konsultacją prześlij behawioryście wpisy z ostatnich tygodni albo zaproś go do wspólnego dziennika. Na
          spotkaniu nie trzeba odtwarzać wszystkiego z pamięci — można od razu rozmawiać o tym, co się powtarza. Po
          konsultacji zapisuj zalecenia obok wydarzeń, żeby było widać, co działa.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Częste błędy</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Zapisywanie dopiero po kilku dniach, z pamięci.</li>
          <li>Same oceny („zły dzień”) bez opisu sytuacji i odległości.</li>
          <li>Notowanie tylko trudnych spacerów — spokojne też pokazują, co pomaga.</li>
          <li>Zmienianie wielu rzeczy naraz, przez co trudno ocenić, co zadziałało.</li>
        </ul>
      </section>

      <section className="mt-14 rounded-[2rem] bg-primary px-6 py-10 text-center">
        <h2 className="text-3xl text-primary-foreground">Prowadź dziennik w Psienniku</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80">
          Wydarzenia, oceny i zalecenia behawiorysty w jednym miejscu — dla Ciebie i specjalisty.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth" search={{ rola: "owner" }}>
              Jestem właścicielem
              <ArrowUpRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/auth" search={{ rola: "behaviorist" }}>
              Jestem behawiorystą
            </Link>
          </Button>
        </div>
      </section>
    </article>
  );
}
