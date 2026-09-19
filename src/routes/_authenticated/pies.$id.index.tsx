import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { useDogRole } from "@/lib/auth";
import { useDog, useEntries, type Entry } from "@/lib/dogs";
import { DogNav } from "@/components/dog-nav";
import { EntryCard } from "@/components/entry-card";

import { RecommendationDialog } from "@/components/recommendation-dialog";
import { useEntryCommentCounts } from "@/lib/comments";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/")({
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Dziennik wydarzeń — Psiennik",
      description: "Dziennik wydarzeń psa: aktywności, opisy, oceny i zalecenia behawiorysty.",
      path: `/pies/${params.id}`,
      image: "app",
      privatePage: true,
    }),
  }),
  validateSearch: (search: Record<string, unknown>): { wpis?: string | undefined } => ({
    wpis: typeof search["wpis"] === "string" ? (search["wpis"] as string) : undefined,
  }),
  component: DogListPage,
});

function DogListPage() {
  const { id } = Route.useParams();
  const { wpis } = Route.useSearch();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);
  const { data: entries, isLoading } = useEntries(id);
  const { data: commentCounts } = useEntryCommentCounts((entries ?? []).map((e) => e.id));

  const navigate = useNavigate();
  const router = useRouter();
  const [commentedEntry, setCommentedEntry] = useState<Entry | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  useEffect(() => {
    if (!wpis || isLoading) return;
    const el = document.getElementById(`wpis-${wpis}`);
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    el.classList.add("ring-2", "ring-primary", "rounded-xl");
    const timer = window.setTimeout(
      () => el.classList.remove("ring-2", "ring-primary", "rounded-xl"),
      2500,
    );
    return () => window.clearTimeout(timer);
  }, [wpis, isLoading, entries]);

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries ?? []) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return [...map.entries()];
  }, [entries]);

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="dziennik" />

      <div key={id} className="content-enter flow-root" data-ready={!isLoading && !roleLoading}>
        {isLoading || roleLoading ? (
          <div className="mt-8 grid gap-4">
            <Skeleton className="h-8 w-40" />
            {[0, 1].map((i) => (
              <Card key={i} className="shadow-none">
                <CardContent className="grid gap-3 p-5">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="mt-8 rounded-xl bg-keylime p-12 text-center">
            <h2 className="text-3xl">Brak wpisów</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {role?.canEditEntries
                ? "Dodaj pierwsze wydarzenie, aby zacząć budować historię."
                : "Właściciel nie dodał jeszcze żadnych wydarzeń."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8">
            {grouped.map(([date, dayEntries]) => (
              <section key={date} className="grid gap-3">
                <h2 className="text-2xl capitalize">
                  {format(parseISO(date), "EEEE, d MMMM yyyy", { locale: pl })}
                </h2>
                <div className="grid gap-3">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} id={`wpis-${entry.id}`} className="transition-shadow">
                      <EntryCard
                        entry={entry}
                        canEdit={!!role?.canEditEntries}
                        canRecommend={!!role?.canRecommend}
                        commentCount={commentCounts?.get(entry.id) ?? 0}
                        onEdit={async (e) => {
                          const destination = {
                            to: "/pies/$id/wydarzenie/$entryId/edytuj",
                            params: { id, entryId: e.id },
                            search: { wroc: undefined },
                          } as const;
                          await router.preloadRoute(destination);
                          await navigate(destination);
                        }}
                        onRecommend={(e) => {
                          setCommentedEntry(e);
                          setCommentDialogOpen(true);
                        }}
                        onOpenDetails={(e) =>
                          navigate({
                            to: "/pies/$id/wydarzenie/$entryId",
                            params: { id, entryId: e.id },
                            search: { wroc: undefined },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <RecommendationDialog
        entry={commentedEntry}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
      />
    </div>
  );
}
