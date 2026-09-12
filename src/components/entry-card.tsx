import { Pencil, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { ACTIVITY_TYPES, TIMES_OF_DAY, labelFor, type Entry } from "@/lib/dogs";
import { RatingBadge } from "@/components/rating-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EntryCard({
  entry,
  canEdit,
  canComment,
  onEdit,
  onComment,
}: {
  entry: Entry;
  canEdit: boolean;
  canComment: boolean;
  onEdit?: (entry: Entry) => void;
  onComment?: (entry: Entry) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h3 className="font-display text-xl leading-tight">{entry.title}</h3>
            <p className="text-sm text-muted-foreground">
              {labelFor(ACTIVITY_TYPES, entry.activity_type)} ·{" "}
              {labelFor(TIMES_OF_DAY, entry.time_of_day)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RatingBadge rating={entry.rating} />
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edytuj wydarzenie"
                onClick={() => onEdit(entry)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {entry.description && (
          <p className="text-sm leading-relaxed text-foreground/80">{entry.description}</p>
        )}

        {entry.behaviorist_comment ? (
          <div className="grid gap-1.5 rounded-lg bg-keylime p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                <MessageSquareText className="size-3.5" />
                Komentarz behawiorysty
              </p>
              {canComment && onComment && (
                <Button variant="ghost" size="sm" onClick={() => onComment(entry)}>
                  Edytuj
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-secondary-foreground">
              {entry.behaviorist_comment}
            </p>
          </div>
        ) : (
          canComment &&
          onComment && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => onComment(entry)}
            >
              <MessageSquarePlus className="size-4" />
              Dodaj komentarz
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
