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


// ---------- Galeria wydarzenia: zdjęcia, wideo i linki ----------

export type MediaFileItem = { type: "photo" | "video"; path: string; size: number };
export type MediaLinkItem = { type: "link"; url: string };
export type MediaItem = MediaFileItem | MediaLinkItem;

export const MAX_PHOTOS = 5;
export const MAX_VIDEOS = 1;
export const MAX_LINKS = 10;
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/*,video/mp4,video/quicktime,video/webm,video/*";

/** Odczytuje galerię wpisu (z obsługą starych pojedynczych pól wideo). */
export function entryMedia(entry: {
  media?: unknown;
  video_path?: string | null;
  video_size?: number | null;
  video_url?: string | null;
}): MediaItem[] {
  const list: MediaItem[] = [];
  if (Array.isArray(entry.media)) {
    for (const raw of entry.media as { type?: unknown; path?: unknown; size?: unknown; url?: unknown }[]) {
      if (!raw || typeof raw !== "object") continue;
      if ((raw.type === "photo" || raw.type === "video") && typeof raw.path === "string")
        list.push({ type: raw.type, path: raw.path, size: Number(raw.size ?? 0) });
      else if (raw.type === "link" && typeof raw.url === "string") list.push({ type: "link", url: raw.url });
    }
  }
  if (list.length === 0) {
    if (entry.video_path) list.push({ type: "video", path: entry.video_path, size: Number(entry.video_size ?? 0) });
    if (entry.video_url) list.push({ type: "link", url: entry.video_url });
  }
  return list;
}

export function countMedia(media: MediaItem[], type: MediaItem["type"]): number {
  return media.filter((m) => m.type === type).length;
}

/** Sprawdza, czy plik można dodać do galerii. Zwraca komunikat błędu albo null. */
export function validateMediaFile(file: { size: number; type: string }, media: MediaItem[]): string | null {
  if (file.type.startsWith("image/")) {
    if (countMedia(media, "photo") >= MAX_PHOTOS) return `Możesz dodać maksymalnie ${MAX_PHOTOS} zdjęć.`;
    if (file.size > VIDEO_MAX_BYTES) return "Zdjęcie jest za duże — maksymalnie 20 MB.";
    return null;
  }
  if (file.type.startsWith("video/")) {
    if (countMedia(media, "video") >= MAX_VIDEOS) return "Możesz dodać tylko 1 wideo. Usuń obecne, aby dodać inne.";
    if (file.size > VIDEO_MAX_BYTES) return VIDEO_TOO_BIG_MESSAGE;
    return null;
  }
  return "Wybierz zdjęcie (JPG, PNG, WebP) albo wideo (MP4, MOV, WebM).";
}

export function validateMediaLink(raw: string, media: MediaItem[]): string | null {
  if (countMedia(media, "link") >= MAX_LINKS) return `Możesz dodać maksymalnie ${MAX_LINKS} linków.`;
  const t = raw.trim();
  if (t.length > 500 || !parseVideoUrl(t)) return "Wklej poprawny link zaczynający się od https://";
  return null;
}

export function isImageUrl(raw: string): boolean {
  try {
    return /\.(jpe?g|png|webp|gif|avif)$/i.test(new URL(raw).pathname);
  } catch {
    return false;
  }
}

/** Czy z linku da się pokazać kadr (YouTube albo bezpośredni obrazek). */
export function linkHasThumb(url: string): boolean {
  if (isImageUrl(url)) return true;
  const e = parseVideoUrl(url);
  return e?.kind === "iframe" && e.provider === "youtube";
}

/**
 * Miniatura na liście wydarzeń: pierwszy plik → link z kadrem →
 * "icon" (tylko linki bez kadru) → null (brak materiałów, łapka).
 */
export function pickListThumb(media: MediaItem[]): MediaItem | "icon" | null {
  const file = media.find((m) => m.type !== "link");
  if (file) return file;
  const link = media.find((m) => m.type === "link" && linkHasThumb(m.url));
  if (link) return link;
  return media.length > 0 ? "icon" : null;
}
