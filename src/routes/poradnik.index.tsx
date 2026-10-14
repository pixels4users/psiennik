import { createFileRoute } from "@tanstack/react-router";
import { GuideCard } from "@/components/guide-card";
import { GUIDES } from "@/lib/guides";
import { SITE_URL, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/poradnik/")({
  head: () => ({
    meta: socialMeta({
      title: "Poradniki dla opiekunów psów — Psiennik",
      description:
        "Praktyczne poradniki: jak obserwować reaktywność, lęk separacyjny i niszczenie przedmiotów oraz jak przygotować się do wizyty u behawiorysty.",
      path: "/poradnik",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/poradnik` }],
  }),
  component: GuideList,
});

function GuideList() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <p className="eyebrow">Poradniki</p>
      <h1 className="mt-4 text-4xl text-primary sm:text-5xl">Obserwuj, zapisuj, rozumiej</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Krótkie przewodniki o tym, co zapisywać przy najczęstszych trudnościach i jak pokazać to behawioryście.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <GuideCard key={g.slug} guide={g} />
        ))}
      </div>
    </div>
  );
}
