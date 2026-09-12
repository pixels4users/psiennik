import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, RotateCcw } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { DogNav } from "@/components/dog-nav";
import { RatingBadge } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACTIVITY_TYPES,
  RATINGS,
  TIMES_OF_DAY,
  labelFor,
  useDog,
  useEntries,
} from "@/lib/dogs";

export const Route = createFileRoute("/_authenticated/pies/$id/tabela")({
  head: () => ({
    meta: [
      { title: "Tabela wydarzeń — Psiennik" },
      {
        name: "description",
        content: "Pełna tabela wydarzeń psa z sortowaniem oraz filtrami dat, aktywności, pory dnia i oceny.",
      },
      { property: "og:title", content: "Tabela wydarzeń — Psiennik" },
      {
        property: "og:description",
        content: "Pełna tabela wydarzeń psa z sortowaniem oraz filtrami dat, aktywności, pory dnia i oceny.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DogTablePage,
});

const RATING_WEIGHT: Record<string, number> = { red: 3, amber: 2, green: 1 };

function DogTablePage() {
  const { id } = Route.useParams();
  const { data: dog } = useDog(id);
  const { data: entries, isLoading } = useEntries(id);
  const [sort, setSort] = useState("newest");
  const [activity, setActivity] = useState("all");
  const [timeOfDay, setTimeOfDay] = useState("all");
  const [rating, setRating] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const visibleEntries = useMemo(() => {
    const filtered = (entries ?? []).filter((entry) => {
      const date = parseISO(entry.date);
      if (dateRange?.from && date < dateRange.from) return false;
      if (dateRange?.to && date > dateRange.to) return false;
      if (activity !== "all" && entry.activity_type !== activity) return false;
      if (timeOfDay !== "all" && entry.time_of_day !== timeOfDay) return false;
      if (rating !== "all" && entry.rating !== rating) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "oldest") return a.date.localeCompare(b.date);
      if (sort === "hardest") {
        const ratingDifference = (RATING_WEIGHT[b.rating] ?? 0) - (RATING_WEIGHT[a.rating] ?? 0);
        return ratingDifference || b.date.localeCompare(a.date);
      }
      return b.date.localeCompare(a.date);
    });
  }, [activity, dateRange, entries, rating, sort, timeOfDay]);

  const hasFilters = activity !== "all" || timeOfDay !== "all" || rating !== "all" || !!dateRange;

  const resetFilters = () => {
    setActivity("all");
    setTimeOfDay("all");
    setRating("all");
    setDateRange(undefined);
  };

  if (!dog) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "d MMM yyyy", { locale: pl })} – ${format(dateRange.to, "d MMM yyyy", { locale: pl })}`
      : `Od ${format(dateRange.from, "d MMM yyyy", { locale: pl })}`
    : "Cała historia";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DogNav dog={dog} active="tabela" />

      <section className="mt-8" aria-labelledby="table-heading">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 id="table-heading" className="text-2xl">Wszystkie wydarzenia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleEntries.length} z {entries?.length ?? 0} wpisów
            </p>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              Wyczyść
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
            <Label>Zakres dat</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-0 justify-start px-3 font-normal">
                  <CalendarIcon className="size-4 shrink-0" />
                  <span className="truncate">{dateLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="pointer-events-auto w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={pl}
                  {...(dateRange?.from ? { defaultMonth: dateRange.from } : {})}
                />
              </PopoverContent>
            </Popover>
          </div>

          <FilterSelect label="Typ aktywności" value={activity} onChange={setActivity}>
            <SelectItem value="all">Wszystkie</SelectItem>
            {ACTIVITY_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </FilterSelect>

          <FilterSelect label="Pora dnia" value={timeOfDay} onChange={setTimeOfDay}>
            <SelectItem value="all">Wszystkie</SelectItem>
            {TIMES_OF_DAY.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </FilterSelect>

          <FilterSelect label="Ocena" value={rating} onChange={setRating}>
            <SelectItem value="all">Wszystkie</SelectItem>
            {RATINGS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </FilterSelect>

          <FilterSelect label="Sortuj" value={sort} onChange={setSort}>
            <SelectItem value="newest">Najnowsze</SelectItem>
            <SelectItem value="oldest">Najstarsze</SelectItem>
            <SelectItem value="hardest">Najtrudniejsze</SelectItem>
          </FilterSelect>
        </div>

        {isLoading ? (
          <Skeleton className="mt-5 h-72 w-full rounded-xl" />
        ) : visibleEntries.length === 0 ? (
          <div className="mt-5 rounded-lg bg-keylime p-10 text-center">
            <h3 className="text-2xl">Brak pasujących wpisów</h3>
            <p className="mt-2 text-sm text-muted-foreground">Zmień filtry lub wyczyść wybrany zakres.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="min-w-28 px-4">Data</TableHead>
                  <TableHead className="min-w-52">Wydarzenie</TableHead>
                  <TableHead className="min-w-36">Aktywność</TableHead>
                  <TableHead className="min-w-28">Pora dnia</TableHead>
                  <TableHead className="min-w-28">Ocena</TableHead>
                  <TableHead className="min-w-64">Opis</TableHead>
                  <TableHead className="min-w-64 pr-4">Komentarz behawiorysty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 align-top font-medium">
                      {format(parseISO(entry.date), "d MMM yyyy", { locale: pl })}
                    </TableCell>
                    <TableCell className="align-top font-medium">{entry.title}</TableCell>
                    <TableCell className="align-top">{labelFor(ACTIVITY_TYPES, entry.activity_type)}</TableCell>
                    <TableCell className="align-top">{labelFor(TIMES_OF_DAY, entry.time_of_day)}</TableCell>
                    <TableCell className="align-top"><RatingBadge rating={entry.rating} /></TableCell>
                    <TableCell className="align-top text-foreground/80">{entry.description || "—"}</TableCell>
                    <TableCell className="pr-4 align-top text-foreground/80">{entry.behaviorist_comment || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}