import { useState } from "react";
import {
  Pencil,
  MessageSquarePlus,
  MessageSquareText,
  MessagesSquare,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import {
  ACTIVITY_TYPES,
  ACTIVITY_ICONS,
  labelFor,
  entryActivities,
  entryTimes,
  timesLabel,
  type Entry,
} from "@/lib/dogs";
import { RatingBadge } from "@/components/rating-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EntryCard({
  entry,
  canEdit,
  canRecommend,
  commentCount,
  onEdit,
  onRecommend,
  onOpenDetails,
}: {
  entry: Entry;
  canEdit: boolean;
  canRecommend: boolean;
  commentCount?: number;
  onEdit?: (entry: Entry) => void | Promise<void>;
  onRecommend?: (entry: Entry) => void;
  onOpenDetails?: (entry: Entry) => void;
}) {
  const activities = entryActivities(entry);
  const times = entryTimes(entry);
  const [openingEdit, setOpeningEdit] = useState(false);

  const handleEdit = async () => {
    if (!onEdit || openingEdit) return;
    setOpeningEdit(true);
    try {
      await onEdit(entry);
    } catch {
      setOpeningEdit(false);
    }
  };

  return (
    <Card className="entry-card shadow-none">
      <CardContent className="grid gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1.5">
            <h3 className="font-display text-xl font-semibold leading-tight text-primary">
              {entry.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {activities.map((value) => {
                const Icon = ACTIVITY_ICONS[value];
                return (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-primary"
                  >
                    {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                    {labelFor(ACTIVITY_TYPES, value)}
                  </span>
                );
              })}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {timesLabel(times)}
          </span>
        </div>

        {entry.description && (
          <p className="text-sm leading-relaxed text-foreground/80">{entry.description}</p>
        )}

        {entry.behaviorist_comment ? (
          <div className="grid gap-1.5 rounded-lg bg-keylime p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                <MessageSquareText className="size-3.5" />
                Zalecenie behawiorysty
              </p>
              {canRecommend && onRecommend && (
                <Button variant="ghost" size="sm" onClick={() => onRecommend(entry)}>
                  Edytuj
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-secondary-foreground">
              {entry.behaviorist_comment}
            </p>
          </div>
        ) : (
          canRecommend &&
          onRecommend && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => onRecommend(entry)}
            >
              <MessageSquarePlus className="size-4" />
              Dodaj zalecenie
            </Button>
          )
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <RatingBadge rating={entry.rating} />
            <button
              type="button"
              onClick={() => onOpenDetails?.(entry)}
              disabled={!onOpenDetails}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:text-muted-foreground"
            >
              <MessagesSquare className="size-4" aria-hidden="true" />
              Komentarze ({commentCount ?? 0})
            </button>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleEdit()}
                disabled={openingEdit}
                aria-busy={openingEdit}
              >
                {openingEdit ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Pencil className="size-4" />
                )}
                Edytuj
              </Button>
            )}
            {onOpenDetails && (
              <Button size="sm" onClick={() => onOpenDetails(entry)}>
                Szczegóły
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
