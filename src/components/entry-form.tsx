import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, Check, ImageIcon, Trash2, Upload, Video, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVITY_TYPES,
  activityIcon,
  TIMES_OF_DAY,
  RATINGS,
  entryActivities,
  entryTimes,
  type Entry,
} from "@/lib/dogs";
import { MultiToggle } from "@/components/multi-toggle";
import { MediaThumb } from "@/components/entry-video";
import { CoffeePromptDialog } from "@/components/coffee-prompt-dialog";
import { checkCoffeePromptEligible } from "@/lib/coffee-prompt";
import type { Json } from "@/integrations/supabase/types";
import {
  MEDIA_ACCEPT,
  MAX_LINKS,
  MAX_PHOTOS,
  MAX_VIDEOS,
  VIDEO_BUCKET,
  STORAGE_WARN_BYTES,
  countMedia,
  ensureSpaceFor,
  entryMedia,
  uploadMediaFile,
  useStorageUsage,
  validateMediaFile,
  validateMediaLink,
  formatMb,
  type MediaFileItem,
  type MediaLinkItem,
  type MediaItem,
} from "@/lib/video";
import { cn } from "@/lib/utils";
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
  green: "border-good/40 data-[active=true]:bg-good/15 data-[active=true]:text-foreground data-[active=true]:border-good",
  amber: "border-warn/40 data-[active=true]:bg-warn/15 data-[active=true]:text-warn data-[active=true]:border-warn",
  red: "border-bad/40 data-[active=true]:bg-bad/15 data-[active=true]:text-bad data-[active=true]:border-bad",
};

export function EntryForm({
  dogId,
  entry,
  onDone,
  onCancel,
}: {
  dogId: string;
  entry?: Entry | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!entry;

  const [date, setDate] = useState<Date>(() => (entry ? parseISO(entry.date) : new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timesOfDay, setTimesOfDay] = useState<string[]>(() =>
    entry ? entryTimes(entry) : ["rano"],
  );
  const [activityTypes, setActivityTypes] = useState<string[]>(() =>
    entry ? entryActivities(entry) : ["spacer"],
  );
  const [title, setTitle] = useState(() => entry?.title ?? "");
  const [description, setDescription] = useState(() => entry?.description ?? "");
  const [rating, setRating] = useState<string>(() => entry?.rating ?? "green");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);
  const [entryId] = useState(() => entry?.id ?? crypto.randomUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalMedia = useState(() => (entry ? entryMedia(entry) : []))[0];
  const [media, setMedia] = useState<MediaItem[]>(originalMedia);
  const [pending, setPending] = useState<File[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const { data: usage } = useStorageUsage();
  const files = media.filter((m): m is MediaFileItem => m.type !== "link");
  const links = media.filter((m): m is MediaLinkItem => m.type === "link");
  const photoCount = countMedia(media, "photo") + pending.filter((f) => f.type.startsWith("image/")).length;
  const videoCount = countMedia(media, "video") + pending.filter((f) => f.type.startsWith("video/")).length;

  const invalidateStorage = () => {
    void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
    void queryClient.invalidateQueries({ queryKey: ["video-files"] });
  };

  const pickFiles = (list: FileList | null | undefined) => {
    if (!list || uploading) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      const virtual: MediaItem[] = [
        ...media,
        ...next.map((f) => ({ type: f.type.startsWith("image/") ? "photo" : "video", path: "", size: 0 }) as MediaItem),
      ];
      const problem = validateMediaFile(file, virtual);
      if (problem) {
        toast.error(problem);
        continue;
      }
      next.push(file);
    }
    if (next.length > 0) void uploadFiles(next);
  };

  // Pliki przesyłają się od razu po wybraniu — bez osobnego kroku „Prześlij”.
  const uploadFiles = async (list: File[]) => {
    setPending(list);
    setUploading(true);
    try {
      const total = list.reduce((sum, f) => sum + f.size, 0);
      const freed = await ensureSpaceFor(total);
      if (freed > 0) toast.info("Usunięto najstarsze wideo, aby zrobić miejsce.");
      for (let i = 0; i < list.length; i++) {
        setProgress(i / list.length);
        const res = await uploadMediaFile(list[i]!, dogId, entryId, (f) =>
          setProgress((i + f) / list.length),
        );
        setMedia((m) => [...m, { type: res.type, path: res.path, size: res.size }]);
        setPending((p) => p.slice(1));
      }
      invalidateStorage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się przesłać plików");
    } finally {
      setPending([]);
      setUploading(false);
      setProgress(null);
    }
  };

  const removeFile = async (item: MediaFileItem) => {
    setMedia((m) => m.filter((x) => !(x.type !== "link" && x.path === item.path)));
    // Nowo przesłany plik (jeszcze nie zapisany w wydarzeniu) usuwamy od razu.
    if (!originalMedia.some((o) => o.type !== "link" && o.path === item.path)) {
      await supabase.storage.from(VIDEO_BUCKET).remove([item.path]);
      invalidateStorage();
    }
  };

  const saveLink = () => {
    const problem = validateMediaLink(linkDraft, media);
    if (problem) {
      toast.error(problem);
      return;
    }
    setMedia((m) => [...m, { type: "link", url: linkDraft.trim() }]);
    setLinkDraft("");
  };

  const removeLink = (index: number) => {
    let seen = -1;
    setMedia((m) => m.filter((x) => (x.type === "link" ? ++seen !== index : true)));
  };

  useEffect(() => {
    if (entry) {
      setDate(parseISO(entry.date));
      setTimesOfDay(entryTimes(entry));
      setActivityTypes(entryActivities(entry));
      setTitle(entry.title);
      setDescription(entry.description ?? "");
      setRating(entry.rating);
    }
  }, [entry]);

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
    if (uploading) {
      toast.error("Poczekaj, aż pliki się prześlą");
      return;
    }
    if (linkDraft.trim()) {
      toast.error("Kliknij „Zapisz link” albo wyczyść pole linku");
      return;
    }
    setSaving(true);
    try {
      const removed = originalMedia
        .filter((o): o is MediaFileItem => o.type !== "link")
        .filter((o) => !files.some((f) => f.path === o.path))
        .map((o) => o.path);
      if (removed.length > 0) await supabase.storage.from(VIDEO_BUCKET).remove(removed);
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
        media: media as unknown as Json,
        video_path: null,
        video_size: null,
        video_url: null,
      };
      const { error } = isEdit
        ? await supabase.from("entries").update(payload).eq("id", entry.id)
        : await supabase.from("entries").insert({ ...payload, id: entryId });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["entries", dogId] });
      void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["video-files"] });
      toast.success(isEdit ? "Wydarzenie zaktualizowane" : "Wydarzenie dodane");
      // Prośba o wsparcie tylko po dodaniu nowego wydarzenia, nie przy edycji.
      // Gdy modal się otwiera, powrót do widoku psa następuje dopiero po jego zamknięciu.
      if (!isEdit && (await checkCoffeePromptEligible())) {
        setPendingDone(true);
        setCoffeeOpen(true);
      } else {
        onDone();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać wydarzenia");
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) throw error;
      const paths = entryMedia(entry).flatMap((m) => (m.type === "link" ? [] : [m.path]));
      if (paths.length > 0) {
        await supabase.storage.from(VIDEO_BUCKET).remove(paths);
        invalidateStorage();
      }
      await queryClient.invalidateQueries({ queryKey: ["entries", dogId] });
      toast.success("Wydarzenie usunięte");
      setConfirmDeleteOpen(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć wydarzenia");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CoffeePromptDialog
        open={coffeeOpen}
        onOpenChange={setCoffeeOpen}
        onCloseComplete={() => {
          if (pendingDone) {
            setPendingDone(false);
            onDone();
          }
        }}
      />
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

      <form onSubmit={handleSubmit} className="grid gap-8">
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
            options={ACTIVITY_TYPES.map((t) => ({ ...t, icon: activityIcon(t.value) }))}
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
            placeholder="np. Spacer po osiedlu"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="entry-description">Opis</Label>
          <Textarea
            id="entry-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Co się wydarzyło? Jak zareagował pies?"
            rows={4}
          />
        </div>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Dodaj zdjęcie lub film (opcjonalnie)</Label>
            <p className="text-xs text-muted-foreground">
              Do {MAX_PHOTOS} zdjęć i 1 wideo (maks. 20 MB) z telefonu lub komputera oraz do {MAX_LINKS} linków.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            className="sr-only"
            aria-label="Zdjęcia lub wideo"
            tabIndex={-1}
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {files.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {files.map((item) => (
                <li key={item.path} className="grid gap-1">
                  <MediaThumb item={item} className="aspect-square" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    disabled={saving || uploading}
                    onClick={() => void removeFile(item)}
                  >
                    <X className="size-3.5" /> Usuń
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {pending.length > 0 ? (
            <div className="grid gap-2 rounded-lg border p-3" aria-live="polite">
              <ul className="grid gap-1 text-sm">
                {pending.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex min-w-0 items-center gap-2">
                    {f.type.startsWith("image/") ? <ImageIcon className="size-4 shrink-0 text-primary" /> : <Video className="size-4 shrink-0 text-primary" />}
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatMb(f.size)}</span>
                  </li>
                ))}
              </ul>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">Przesyłanie… {Math.round((progress ?? 0) * 100)}%</span>
            </div>
          ) : (photoCount < MAX_PHOTOS || videoCount < MAX_VIDEOS) && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFiles(e.dataTransfer.files);
              }}
              className="grid gap-2 rounded-lg border border-dashed p-4 text-sm"
            >
              <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit text-primary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" /> Wybierz zdjęcia lub wideo
              </Button>
              <span className="text-muted-foreground">
                Albo przeciągnij pliki tutaj. Zdjęcia: {photoCount}/{MAX_PHOTOS}, wideo: {videoCount}/{MAX_VIDEOS}. Najlepiej 15–45 sekund kluczowej sytuacji.
              </span>
            </div>
          )}
          {usage !== undefined && usage >= STORAGE_WARN_BYTES && (
            <p className="text-sm text-warn">
              Kończy się miejsce na pliki ({formatMb(usage)} z 50 MB). Usuń starsze wideo w Ustawieniach — inaczej najstarsze zostaną usunięte automatycznie.
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="entry-media-url" className="text-sm font-normal text-muted-foreground">
              Lub dodaj link do wideo albo zdjęcia ({links.length}/{MAX_LINKS})
            </Label>
            {links.map((l, i) => (
              <div key={`${i}-${l.url}`} className="flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <Check className="size-4 shrink-0 text-good" aria-hidden="true" />
                  <span className="truncate">{l.url}</span>
                </span>
                <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeLink(i)}>
                  <Trash2 className="size-4" /> Usuń link
                </Button>
              </div>
            ))}
            {links.length < MAX_LINKS && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="entry-media-url"
                    type="url"
                    inputMode="url"
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveLink();
                      }
                    }}
                    placeholder="https://youtu.be/… lub link z Dysku Google"
                    className="pr-9"
                  />
                  {linkDraft && (
                    <button type="button" aria-label="Wyczyść link" onClick={() => setLinkDraft("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={saveLink} disabled={!linkDraft.trim()}>
                  <Link2 className="size-4" /> Zapisz link
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              YouTube, Dysk Google i Vimeo odtworzą się w Psienniku. Na Dysku ustaw „Każda osoba mająca link”.
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Ocena wydarzenia</Label>
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
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={saving || deleting || uploading}>
            {uploading ? "Przesyłanie plików…" : saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Dodaj"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={deleting}>
            Anuluj
          </Button>
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={saving || deleting}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-4" />
              Usuń wydarzenie
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
