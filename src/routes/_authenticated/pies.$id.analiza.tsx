import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO, startOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { DogNav } from "@/components/dog-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { EntriesErrorNotice } from "@/components/dog-state";
import {
  ACTIVITY_TYPES,
  entryActivities,
  entryTimes,
  type Entry,
  useDog,
  useEntries,
} from "@/lib/dogs";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/analiza")({
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Analiza zachowania — Psiennik",
      description: "Podsumowania i wykresy wydarzeń, ocen, aktywności oraz pór dnia psa.",
      path: `/pies/${params.id}/analiza`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: DogAnalysisPage,
});

const STOPWORDS = new Set([
  "i",
  "oraz",
  "a",
  "ale",
  "na",
  "w",
  "we",
  "z",
  "ze",
  "do",
  "od",
  "po",
  "za",
  "nie",
  "tak",
  "to",
  "się",
  "był",
  "była",
  "było",
  "jest",
  "być",
  "the",
  "jak",
  "przy",
  "przez",
  "dla",
  "bez",
  "pod",
  "nad",
  "o",
  "u",
  "że",
  "lucy",
  "psa",
  "pies",
  "suka",
  "tego",
  "tym",
  "tej",
  "bardzo",
  "trochę",
]);

const ratingConfig = {
  green: { label: "Dobrze", color: "var(--color-good)" },
  amber: { label: "Wyzwanie", color: "var(--color-warn)" },
  red: { label: "Trudno", color: "var(--color-bad)" },
} satisfies ChartConfig;

const eventsConfig = {
  events: { label: "Wydarzenia", color: "var(--color-primary)" },
} satisfies ChartConfig;

const timeConfig = {
  rano: { label: "Rano", color: "var(--color-chart-4)" },
  poludnie: { label: "Południe", color: "var(--color-chart-5)" },
  wieczor: { label: "Wieczór", color: "var(--color-primary)" },
} satisfies ChartConfig;

function countRating(entries: Entry[], rating: string) {
  return entries.filter((entry) => entry.rating === rating).length;
}

function keywordCounts(entries: Entry[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.rating === "green" || !entry.description) continue;
    const words = entry.description
      .toLowerCase()
      .split(/[^a-ząćęłńóśźż]+/u)
      .filter((word) => word.length > 3 && !STOPWORDS.has(word));
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function DogAnalysisPage() {
  const { id } = Route.useParams();
  const { data: dog } = useDog(id);
  const {
    data: entries,
    isLoading,
    isError: entriesError,
    refetch: refetchEntries,
  } = useEntries(id);

  const analysis = useMemo(() => {
    const all = entries ?? [];
    const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const currentWeekKey = format(currentWeek, "yyyy-MM-dd");
    const weekEntries = all.filter(
      (entry) =>
        format(startOfWeek(parseISO(entry.date), { weekStartsOn: 1 }), "yyyy-MM-dd") ===
        currentWeekKey,
    );

    const byDate = new Map<string, number>();
    const byWeek = new Map<string, { green: number; amber: number; red: number }>();
    for (const entry of all) {
      byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + 1);
      const week = format(startOfWeek(parseISO(entry.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const balance = byWeek.get(week) ?? { green: 0, amber: 0, red: 0 };
      if (entry.rating === "green" || entry.rating === "amber" || entry.rating === "red") {
        balance[entry.rating] += 1;
      }
      byWeek.set(week, balance);
    }

    return {
      week: {
        green: countRating(weekEntries, "green"),
        amber: countRating(weekEntries, "amber"),
        red: countRating(weekEntries, "red"),
      },
      total: {
        green: countRating(all, "green"),
        amber: countRating(all, "amber"),
        red: countRating(all, "red"),
        all: all.length,
      },
      keywords: keywordCounts(all),
      daily: [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, events]) => ({
          date,
          label: format(parseISO(date), "d MMM", { locale: pl }),
          events,
        })),
      weekly: [...byWeek.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, balance]) => ({
          week,
          label: format(parseISO(week), "d MMM", { locale: pl }),
          ...balance,
        })),
      activityByTime: ACTIVITY_TYPES.map((activity) => {
        const matching = all.filter((entry) => entryActivities(entry).includes(activity.value));
        const countTime = (time: string) =>
          matching.filter((entry) => entryTimes(entry).includes(time)).length;
        return {
          activity: activity.label,
          rano: countTime("rano"),
          poludnie: countTime("poludnie"),
          wieczor: countTime("wieczor"),
        };
      }).filter((row) => row.rano + row.poludnie + row.wieczor > 0),
    };
  }, [entries]);

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  const totalCount = analysis.total.all;
  const barSegments = [
    { key: "green", className: "bg-good", count: analysis.total.green },
    { key: "amber", className: "bg-warn", count: analysis.total.amber },
    { key: "red", className: "bg-bad", count: analysis.total.red },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="analiza" />

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : entriesError ? (
        <div className="mt-8">
          <EntriesErrorNotice onRetry={() => void refetchEntries()} />
        </div>
      ) : (
        <div key={id} className="content-enter flow-root">
          <section className="mt-8 grid gap-5 sm:grid-cols-3">
            <Card className="shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Ten tydzień</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-good/15 px-3 py-1 text-xs font-medium text-good">
                    Dobrze: {analysis.week.green}
                  </span>
                  <span className="rounded-full bg-warn/15 px-3 py-1 text-xs font-medium text-warn">
                    Wyzwanie: {analysis.week.amber}
                  </span>
                  <span className="rounded-full bg-bad/15 px-3 py-1 text-xs font-medium text-bad">
                    Trudno: {analysis.week.red}
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
                        (segment) =>
                          segment.count > 0 && (
                            <div
                              key={segment.key}
                              className={segment.className}
                              style={{ width: `${(segment.count / totalCount) * 100}%` }}
                            />
                          ),
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Dobrze: {analysis.total.green} · Wyzwanie: {analysis.total.amber} · Trudno:{" "}
                      {analysis.total.red}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="grid gap-3 p-6">
                <h2 className="text-xl">Częste słowa w trudnych wydarzeniach</h2>
                {analysis.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak słów do zestawienia</p>
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

          <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="Wykresy analizy">
            <AnalysisCard title="Wydarzenia na dzień" empty={analysis.daily.length === 0}>
              <ChartContainer config={eventsConfig} className="h-72 w-full">
                <LineChart accessibilityLayer data={analysis.daily} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    isAnimationActive={false}
                    dataKey="events"
                    type="monotone"
                    stroke="var(--color-events)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-events)" }}
                  />
                </LineChart>
              </ChartContainer>
            </AnalysisCard>

            <AnalysisCard title="Bilans ocen tygodniowo" empty={analysis.weekly.length === 0}>
              <ChartContainer config={ratingConfig} className="h-72 w-full">
                <BarChart accessibilityLayer data={analysis.weekly} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    isAnimationActive={false}
                    dataKey="green"
                    stackId="ratings"
                    fill="var(--color-green)"
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="amber"
                    stackId="ratings"
                    fill="var(--color-amber)"
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="red"
                    stackId="ratings"
                    fill="var(--color-red)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </AnalysisCard>

            <AnalysisCard
              title="Aktywności według pory dnia"
              empty={analysis.activityByTime.length === 0}
              className="lg:col-span-2"
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Wydarzenie z kilkoma typami lub porami liczy się w każdym z nich, więc suma może być
                wyższa niż liczba wpisów.
              </p>
              <ChartContainer config={timeConfig} className="h-80 w-full">
                <BarChart
                  accessibilityLayer
                  data={analysis.activityByTime}
                  margin={{ left: 4, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="activity" tickLine={false} axisLine={false} minTickGap={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    isAnimationActive={false}
                    dataKey="rano"
                    fill="var(--color-rano)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="poludnie"
                    fill="var(--color-poludnie)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey="wieczor"
                    fill="var(--color-wieczor)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </AnalysisCard>
          </section>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({
  title,
  empty,
  className,
  children,
}: {
  title: string;
  empty: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-light">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="grid h-64 place-items-center text-sm text-muted-foreground">
            Brak danych do pokazania.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
