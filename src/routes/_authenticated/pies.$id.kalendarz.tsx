import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  addDays,
  addWeeks,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDog, useEntries, type Entry } from "@/lib/dogs";
import { useDogRole } from "@/lib/auth";
import { DogNav } from "@/components/dog-nav";
import { EntryCard } from "@/components/entry-card";

import { RecommendationDialog } from "@/components/recommendation-dialog";
import { useEntryCommentCounts } from "@/lib/comments";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/kalendarz")({
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Kalendarz — Psiennik",
      description: "Tygodniowy kalendarz wydarzeń psa z szybkim porównaniem ocen każdego dnia.",
      path: `/pies/${params.id}/kalendarz`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: DogCalendarPage,
});

const WEEKDAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const RATING_DOTS = [
  { rating: "green", label: "dobrych", className: "bg-good" },
  { rating: "amber", label: "wyzwań", className: "bg-warn" },
  { rating: "red", label: "trudnych", className: "bg-bad" },
] as const;

function ratingCount(entries: Entry[], rating: string) {
  return entries.filter((entry) => entry.rating === rating).length;
}

function ratingDotSize(count: number) {
  if (count === 0) return "size-1.5 opacity-20";
  if (count === 1) return "size-2.5";
  return "size-4";
}

function DogCalendarPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: role } = useDogRole(id);
  const { data: dog } = useDog(id);
  const { data: entries, isLoading } = useEntries(id);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [commentedEntry, setCommentedEntry] = useState<Entry | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const { data: commentCounts } = useEntryCommentCounts((entries ?? []).map((e) => e.id));

  const byDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries ?? []) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDayEntries = selectedDateKey ? (byDate.get(selectedDateKey) ?? []) : [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="kalendarz" />

      {isLoading ? (
        <div className="mt-8 grid gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl capitalize">
                {format(weekStart, "LLLL yyyy", { locale: pl })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  Dziś
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Poprzedni tydzień"
                  onClick={() => setWeekStart((w) => addWeeks(w, -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Następny tydzień"
                  onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="pb-1 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {label}
                </div>
              ))}
              {weekDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEntries = byDate.get(key) ?? [];
                const counts = Object.fromEntries(
                  RATING_DOTS.map(({ rating }) => [rating, ratingCount(dayEntries, rating)]),
                );
                return (
                  <Button
                    type="button"
                    variant="outline"
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    aria-label={`Pokaż wydarzenia z ${format(day, "d MMMM yyyy", { locale: pl })}`}
                    className={cn(
                      "h-auto min-h-20 flex-col items-stretch justify-start rounded-lg p-2 text-left font-normal",
                      "hover:bg-keylime",
                      isToday(day) && "ring-2 ring-ring",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday(day) ? "text-primary" : "text-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <span className="mt-auto flex h-4 items-center justify-center gap-1.5" aria-hidden="true">
                      {RATING_DOTS.map(({ rating, label, className }) => {
                        const count = counts[rating] ?? 0;
                        return (
                          <span
                            key={rating}
                            title={`${count} ocen ${label}`}
                            className={cn("shrink-0 rounded-full transition-[width,height,opacity]", className, ratingDotSize(count))}
                          />
                        );
                      })}
                    </span>
                    <span className="sr-only">
                      {RATING_DOTS.map(({ rating, label }) => `${counts[rating] ?? 0} ocen ${label}`).join(", ")}
                    </span>
                  </Button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Wielkość kropek pokazuje liczbę ocen: brak, jedna lub co najmniej dwie. Kliknij
              dzień, aby otworzyć jego szczegóły.
            </p>
          </section>
      )}

      <Sheet open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent
          side="right"
          className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:w-[34rem] sm:max-w-[90vw]"
        >
          <SheetHeader className="border-b border-border px-5 py-6 pr-14 text-left sm:px-7">
            <SheetTitle className="font-display text-3xl font-light capitalize text-primary">
              {selectedDate
                ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: pl })
                : "Szczegóły dnia"}
            </SheetTitle>
            <SheetDescription>
              {selectedDayEntries.length === 0
                ? "Brak wydarzeń"
                : `${selectedDayEntries.length} ${selectedDayEntries.length === 1 ? "wydarzenie" : selectedDayEntries.length < 5 ? "wydarzenia" : "wydarzeń"}`}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-3 p-5 sm:p-7">
              {selectedDayEntries.length === 0 ? (
                <div className="rounded-xl bg-keylime px-5 py-12 text-center">
                  <h3 className="text-2xl">Brak wydarzeń tego dnia</h3>
                </div>
              ) : (
                selectedDayEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    canEdit={!!role?.canEditEntries}
                    canRecommend={!!role?.canRecommend}
                    commentCount={commentCounts?.get(entry.id) ?? 0}
                    onEdit={(item) =>
                      navigate({
                        to: "/pies/$id/wydarzenie/$entryId/edytuj",
                        params: { id, entryId: item.id },
                        search: { wroc: "kalendarz" },
                      })
                    }
                    onRecommend={(item) => {
                      setCommentedEntry(item);
                      setCommentDialogOpen(true);
                    }}
                    onOpenDetails={(item) =>
                      navigate({
                        to: "/pies/$id/wydarzenie/$entryId",
                        params: { id, entryId: item.id },
                        search: { wroc: "kalendarz" },
                      })
                    }
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <RecommendationDialog
        entry={commentedEntry}
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
      />
    </div>
  );
}
