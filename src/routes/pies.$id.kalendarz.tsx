import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addDays,
  addWeeks,
  format,
  isToday,

  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDog, useEntries, ACTIVITY_TYPES, type Entry } from "@/lib/dogs";
import { useRole } from "@/lib/role";
import { DogNav } from "@/components/dog-nav";
import { EntryCard } from "@/components/entry-card";
import { EntryFormDialog } from "@/components/entry-form-dialog";
import { CommentDialog } from "@/components/comment-dialog";
import { ratingToneClass } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export const Route = createFileRoute("/pies/$id/kalendarz")({
  head: () => ({
    meta: [
      { title: "Kalendarz i analiza — Dziennik psa" },
      {
        name: "description",
        content:
          "Tygodniowy kalendarz dziennika behawioralnego psa z podsumowaniem ocen, typów aktywności i powtarzających się tematów.",
      },
      { property: "og:title", content: "Kalendarz i analiza — Dziennik psa" },
      {
        property: "og:description",
        content:
          "Tygodniowy kalendarz dziennika behawioralnego psa z podsumowaniem ocen, typów aktywności i powtarzających się tematów.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DogCalendarPage,
});

const WEEKDAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const STOPWORDS = new Set([
  "i", "oraz", "a", "ale", "na", "w", "we", "z", "ze", "do", "od", "po", "za",
  "nie", "tak", "to", "się", "był", "była", "było", "jest", "być", "the",
  "jak", "przy", "przez", "dla", "bez", "pod", "nad", "o", "u", "że",
  "lucy", "psa", "pies", "suka", "tego", "tym", "tej", "bardzo", "trochę",
]);

const RATING_ORDER = ["red", "amber", "green"] as const;

function worstRating(dayEntries: Entry[]): string | null {
  for (const r of RATING_ORDER) {
    if (dayEntries.some((e) => e.rating === r)) return r;
  }
  return null;
}

function keywordCounts(entries: Entry[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.rating === "green" || !e.description) continue;
    const words = e.description
      .toLowerCase()
      .split(/[^a-ząćęłńóśźż]+/u)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function DogCalendarPage() {
  const { id } = Route.useParams();
  const { role } = useRole();
  const { data: dog } = useDog(id);
  const { data: entries, isLoading } = useEntries(id);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editedEntry, setEditedEntry] = useState<Entry | null>(null);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [commentedEntry, setCommentedEntry] = useState<Entry | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

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

  const analysis = useMemo(() => {
    const all = entries ?? [];
    const weekKey = (d: Date) => format(d, "yyyy-MM-dd");
    const weekEntries = all.filter((e) =>
      weekDays.some((d) => weekKey(d) === e.date),
    );
    const count = (list: Entry[], rating: string) =>
      list.filter((e) => e.rating === rating).length;
    const activityStats = ACTIVITY_TYPES.map((type) => {
      const ofType = all.filter((e) => e.activity_type === type.value);
      const good = ofType.filter((e) => e.rating === "green").length;
      return {
        label: type.label,
        total: ofType.length,
        goodPct: ofType.length ? Math.round((good / ofType.length) * 100) : null,
      };
    }).filter((s) => s.total > 0);
    return {
      week: {
        green: count(weekEntries, "green"),
        amber: count(weekEntries, "amber"),
        red: count(weekEntries, "red"),
      },
      total: {
        green: count(all, "green"),
        amber: count(all, "amber"),
        red: count(all, "red"),
        all: all.length,
      },
      activityStats,
      keywords: keywordCounts(all),
    };
  }, [entries, weekDays]);

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  const totalCount = analysis.total.all;
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDayEntries = selectedDateKey ? (byDate.get(selectedDateKey) ?? []) : [];
  const barSegments = [
    { key: "green", className: "bg-good", count: analysis.total.green },
    { key: "amber", className: "bg-warn", count: analysis.total.amber },
    { key: "red", className: "bg-bad", count: analysis.total.red },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="kalendarz" />

      {isLoading ? (
        <div className="mt-8 grid gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-5 sm:grid-cols-3">
            <Card className="shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Ten tydzień</h2>
                <div className="flex gap-2">
                  <span className="rounded-full bg-good/15 px-3 py-1 text-xs font-medium text-good">
                    {analysis.week.green} dobrze
                  </span>
                  <span className="rounded-full bg-warn/15 px-3 py-1 text-xs font-medium text-warn">
                    {analysis.week.amber} tak sobie
                  </span>
                  <span className="rounded-full bg-bad/15 px-3 py-1 text-xs font-medium text-bad">
                    {analysis.week.red} trudne
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Bilans ogólny</h2>
                {totalCount === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak wpisów.</p>
                ) : (
                  <>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      {barSegments.map(
                        (s) =>
                          s.count > 0 && (
                            <div
                              key={s.key}
                              className={s.className}
                              style={{ width: `${(s.count / totalCount) * 100}%` }}
                            />
                          ),
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysis.total.green} zielonych · {analysis.total.amber} pomarańczowych ·{" "}
                      {analysis.total.red} czerwonych z {totalCount} wpisów
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Powtarzające się tematy</h2>
                {analysis.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Brak trudnych sytuacji do przeanalizowania.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywords.map(([word, count]) => (
                      <span
                        key={word}
                        className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                      >
                        {word} · {count}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {analysis.activityStats.length > 0 && (
            <Card className="mt-5 shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Aktywności</h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.activityStats.map((s) => (
                    <span
                      key={s.label}
                      className="rounded-full bg-mint px-3.5 py-1.5 text-xs text-primary"
                    >
                      {s.label}: {s.total}× · {s.goodPct}% zielonych
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                const tone = ratingToneClass(
                  dayEntries.length ? worstRating(dayEntries) : null,
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
                      tone || "hover:bg-keylime",
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
                    {dayEntries.length > 0 && (
                      <span className="mt-auto text-xs text-muted-foreground">
                        {dayEntries.length}{" "}
                        {dayEntries.length === 1 ? "wpis" : dayEntries.length < 5 ? "wpisy" : "wpisów"}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Kolor dnia pokazuje najtrudniejszą ocenę z wpisów. Kliknij dzień, aby otworzyć
              jego szczegóły.
            </p>
          </section>
        </>
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
                  <h3 className="text-2xl">Spokojny dzień</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nie zapisano żadnych wydarzeń dla tej daty.
                  </p>
                </div>
              ) : (
                selectedDayEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    role={role}
                    onEdit={(item) => {
                      setEditedEntry(item);
                      setEntryDialogOpen(true);
                    }}
                    onComment={(item) => {
                      setCommentedEntry(item);
                      setCommentDialogOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
