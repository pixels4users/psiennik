import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { STORAGE_FULL_MESSAGE, VIDEO_BUCKET, VIDEO_TOO_BIG_MESSAGE, pickVideosToFree } from "@/lib/video-core";
export * from "@/lib/video-core";

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
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

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
