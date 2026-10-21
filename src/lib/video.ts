import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { STORAGE_FULL_MESSAGE, VIDEO_BUCKET, VIDEO_TOO_BIG_MESSAGE } from "@/lib/video-core";
import { reclaimStorage } from "@/lib/storage.functions";
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
  kind: "photo" | "video";
};

export async function fetchStorageUsage(): Promise<number> {
  const { data, error } = await supabase.rpc("my_storage_usage");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function fetchVideoFiles(): Promise<VideoFile[]> {
  const { data, error } = await supabase.rpc("my_media_files");
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
  await supabase.rpc("remove_entry_media", { paths });
}

/** Robi miejsce na nowy plik, usuwając najstarsze własne zdjęcia i wideo. */
export async function ensureSpaceFor(size: number, protectedPaths: string[] = []) {
  return reclaimStorage({ data: { size, protectedPaths } });
}

/** Wysyła zdjęcie (zmniejszone) lub wideo do galerii wydarzenia. */
export async function uploadMediaFile(
  file: File,
  dogId: string,
  entryId: string,
  onProgress?: (fraction: number) => void,
  protectedPaths: string[] = [],
  onReclaimed?: (removed: { bucket: string; path: string }[]) => void,
): Promise<{ path: string; size: number; type: "photo" | "video" }> {
  if (file.type.startsWith("image/")) {
    const { shrinkPhoto } = await import("@/lib/dogs");
    const blob = await shrinkPhoto(file);
    const name = blob === file ? file.name : "zdjecie.jpg";
    const body = new File([blob], name, { type: blob.type || file.type });
    const { removed } = await ensureSpaceFor(body.size, protectedPaths);
    onReclaimed?.(removed);
    const path = await uploadVideo(body, dogId, entryId, onProgress);
    return { path, size: body.size, type: "photo" };
  }
  const { removed } = await ensureSpaceFor(file.size, protectedPaths);
  onReclaimed?.(removed);
  const path = await uploadVideo(file, dogId, entryId, onProgress);
  return { path, size: file.size, type: "video" };
}

/** Wysyła plik z paskiem postępu. */
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
      else reject(new Error("Nie udało się wysłać pliku"));
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
    staleTime: 1000 * 60 * 4,
    queryFn: async (): Promise<string> => {
      if (!path) throw new Error("Brak ścieżki pliku");
      const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(path, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
