import { Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type JournalRating = "good" | "warn" | "bad";

const RATING_STYLES: Record<JournalRating, string> = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
};

type DogJournalPreviewCardProps = {
  name: string;
  imageUrl: string;
  imageAlt: string;
  activity: string;
  description: string;
  timeOfDay: string;
  rating: JournalRating;
  ratingLabel: string;
};

export function DogJournalPreviewCard({
  name,
  imageUrl,
  imageAlt,
  activity,
  description,
  timeOfDay,
  rating,
  ratingLabel,
}: DogJournalPreviewCardProps) {
  return (
    <Card className="h-full overflow-hidden border bg-card shadow-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 motion-safe:hover:scale-[1.03]"
        />
        <div className="absolute right-4 bottom-4 rounded-md bg-background/95 px-3 py-1.5 font-display text-xl leading-none text-primary shadow-sm">
          {name}
        </div>
      </div>

      <CardContent className="grid gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 text-xl font-semibold leading-tight text-primary">{activity}</h3>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {timeOfDay}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="flex items-center gap-2 border-t pt-4 text-xs font-medium text-foreground">
          <span className={cn("size-2.5 rounded-full", RATING_STYLES[rating])} aria-hidden="true" />
          Ocena: {ratingLabel}
        </div>
      </CardContent>
    </Card>
  );
}