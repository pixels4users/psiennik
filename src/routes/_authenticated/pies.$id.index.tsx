import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Plus } from "lucide-react";
import { useDogRole } from "@/lib/auth";
import { useDog, useEntries, type Entry } from "@/lib/dogs";
import { DogNav } from "@/components/dog-nav";
import { EntryCard } from "@/components/entry-card";
import { EntryFormDialog } from "@/components/entry-form-dialog";
import { CommentDialog } from "@/components/comment-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/pies/$id/")({
  head: () => ({
    meta: [
      { title: "Dziennik wydarzeń — Psiennik" },
      {
        name: "description",
        content:
          "Lista wydarzeń z dziennika behawioralnego psa: aktywności, opisy, oceny i komentarze behawiorysty.",
      },
      { property: "og:title", content: "Dziennik wydarzeń — Psiennik" },
      {
        property: "og:description",
        content:
          "Lista wydarzeń z dziennika behawioralnego psa: aktywności, opisy, oceny i komentarze behawiorysty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DogListPage,
});

function DogListPage() {
  const { id } = Route.useParams();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);
  const { data: entries, isLoading } = useEntries(id);

  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editedEntry, setEditedEntry] = useState<Entry | null>(null);
  const [commentedEntry, setCommentedEntry] = useState<Entry | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

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
      <DogNav dog={dog} active="lista" />

      {role?.canEditEntries && (
        <div className="mt-8">
          <Button
            onClick={() => {
              setEditedEntry(null);
              setEntryDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Dodaj wydarzenie
          </Button>
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
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    canEdit={!!role?.canEditEntries}
                    canComment={!!role?.canComment}
                    onEdit={(e) => {
                      setEditedEntry(e);
                      setEntryDialogOpen(true);
                    }}
                    onComment={(e) => {
                      setCommentedEntry(e);
                      setCommentDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EntryFormDialog
        dogId={id}
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        entry={editedEntry}
      />
      <CommentDialog
        entry={commentedEntry}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
      />
    </div>
  );
}
