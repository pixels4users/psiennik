import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/components/guide-articles";
import { GUIDES, getGuide, guideHead, type GuideSlug } from "@/lib/guides";

function isSlug(s: string): s is GuideSlug {
  return GUIDES.some((g) => g.slug === s);
}

export const Route = createFileRoute("/poradnik/$slug")({
  loader: ({ params }) => {
    if (!isSlug(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) =>
    isSlug(params.slug)
      ? guideHead(params.slug)
      : { meta: [{ title: "Nie znaleziono poradnika — Psiennik" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl text-primary">Nie znaleziono poradnika</h1>
      <Link to="/poradnik" className="mt-4 inline-block underline">
        Wszystkie poradniki
      </Link>
    </div>
  ),
  component: GuidePage,
});

function GuidePage() {
  const { slug } = Route.useLoaderData();
  const guide = getGuide(slug);
  const a = ARTICLES[slug];
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 text-base leading-relaxed">
      <Link to="/poradnik" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        Poradniki
      </Link>
      <h1 className="mt-6 text-4xl text-primary sm:text-5xl">{a.h1}</h1>
      <img
        src={guide.imageUrl}
        alt={guide.imageAlt}
        width={1200}
        height={630}
        className="mt-8 aspect-[1200/630] w-full rounded-2xl object-cover"
      />
      <p className="mt-8 rounded-2xl bg-secondary p-5 text-primary">
        <strong>W skrócie:</strong> {a.summary}
      </p>

      {a.sections.map((s) => (
        <section key={s.heading} className="mt-12">
          <h2 className="text-3xl text-primary">{s.heading}</h2>
          {s.body}
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-3xl text-primary">{a.notesHeading}</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {a.notes.map(([term, desc]) => (
            <div key={term} className="rounded-xl border border-primary/15 p-4">
              <dt className="font-medium text-primary">{term}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-muted-foreground">
          Zapisuj od razu — to zajmuje minutę, a szczegóły z pamięci szybko się zacierają.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl text-primary">Przykładowy tydzień wpisów</h2>
        <p className="mt-3 text-sm text-muted-foreground">{a.exampleNote}</p>
        <ul className="mt-5 grid gap-3">
          {a.example.map(([day, rating, note]) => (
            <li key={day} className="rounded-xl bg-secondary/60 p-4">
              <p className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-primary">{day}</span>
                <span className="text-muted-foreground">{rating}</span>
              </p>
              <p className="mt-1 text-sm text-foreground">{note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-muted-foreground">{a.exampleSummary}</p>
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
          {a.mistakes.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="mt-14 rounded-[2rem] bg-primary px-6 py-10 text-center">
        <h2 className="text-3xl text-primary-foreground">Prowadź dziennik w Psienniku</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80">
          Wydarzenia, oceny i zalecenia behawiorysty w jednym miejscu — za darmo, dla Ciebie i specjalisty.
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
