import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { MessageSquareText } from "lucide-react";
import { DogNav } from "@/components/dog-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDog, useEntries } from "@/lib/dogs";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/zalecenia")({
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Zalecenia behawiorysty — Psiennik",
      description: "Wszystkie zalecenia behawiorysty dla psa, uporządkowane w jednym miejscu.",
      path: `/pies/${params.id}/zalecenia`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: DogRecommendationsPage,
});

function DogRecommendationsPage() {
  const { id } = Route.useParams();
  const { data: dog } = useDog(id);
  const { data: entries, isLoading } = useEntries(id);
  const [sort, setSort] = useState("newest");

  const recommendations = useMemo(() => {
    return (entries ?? [])
      .filter((entry) => Boolean(entry.behaviorist_comment?.trim()))
      .sort((a, b) => {
        const aDate = a.commented_at ?? a.date;
        const bDate = b.commented_at ?? b.date;
        return sort === "oldest" ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
      });
  }, [entries, sort]);

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="zalecenia" />

      <section className="mt-8" aria-labelledby="recommendations-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="recommendations-heading" className="text-2xl">Wszystkie zalecenia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {recommendations.length} {recommendations.length === 1 ? "zalecenie" : "zaleceń"}
            </p>
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40" aria-label="Sortuj zalecenia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnowsze</SelectItem>
              <SelectItem value="oldest">Najstarsze</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="mt-5 grid gap-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="mt-5 rounded-lg bg-keylime px-5 py-12 text-center">
            <MessageSquareText className="mx-auto size-7 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-2xl">Brak zaleceń</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Behawiorysta nie dodał jeszcze żadnych zaleceń dla {dog.name}.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {recommendations.map((entry) => (
              <Card key={entry.id} className="shadow-none">
                <CardContent className="grid gap-3 p-5">
                  <p className="leading-relaxed text-foreground/90">{entry.behaviorist_comment}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
                    <time dateTime={entry.commented_at ?? entry.date}>
                      {format(parseISO(entry.commented_at ?? entry.date), "d MMMM yyyy", { locale: pl })}
                    </time>
                    <Link
                      to="/pies/$id"
                      params={{ id }}
                      className="font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Zobacz wydarzenie: {entry.title}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}