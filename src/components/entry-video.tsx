import { ExternalLink } from "lucide-react";
import { parseVideoUrl, useVideoUrl } from "@/lib/video";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function VideoFilePlayer({ path, src: localSrc }: { path?: string | null; src?: string }) {
  const { data: signed, isError } = useVideoUrl(localSrc ? null : path);
  const src = localSrc ?? signed;
  if (isError) return <p className="text-sm text-muted-foreground">Nie udało się wczytać wideo.</p>;
  if (!src) return <Skeleton className="aspect-video w-full rounded-xl" />;
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className="max-h-[70vh] w-full rounded-xl bg-muted"
    />
  );
}

export function VideoLinkPlayer({ url }: { url: string }) {
  const embed = parseVideoUrl(url);
  if (!embed) return null;
  if (embed.kind === "link") {
    return (
      <a
        href={embed.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-primary underline underline-offset-4"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        Otwórz wideo
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
        title="Wideo z wydarzenia"
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

export function EntryVideo({ entry }: { entry: { video_path: string | null; video_url: string | null } }) {
  if (entry.video_path) return <VideoFilePlayer path={entry.video_path} />;
  if (entry.video_url) return <VideoLinkPlayer url={entry.video_url} />;
  return null;
}
