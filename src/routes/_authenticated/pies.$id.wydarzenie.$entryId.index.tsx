import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft, MessageSquarePlus, MessageSquareText, Clock3, Pencil } from "lucide-react";
import { useDog, useEntries, entryActivities, entryTimes, timesLabel, ACTIVITY_TYPES, ACTIVITY_ICONS, labelFor } from "@/lib/dogs";
import { useDogRole } from "@/lib/auth";
import { EntryDiscussion } from "@/components/entry-discussion";
import { RecommendationDialog } from "@/components/recommendation-dialog";
import { RatingBadge } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/wydarzenie/$entryId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    wroc: search["wroc"] === "kalendarz" ? ("kalendarz" as const) : undefined,
  }),
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Wydarzenie — Psiennik",
      description: "Szczegóły wydarzenia w dzienniku behawioralnym psa: opis, zalecenie i dyskusja.",
      path: `/pies/${params.id}/wydarzenie/${params.entryId}`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: EntryDetailsPage,
});

function EntryDetailsPage() {
  const { id, entryId } = Route.useParams();
  const { wroc } = Route.useSearch();
  const navigate = useNavigate();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);
  const { data: entries, isLoading } = useEntries(id);
  const [recommendationOpen, setRecommendationOpen] = useState(false);

  const entry = entries?.find((item) => item.id === entryId) ?? null;

  const goBack = () => {
    if (wroc === "kalendarz") {
      void navigate({ to: "/pies/$id/kalendarz", params: { id } });
    } else {
      void navigate({ to: "/pies/$id", params: { id } });
    }
  };

  const missing = !isLoading && !entry;
  useEffect(() => {
    if (missing) goBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing]);

  if (missing) return null;

  const activities = entry ? entryActivities(entry) : [];
  const times = entry ? entryTimes(entry) : [];

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Button variant="ghost" className="-ml-2 mb-4" onClick={goBack}>
        <ArrowLeft className="size-4" />
        {wroc === "kalendarz" ? "Wróć do kalendarza" : dog?.name ? `Wróć do dziennika: ${dog.name}` : "Wróć"}
      </Button>

      {!entry || roleLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <article className="grid gap-8">
          <header className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl font-light text-primary">{entry.title}</h1>
              {role?.canEditEntries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/pies/$id/wydarzenie/$entryId/edytuj",
                      params: { id, entryId },
                      search: { wroc },
                    })
                  }
                >
                  <Pencil className="size-4" />
                  Edytuj wydarzenie
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" />
                <time dateTime={entry.date} className="capitalize">
                  {format(parseISO(entry.date), "EEEE, d MMMM yyyy", { locale: pl })}
                </time>
                {" · "}
                {timesLabel(times)}
              </span>
              <RatingBadge rating={entry.rating} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activities.map((value) => {
                const Icon = ACTIVITY_ICONS[value];
                return (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-primary"
                  >
                    {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                    {labelFor(ACTIVITY_TYPES, value)}
                  </span>
                );
              })}
            </div>
            {entry.description && (
              <p className="leading-relaxed whitespace-pre-wrap text-foreground/80">
                {entry.description}
              </p>
            )}
          </header>

          <section className="grid gap-3" aria-labelledby="recommendation-heading">
            <h2 id="recommendation-heading" className="flex items-center gap-2 text-2xl">
              <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
              Zalecenie behawiorysty
            </h2>
            {entry.behaviorist_comment ? (
              <div className="grid gap-2 rounded-lg bg-keylime p-4">
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  {entry.behaviorist_comment}
                </p>
                {role?.canRecommend && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setRecommendationOpen(true)}>
                      Edytuj zalecenie
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                  Behawiorysta nie dodał jeszcze zalecenia.
                </p>
                {role?.canRecommend && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setRecommendationOpen(true)}
                  >
                    <MessageSquarePlus className="size-4" />
                    Dodaj zalecenie
                  </Button>
                )}
              </div>
            )}
          </section>

          <EntryDiscussion entryId={entryId} canDiscuss={!!role?.canDiscuss} />
        </article>
      )}

      <RecommendationDialog
        entry={entry}
        open={recommendationOpen}
        onOpenChange={setRecommendationOpen}
      />
    </div>
  );
}
