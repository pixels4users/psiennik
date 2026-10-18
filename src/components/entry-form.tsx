import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, Trash2, Video, Link2, X } from "lucide-react";
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
import { VideoFilePlayer, VideoLinkPlayer } from "@/components/entry-video";
import {
  VIDEO_ACCEPT,
  VIDEO_BUCKET,
  STORAGE_WARN_BYTES,
  ensureSpaceFor,
  parseVideoUrl,
  uploadVideo,
  useStorageUsage,
  validateVideoFile,
  formatMb,
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
  green: "border-good/40 data-[active=true]:bg-good/15 data-[active=true]:text-good data-[active=true]:border-good",
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
  const [videoMode, setVideoMode] = useState<"file" | "link">(() => (entry?.video_url ? "link" : "file"));
  const [existingVideo, setExistingVideo] = useState<string | null>(() => entry?.video_path ?? null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(() => entry?.video_url ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const { data: usage } = useStorageUsage();

  useEffect(() => {
    if (!videoFile) return setVideoPreview(null);
    const url = URL.createObjectURL(videoFile);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const pickVideo = (file: File | undefined) => {
    if (!file) return;
    const problem = validateVideoFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setVideoFile(file);
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
    const trimmedUrl = videoMode === "link" ? videoUrl.trim() : "";
    if (trimmedUrl && !parseVideoUrl(trimmedUrl)) {
      toast.error("Wklej poprawny link zaczynający się od https://");
      return;
    }
    setSaving(true);
    try {
      const entryId = entry?.id ?? crypto.randomUUID();
      const originalPath = entry?.video_path ?? null;
      const keepExisting = videoMode === "file" && !videoFile && existingVideo === originalPath;
      if (originalPath && !keepExisting) {
        await supabase.storage.from(VIDEO_BUCKET).remove([originalPath]);
      }
      let videoPath: string | null = keepExisting ? originalPath : null;
      let videoSize: number | null = keepExisting ? (entry?.video_size ?? null) : null;
      if (videoMode === "file" && videoFile) {
        const freed = await ensureSpaceFor(videoFile.size);
        if (freed > 0) {
          toast.info(
            freed === 1
              ? "Usunięto najstarsze wideo, aby zrobić miejsce."
              : `Usunięto ${freed} najstarsze wideo, aby zrobić miejsce.`,
          );
        }
        setProgress(0);
        videoPath = await uploadVideo(videoFile, dogId, entryId, setProgress);
        videoSize = videoFile.size;
      }
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
        video_path: videoPath,
        video_size: videoSize,
        video_url: trimmedUrl || null,
      };
      const { error } = isEdit
        ? await supabase.from("entries").update(payload).eq("id", entry.id)
        : await supabase.from("entries").insert({ ...payload, id: entryId });
      if (error && videoPath && videoPath !== originalPath) {
        await supabase.storage.from(VIDEO_BUCKET).remove([videoPath]);
      }
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["entries", dogId] });
      void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["video-files"] });
      toast.success(isEdit ? "Wydarzenie zaktualizowane" : "Wydarzenie dodane");
      onDone();
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
      if (entry.video_path) {
        await supabase.storage.from(VIDEO_BUCKET).remove([entry.video_path]);
        void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
        void queryClient.invalidateQueries({ queryKey: ["video-files"] });
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
          <Label>Wideo (opcjonalnie)</Label>
          <div className="flex gap-2" role="group" aria-label="Sposób dodania wideo">
            <Button
              type="button"
              size="sm"
              variant={videoMode === "file" ? "default" : "outline"}
              onClick={() => setVideoMode("file")}
            >
              <Video className="size-4" /> Dodaj wideo z telefonu
            </Button>
            <Button
              type="button"
              size="sm"
              variant={videoMode === "link" ? "default" : "outline"}
              onClick={() => setVideoMode("link")}
            >
              <Link2 className="size-4" /> Lub wklej link
            </Button>
          </div>
          {videoMode === "file" ? (
            <div className="grid gap-2">
              {videoPreview ? (
                <VideoFilePlayer src={videoPreview} />
              ) : existingVideo ? (
                <VideoFilePlayer path={existingVideo} />
              ) : null}
              {videoPreview || existingVideo ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit text-destructive hover:text-destructive"
                  disabled={saving}
                  onClick={() => {
                    setVideoFile(null);
                    setExistingVideo(null);
                  }}
                >
                  <X className="size-4" /> Usuń wideo
                </Button>
              ) : (
                <label className="grid cursor-pointer gap-1 rounded-lg border border-dashed p-4 text-sm hover:bg-muted">
                  <span className="font-medium text-primary">Wybierz lub nagraj wideo</span>
                  <span className="text-muted-foreground">
                    MP4, MOV lub WebM, maks. 20 MB. Najlepiej 15–45 sekund kluczowej sytuacji.
                  </span>
                  <input
                    type="file"
                    accept={VIDEO_ACCEPT}
                    className="sr-only"
                    aria-label="Plik wideo"
                    onChange={(e) => {
                      pickVideo(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              {existingVideo && !videoFile && (
                <p className="text-xs text-muted-foreground">
                  Po usunięciu możesz dodać nowe wideo i zapisać zmiany.
                </p>
              )}
              {progress !== null && (
                <div className="grid gap-1" aria-live="polite">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Wysyłanie wideo… {Math.round(progress * 100)}%</span>
                </div>
              )}
              {usage !== undefined && usage >= STORAGE_WARN_BYTES && (
                <p className="text-sm text-warn">
                  Kończy się miejsce na pliki wideo ({formatMb(usage)} z 50 MB). Usuń starsze wideo w Ustawieniach — inaczej najstarsze zostaną usunięte automatycznie.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <Input
                type="url"
                inputMode="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/… lub link z Dysku Google"
                aria-label="Link do wideo"
              />
              <p className="text-xs text-muted-foreground">
                YouTube, Dysk Google i Vimeo odtworzą się w Psienniku. Na Dysku ustaw „Każda osoba mająca link”.
              </p>
              {videoUrl.trim() && parseVideoUrl(videoUrl) && <VideoLinkPlayer url={videoUrl.trim()} />}
            </div>
          )}
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
          <Button type="submit" disabled={saving || deleting}>
            {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Dodaj"}
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
