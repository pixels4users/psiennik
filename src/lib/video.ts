import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const VIDEO_BUCKET = "dog-videos";
export const MB = 1024 * 1024;
/** Maksymalny rozmiar jednego pliku wideo. */
export const VIDEO_MAX_BYTES = 20 * MB;
/** Wspólny limit konta na zdjęcia psów i wideo. */
export const STORAGE_LIMIT_BYTES = 50 * MB;
/** Od tego progu pokazujemy ostrzeżenie o kończącym się miejscu. */
export const STORAGE_WARN_BYTES = 40 * MB;
export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,video/*";

export const VIDEO_TOO_BIG_MESSAGE = "Wideo jest za duże — maksymalnie 20 MB. Skróć nagranie albo wklej link.";
export const STORAGE_FULL_MESSAGE =
  "Brak miejsca na pliki. Usuń starsze zdjęcia psa albo wklej link do wideo.";

export function formatMb(bytes: number): string {
  const mb = bytes / MB;
  return `${mb < 10 ? mb.toFixed(1).replace(".", ",") : Math.round(mb)} MB`;
}

export function validateVideoFile(file: { size: number; type: string }): string | null {
  if (file.type && !file.type.startsWith("video/")) return "Wybierz plik wideo (MP4, MOV lub WebM).";
  if (file.size > VIDEO_MAX_BYTES) return VIDEO_TOO_BIG_MESSAGE;
  return null;
}

export type VideoEmbed =
  | { kind: "iframe"; src: string; provider: "youtube" | "drive" | "vimeo"; vertical: boolean }
  | { kind: "link"; href: string };

/** Zamienia wklejony link na adres odtwarzacza osadzonego. Zwraca null dla niepoprawnych adresów. */
export function parseVideoUrl(raw: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const idOk = (id: string | undefined | null) => !!id && /^[\w-]{6,}$/.test(id);

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (idOk(id)) return { kind: "iframe", provider: "youtube", vertical: false, src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    let id: string | null | undefined = null;
    let vertical = false;
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (parts[0] === "shorts") { id = parts[1]; vertical = true; }
    else if (parts[0] === "embed" || parts[0] === "live") id = parts[1];
    if (idOk(id)) return { kind: "iframe", provider: "youtube", vertical, src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "drive.google.com") {
    const m = url.pathname.match(/\/file\/d\/([\w-]+)/);
    const id = m?.[1] ?? url.searchParams.get("id");
    if (idOk(id)) return { kind: "iframe", provider: "drive", vertical: false, src: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
    if (id) return { kind: "iframe", provider: "vimeo", vertical: false, src: `https://player.vimeo.com/video/${id}` };
  }
  return { kind: "link", href: url.toString() };
}

export type VideoFile = {
  path: string;
  size: number;
  created_at: string;
  dog_id: string | null;
  dog_name: string | null;
  entry_id: string | null;
  entry_title: string | null;
  entry_date: string | null;
};

export async function fetchStorageUsage(): Promise<number> {
  const { data, error } = await supabase.rpc("my_storage_usage");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function fetchVideoFiles(): Promise<VideoFile[]> {
  const { data, error } = await supabase.rpc("my_video_files");
  if (error) throw error;
  return (data ?? []).map((v) => ({ ...v, size: Number(v.size) })) as VideoFile[];
}

export function useStorageUsage() {
  return useQuery({ queryKey: ["storage-usage"], queryFn: fetchStorageUsage });
}

export function useVideoFiles() {
  return useQuery({ queryKey: ["video-files"], queryFn: fetchVideoFiles });
}

/** Wybiera najstarsze wideo do usunięcia, aby zmieścić `needed` bajtów. */
export function pickVideosToFree(
  videos: { path: string; size: number }[],
  usage: number,
  needed: number,
  limit = STORAGE_LIMIT_BYTES,
): { paths: string[]; enough: boolean } {
  let free = limit - usage;
  const paths: string[] = [];
  for (const v of videos) {
    if (free >= needed) break;
    paths.push(v.path);
    free += v.size;
  }
  return { paths, enough: free >= needed };
}

/** Usuwa pliki wideo i czyści powiązanie w wydarzeniach. */
export async function deleteVideos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(VIDEO_BUCKET).remove(paths);
  if (error) throw error;
  await supabase
    .from("entries")
    .update({ video_path: null, video_size: null })
    .in("video_path", paths);
}

/** Robi miejsce na nowy plik, usuwając najstarsze wideo. Zwraca liczbę usuniętych nagrań. */
export async function ensureSpaceFor(size: number): Promise<number> {
  const [usage, videos] = await Promise.all([fetchStorageUsage(), fetchVideoFiles()]);
  const { paths, enough } = pickVideosToFree(videos, usage, size);
  if (!enough) throw new Error(STORAGE_FULL_MESSAGE);
  await deleteVideos(paths);
  return paths.length;
}

/** Wysyła wideo z paskiem postępu. */
export async function uploadVideo(
  file: File,
  dogId: string,
  entryId: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${dogId}/${entryId}/${crypto.randomUUID()}.${ext}`;
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Zaloguj się ponownie");
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/${VIDEO_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 413) reject(new Error(VIDEO_TOO_BIG_MESSAGE));
      else if (/row-level security|policy|Unauthorized/i.test(xhr.responseText) || xhr.status === 403)
        reject(new Error(STORAGE_FULL_MESSAGE));
      else reject(new Error("Nie udało się wysłać wideo"));
    };
    xhr.onerror = () => reject(new Error("Brak połączenia — nie udało się wysłać wideo"));
    xhr.send(file);
  });
  return path;
}

export function useVideoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["dog-video", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 45,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
