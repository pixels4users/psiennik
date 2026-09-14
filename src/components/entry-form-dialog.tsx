import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVITY_TYPES,
  TIMES_OF_DAY,
  RATINGS,
  entryActivities,
  entryTimes,
  type Entry,
} from "@/lib/dogs";
import { MultiToggle } from "@/components/multi-toggle";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const RATING_BUTTON_STYLES: Record<string, string> = {
  green: "border-good/40 data-[active=true]:bg-good/15 data-[active=true]:text-good data-[active=true]:border-good",
  amber: "border-warn/40 data-[active=true]:bg-warn/15 data-[active=true]:text-warn data-[active=true]:border-warn",
  red: "border-bad/40 data-[active=true]:bg-bad/15 data-[active=true]:text-bad data-[active=true]:border-bad",
};

export function EntryFormDialog({
  dogId,
  open,
  onOpenChange,
  entry,
}: {
  dogId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!entry;

  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timesOfDay, setTimesOfDay] = useState<string[]>(["rano"]);
  const [activityTypes, setActivityTypes] = useState<string[]>(["spacer"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<string>("green");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDate(parseISO(entry.date));
      setTimesOfDay(entryTimes(entry));
      setActivityTypes(entryActivities(entry));
      setTitle(entry.title);
      setDescription(entry.description ?? "");
      setRating(entry.rating);
    } else {
      setDate(new Date());
      setTimesOfDay(["rano"]);
      setActivityTypes(["spacer"]);
      setTitle("");
      setDescription("");
      setRating("green");
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Podaj krótki tytuł wydarzenia");
      return;
    }
    if (activityTypes.length === 0) {
      toast.error("Wybierz przynajmniej jeden typ aktywności");
      return;
    }
    if (timesOfDay.length === 0) {
      toast.error("Wybierz przynajmniej jedną porę dnia");
      return;
    }
    setSaving(true);
    try {
      const orderedTimes = TIMES_OF_DAY.filter((t) => timesOfDay.includes(t.value)).map(
        (t) => t.value,
      );
      const orderedActivities = ACTIVITY_TYPES.filter((t) =>
        activityTypes.includes(t.value),
      ).map((t) => t.value);
      const payload = {
        dog_id: dogId,
        date: format(date, "yyyy-MM-dd"),
        times_of_day: orderedTimes,
        activity_types: orderedActivities,
        time_of_day: orderedTimes[0] ?? "rano",
        activity_type: orderedActivities[0] ?? "inne",
        title: title.trim(),
        description: description.trim() || null,
        rating,
      };
      const { error } = isEdit
        ? await supabase.from("entries").update(payload).eq("id", entry.id)
        : await supabase.from("entries").insert(payload);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["entries", dogId] });
      toast.success(isEdit ? "Wydarzenie zaktualizowane" : "Wydarzenie dodane");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać wydarzenia");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["entries", dogId] });
      toast.success("Wydarzenie usunięte");
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć wydarzenia");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć to wydarzenie?</AlertDialogTitle>
          <AlertDialogDescription>
            „{entry?.title}" zostanie trwale usunięte wraz z zaleceniami behawiorysty.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Usuwanie…" : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            {isEdit ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}
          </DialogTitle>
          <DialogDescription>
            Zapisz aktywność i ocenę dnia — zalecenie behawiorysty dodawane jest osobno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start font-normal data-[empty=true]:text-muted-foreground"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {format(date, "d MMM yyyy", { locale: pl })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="pointer-events-auto w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setCalendarOpen(false);
                      }
                    }}
                    locale={pl}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Pora dnia</Label>
              <div className="flex flex-wrap items-center gap-2">
                <MultiToggle
                  options={TIMES_OF_DAY}
                  values={timesOfDay}
                  onChange={setTimesOfDay}
                  ariaLabel="Pora dnia"
                />
                <button
                  type="button"
                  aria-pressed={timesOfDay.length === TIMES_OF_DAY.length}
                  onClick={() =>
                    setTimesOfDay(
                      timesOfDay.length === TIMES_OF_DAY.length
                        ? []
                        : TIMES_OF_DAY.map((t) => t.value),
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    timesOfDay.length === TIMES_OF_DAY.length
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  Cały dzień
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Typ aktywności</Label>
            <MultiToggle
              options={ACTIVITY_TYPES.map((t) => ({ ...t, icon: ACTIVITY_ICONS[t.value] }))}
              values={activityTypes}
              onChange={setActivityTypes}
              ariaLabel="Typ aktywności"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-title">Tytuł</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Spacer z Kokosem 45 min po osiedlu"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-description">Opis</Label>
            <Textarea
              id="entry-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brak zachowań problemowych albo opis sytuacji problemowej…"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Ocena</Label>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  data-active={rating === r.value}
                  onClick={() => setRating(r.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    RATING_BUTTON_STYLES[r.value],
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className={cn("flex gap-2 pt-2", isEdit ? "justify-between" : "justify-end")}>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={saving || deleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Usuń wydarzenie
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={deleting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Dodaj"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
