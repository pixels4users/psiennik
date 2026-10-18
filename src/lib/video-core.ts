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

