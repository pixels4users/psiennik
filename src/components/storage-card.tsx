import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { ImageIcon, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import {
  STORAGE_LIMIT_BYTES,
  STORAGE_WARN_BYTES,
  deleteVideos,
  formatMb,
  useStorageUsage,
  useVideoFiles,
} from "@/lib/video";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StorageCard() {
  const queryClient = useQueryClient();
  const { data: usage, isLoading } = useStorageUsage();
  const { data: videos } = useVideoFiles();
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (path: string, dogId: string | null) => {
    setBusy(path);
    try {
      await deleteVideos([path]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storage-usage"] }),
        queryClient.invalidateQueries({ queryKey: ["video-files"] }),
        dogId ? queryClient.invalidateQueries({ queryKey: ["entries", dogId] }) : Promise.resolve(),
      ]);
      toast.success("Plik usunięty");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć pliku");
    } finally {
      setBusy(null);
    }
  };

  const used = usage ?? 0;
  const pct = Math.min(100, Math.round((used / STORAGE_LIMIT_BYTES) * 100));

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Miejsce na pliki</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          <div className="grid gap-1.5">
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Zajęte miejsce">
              <div className={used >= STORAGE_WARN_BYTES ? "h-full bg-warn" : "h-full bg-primary"} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              Zajęte {formatMb(used)} z 250 MB (wszystkie zdjęcia i wideo).
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Maksymalnie 200 MB na plik. Gdy zabraknie miejsca na nowy plik, Twoje najstarsze zdjęcia i wideo zostaną trwale usunięte automatycznie, także zdjęcia profilowe psów. Opisy, oceny, zalecenia i komentarze zostają.
        </p>
        {used >= STORAGE_WARN_BYTES && (
          <p className="text-sm font-medium text-warn">Kończy się miejsce na pliki. Najstarsze zdjęcia i wideo mogą zostać usunięte przy następnym przesyłaniu.</p>
        )}
        {videos && videos.length > 0 ? (
          <ul className="grid divide-y rounded-lg border">
            {videos.map((v) => (
              <li key={v.path} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {v.kind === "photo" ? <ImageIcon className="size-4 shrink-0 text-primary" aria-hidden="true" /> : <Video className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.entry_title ?? "Plik bez wydarzenia"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[v.dog_name, v.entry_date && format(parseISO(v.entry_date), "d MMM yyyy", { locale: pl }), formatMb(v.size)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy === v.path}
                  onClick={() => void remove(v.path, v.dog_id)}
                  aria-label={`Usuń plik: ${v.entry_title ?? "bez wydarzenia"}`}
                >
                  <Trash2 className="size-4" />
                  Usuń
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          videos && <p className="text-sm text-muted-foreground">Nie masz jeszcze żadnych zdjęć ani wideo w wydarzeniach.</p>
        )}
      </CardContent>
    </Card>
  );
}
