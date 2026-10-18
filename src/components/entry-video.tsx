import { useState } from "react";
import { ExternalLink, Link2, Play } from "lucide-react";
import { isImageUrl, parseVideoUrl, useVideoUrl, type MediaItem, type MediaLinkItem } from "@/lib/video";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Paw } from "@/components/dog-motifs";
import { cn } from "@/lib/utils";

export function VideoFilePlayer({ path, src: localSrc, autoPlay }: { path?: string | null; src?: string; autoPlay?: boolean }) {
  const { data: signed, isError } = useVideoUrl(localSrc ? null : path);
  const src = localSrc ?? signed;
  if (isError) return <p className="text-sm text-muted-foreground">Nie udało się wczytać wideo.</p>;
  if (!src) return <Skeleton className="aspect-video w-full rounded-xl" />;
  return (
    <video
      src={src}
      controls
      playsInline
      autoPlay={autoPlay}
      preload="metadata"
      className="max-h-[80vh] w-full rounded-xl bg-muted"
    />
  );
}

export function VideoLinkPlayer({ url }: { url: string }) {
  const embed = parseVideoUrl(url);
  if (!embed) return null;
  if (isImageUrl(url)) {
    return <img src={url} alt="Zdjęcie z wydarzenia" className="max-h-[80vh] w-full rounded-xl object-contain" />;
  }
  if (embed.kind === "link") {
    return (
      <a
        href={embed.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-primary underline underline-offset-4"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        Otwórz link
      </a>
    );
  }
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-muted",
        embed.vertical ? "mx-auto aspect-[9/16] w-full max-w-xs" : "aspect-video w-full",
      )}
    >
      <iframe
        src={embed.src}
        title="Materiał z wydarzenia"
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="size-full border-0"
      />
    </div>
  );
}

function youtubeThumb(url: string): string | null {
  const embed = parseVideoUrl(url);
  if (embed?.kind === "iframe" && embed.provider === "youtube") {
    const id = embed.src.split("/").pop();
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }
  return null;
}

/** Kwadratowy podgląd jednego materiału (zdjęcie, kadr wideo, link). */
export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  const { data: signed } = useVideoUrl(item.type === "link" ? null : item.path);
  const base = cn("relative overflow-hidden rounded-lg bg-muted", className);
  if (item.type === "photo") {
    return (
      <div className={base}>
        {signed ? <img src={signed} alt="" loading="lazy" className="size-full object-cover" /> : <Skeleton className="size-full" />}
      </div>
    );
  }
  if (item.type === "video") {
    return (
      <div className={base}>
        {signed ? (
          <video src={`${signed}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
        ) : (
          <Skeleton className="size-full" />
        )}
        <PlayBadge />
      </div>
    );
  }
  return <LinkThumb url={(item as MediaLinkItem).url} base={base} />;
}

function LinkThumb({ url, base }: { url: string; base: string }) {
  const item = { url };
  const yt = youtubeThumb(item.url);
  const img = yt ?? (isImageUrl(item.url) ? item.url : null);
  const embed = parseVideoUrl(item.url);
  return (
    <div className={base}>
      {img ? (
        <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
          <Link2 className="size-5 text-primary" aria-hidden="true" />
          <span className="line-clamp-2 break-all">{hostOf(item.url)}</span>
        </div>
      )}
      {embed?.kind === "iframe" && <PlayBadge />}
    </div>
  );
}

function PlayBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="flex size-9 items-center justify-center rounded-full bg-background/85 text-primary shadow">
        <Play className="size-4 fill-current" aria-hidden="true" />
      </span>
    </span>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Placeholder dla wydarzeń bez zdjęć i wideo. */
export function MediaPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg bg-secondary", className)} aria-hidden="true">
      <Paw className="w-1/2 text-primary/25" />
    </div>
  );
}

function itemLabel(item: MediaItem): string {
  if (item.type === "photo") return "Zdjęcie";
  if (item.type === "video") return "Wideo";
  return "Link";
}

/** Pełny podgląd jednego materiału. */
function MediaFull({ item }: { item: MediaItem }) {
  const { data: signed } = useVideoUrl(item.type === "photo" ? item.path : null);
  if (item.type === "photo") {
    return signed ? (
      <img src={signed} alt="Zdjęcie z wydarzenia" className="max-h-[85vh] w-full rounded-xl object-contain" />
    ) : (
      <Skeleton className="aspect-video w-full rounded-xl" />
    );
  }
  if (item.type === "video") return <VideoFilePlayer path={item.path} autoPlay />;
  return <VideoLinkPlayer url={(item as MediaLinkItem).url} />;
}

/** Galeria wydarzenia: siatka miniatur i podgląd na pełnym ekranie. */
export function MediaGallery({ media }: { media: MediaItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (media.length === 0) return null;
  const current = open !== null ? media[open] : null;
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {media.map((item, i) => {
          const plain = item.type === "link" && parseVideoUrl(item.url)?.kind === "link" && !isImageUrl(item.url);
          return (
            <li key={item.type === "link" ? `l-${i}-${item.url}` : item.path}>
              {plain && item.type === "link" ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
                  <MediaThumb item={item} className="aspect-square" />
                  <span className="sr-only">Otwórz link w nowej karcie</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="block w-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Powiększ: ${itemLabel(item)} ${i + 1}`}
                >
                  <MediaThumb item={item} className="aspect-square transition-opacity hover:opacity-90" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-5xl gap-3 p-3 sm:p-4">
          <DialogTitle className="sr-only">{current ? itemLabel(current) : "Podgląd"}</DialogTitle>
          {current && <MediaFull item={current} />}
          {media.length > 1 && open !== null && (
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="rounded px-3 py-1.5 hover:bg-muted" onClick={() => setOpen((open - 1 + media.length) % media.length)}>
                ‹ Poprzednie
              </button>
              <span className="text-muted-foreground">
                {open + 1} / {media.length}
              </span>
              <button type="button" className="rounded px-3 py-1.5 hover:bg-muted" onClick={() => setOpen((open + 1) % media.length)}>
                Następne ›
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

