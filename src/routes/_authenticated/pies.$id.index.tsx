import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Plus, UserPlus, Users } from "lucide-react";
import { useDogRole } from "@/lib/auth";
import { useDogAccess } from "@/lib/access";
import { useDog, useEntries, type Entry } from "@/lib/dogs";
import { DogNav } from "@/components/dog-nav";
import { EntryCard } from "@/components/entry-card";

import { CommentDialog } from "@/components/comment-dialog";
import { AccessDialog } from "@/components/invite-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/")({
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Dziennik wydarzeń — Psiennik",
      description:
        "Dziennik wydarzeń psa: aktywności, opisy, oceny i zalecenia behawiorysty.",
      path: `/pies/${params.id}`,
      image: "app",
      privatePage: true,
    }),
  }),
  validateSearch: (search: Record<string, unknown>): { wpis?: string } => ({
    wpis: typeof search.wpis === "string" ? search.wpis : undefined,
  }),
  component: DogListPage,
});

function DogListPage() {
  const { id } = Route.useParams();
  const { wpis } = Route.useSearch();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);
  const { data: entries, isLoading } = useEntries(id);
  const { data: access } = useDogAccess(id);

  const navigate = useNavigate();
  const [commentedEntry, setCommentedEntry] = useState<Entry | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  const hasCoOwner =
    access?.some((row) => row.role === "owner" && row.user_id !== dog?.owner_id) ?? false;
  const behavioristRow = access?.find((row) => row.role === "behaviorist") ?? null;
  const hasBehaviorist = !!behavioristRow;
  const behavioristName =
    behavioristRow?.profile?.display_name || behavioristRow?.profile?.email || "przypisany";

  useEffect(() => {
    if (!wpis || isLoading) return;
    const el = document.getElementById(`wpis-${wpis}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
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

      {role?.canManage && (
        <div className="mt-8 flex flex-wrap gap-2">
          {role?.canEditEntries && (
            <Button
              onClick={() =>
                navigate({
                  to: "/pies/$id/wydarzenie/nowe",
                  params: { id },
                  search: { wroc: undefined },
                })
              }
            >
              <Plus className="size-4" />
              Dodaj wydarzenie
            </Button>
          )}
          {role?.isPrimaryOwner && !hasCoOwner && (
            <Button variant="outline" onClick={() => setAccessOpen(true)}>
              <Users className="size-4" />
              Dodaj współwłaściciela
            </Button>
          )}
          {hasBehaviorist ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-primary">
              <UserPlus className="size-4" aria-hidden="true" />
              Behawiorysta: {behavioristName}
            </span>
          ) : (
            <Button variant="outline" onClick={() => setAccessOpen(true)}>
              <UserPlus className="size-4" />
              Dodaj behawiorystę
            </Button>
          )}
        </div>
      )}

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
                    canComment={!!role?.canComment}
                    onEdit={(e) =>
                      navigate({
                        to: "/pies/$id/wydarzenie/$entryId",
                        params: { id, entryId: e.id },
                        search: { wroc: undefined },
                      })
                    }
                    onComment={(e) => {
                      setCommentedEntry(e);
                      setCommentDialogOpen(true);
                    }}
                  />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <CommentDialog
        entry={commentedEntry}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
      />
      <AccessDialog dog={dog} open={accessOpen} onOpenChange={setAccessOpen} />
    </div>
  );
}
