import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, Check, Trash2, Upload, Video, Link2, X } from "lucide-react";
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
  const [entryId] = useState(() => entry?.id ?? crypto.randomUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoPath, setVideoPath] = useState<string | null>(() => entry?.video_path ?? null);
  const [videoSize, setVideoSize] = useState<number | null>(() => entry?.video_size ?? null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(() => entry?.video_url ?? "");
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
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

  const uploadPicked = async () => {
    if (!videoFile) return;
    setUploading(true);
    try {
      const freed = await ensureSpaceFor(videoFile.size);
      if (freed > 0) {
        toast.info(
          freed === 1
            ? "Usunięto najstarsze wideo, aby zrobić miejsce."
            : `Usunięto ${freed} najstarsze wideo, aby zrobić miejsce.`,
        );
      }
      setProgress(0);
      const path = await uploadVideo(videoFile, dogId, entryId, setProgress);
      setVideoPath(path);
      setVideoSize(videoFile.size);
      setVideoFile(null);
      void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["video-files"] });
      toast.success("Wideo przesłane");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się przesłać wideo");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const removeAttachedVideo = async () => {
    const path = videoPath;
    setVideoPath(null);
    setVideoSize(null);
    // Nowo przesłany plik (jeszcze nie zapisany w wydarzeniu) usuwamy od razu.
    if (path && path !== (entry?.video_path ?? null)) {
      await supabase.storage.from(VIDEO_BUCKET).remove([path]);
      void queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["video-files"] });
    }
  };

  const attachLink = () => {
    const trimmed = urlDraft.trim();
    if (!parseVideoUrl(trimmed)) {
      toast.error("Wklej poprawny link zaczynający się od https://");
      return;
    }
    setVideoUrl(trimmed);
    setUrlDraft("");
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
    if (videoFile && !videoPath) {
      toast.error("Kliknij „Prześlij wideo” albo usuń wybrany plik");
      return;
    }
    if (urlDraft.trim() && !videoUrl) {
      toast.error("Kliknij „Załącz link” albo wyczyść pole linku");
      return;
    }
    setSaving(true);
    try {
      const originalPath = entry?.video_path ?? null;
      if (originalPath && originalPath !== videoPath) {
        await supabase.storage.from(VIDEO_BUCKET).remove([originalPath]);
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
        video_size: videoPath ? videoSize : null,
        video_url: videoUrl || null,
      };
      const { error } = isEdit
        ? await supabase.from("entries").update(payload).eq("id", entry.id)
        : await supabase.from("entries").insert({ ...payload, id: entryId });
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
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            className="sr-only"
            aria-label="Plik wideo"
            tabIndex={-1}
            onChange={(e) => {
              pickVideo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {videoPath ? (
            <div className="grid gap-2">
              <VideoFilePlayer path={videoPath} />
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-good">
                  <Check className="size-4" /> Wideo załączone
                </span>
                <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={saving || uploading} onClick={() => void removeAttachedVideo()}>
                  <X className="size-4" /> Usuń wideo
                </Button>
              </div>
            </div>
          ) : videoFile && videoPreview ? (
            <div className="grid gap-2">
              <VideoFilePlayer src={videoPreview} />
              <p className="text-xs text-muted-foreground">
                {videoFile.name} · {formatMb(videoFile.size)}
              </p>
              {progress !== null ? (
                <div className="grid gap-1" aria-live="polite">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Wysyłanie wideo… {Math.round(progress * 100)}%</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void uploadPicked()} disabled={uploading}>
                    <Upload className="size-4" /> Prześlij wideo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setVideoFile(null)} disabled={uploading}>
                    <X className="size-4" /> Usuń
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickVideo(e.dataTransfer.files?.[0]);
              }}
              className="grid gap-2 rounded-lg border border-dashed p-4 text-sm"
            >
              <Button type="button" size="sm" className="w-fit" onClick={() => fileInputRef.current?.click()}>
                <Video className="size-4" /> Prześlij wideo
              </Button>
              <span className="text-muted-foreground">
                Albo przeciągnij plik tutaj. MP4, MOV lub WebM, maks. 20 MB. Najlepiej 15–45 sekund kluczowej sytuacji.
              </span>
            </div>
          )}
          {usage !== undefined && usage >= STORAGE_WARN_BYTES && (
            <p className="text-sm text-warn">
              Kończy się miejsce na pliki wideo ({formatMb(usage)} z 50 MB). Usuń starsze wideo w Ustawieniach — inaczej najstarsze zostaną usunięte automatycznie.
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="entry-video-url" className="text-sm font-normal text-muted-foreground">
              Lub wklej link do wideo
            </Label>
            {videoUrl ? (
              <div className="grid gap-2">
                <VideoLinkPlayer url={videoUrl} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-good">
                    <Check className="size-4" /> Link załączony
                  </span>
                  <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setVideoUrl("")}>
                    <X className="size-4" /> Usuń
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="entry-video-url"
                      type="url"
                      inputMode="url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="https://youtu.be/… lub link z Dysku Google"
                      className="pr-9"
                    />
                    {urlDraft && (
                      <button type="button" aria-label="Wyczyść link" onClick={() => setUrlDraft("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={attachLink} disabled={!urlDraft.trim()}>
                    <Link2 className="size-4" /> Załącz link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  YouTube, Dysk Google i Vimeo odtworzą się w Psienniku. Na Dysku ustaw „Każda osoba mająca link”.
                </p>
              </>
            )}
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
