import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITY_TYPES, TIMES_OF_DAY, RATINGS, type Entry } from "@/lib/dogs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [timeOfDay, setTimeOfDay] = useState<string>("rano");
  const [activityType, setActivityType] = useState<string>("spacer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<string>("green");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDate(parseISO(entry.date));
      setTimeOfDay(entry.time_of_day);
      setActivityType(entry.activity_type);
      setTitle(entry.title);
      setDescription(entry.description ?? "");
      setRating(entry.rating);
    } else {
      setDate(new Date());
      setTimeOfDay("rano");
      setActivityType("spacer");
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
    setSaving(true);
    try {
      const payload = {
        dog_id: dogId,
        date: format(date, "yyyy-MM-dd"),
        time_of_day: timeOfDay,
        activity_type: activityType,
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

  return (
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
          <div className="grid grid-cols-2 gap-4">
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
              <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMES_OF_DAY.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Typ aktywności</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
