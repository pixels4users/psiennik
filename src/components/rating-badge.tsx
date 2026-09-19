import { cn } from "@/lib/utils";
import { RATINGS, labelFor } from "@/lib/dogs";

const RATING_STYLES: Record<string, string> = {
  green: "bg-good/15 text-foreground",
  amber: "bg-warn/15 text-foreground",
  red: "bg-bad/15 text-foreground",
};

const RATING_DOTS: Record<string, string> = {
  green: "bg-good",
  amber: "bg-warn",
  red: "bg-bad",
};

export function RatingBadge({ rating, className }: { rating: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        RATING_STYLES[rating] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", RATING_DOTS[rating] ?? "bg-muted-foreground")} />
      {labelFor(RATINGS, rating)}
    </span>
  );
}

export function ratingToneClass(rating: string | null): string {
  switch (rating) {
    case "green":
      return "bg-good/15";
    case "amber":
      return "bg-warn/20";
    case "red":
      return "bg-bad/15";
    default:
      return "";
  }
}
