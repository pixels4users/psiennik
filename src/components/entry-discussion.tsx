import { useState } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useEntryComments,
  useAddComment,
  useEditComment,
  useDeleteComment,
  commentRoleLabel,
} from "@/lib/comments";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const fmtDateTime = (iso: string) => format(parseISO(iso), "d.MM.yyyy, HH:mm", { locale: pl });

/**
 * Płaska, chronologiczna dyskusja przy wydarzeniu — rozmowa robocza,
 * odrębna od formalnego zalecenia behawiorysty.
 */
export function EntryDiscussion({
  entryId,
  canDiscuss,
}: {
  entryId: string;
  canDiscuss: boolean;
}) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useEntryComments(entryId);
  const addComment = useAddComment();
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await addComment.mutateAsync({ entryId, body: draft });
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się dodać komentarza");
    }
  };

  const handleEdit = async (id: string) => {
    if (!editDraft.trim()) return;
    try {
      await editComment.mutateAsync({ id, entryId, body: editDraft });
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać komentarza");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment.mutateAsync({ id, entryId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć komentarza");
    }
  };

  return (
    <section className="grid gap-4" aria-labelledby="discussion-heading">
      <h2 id="discussion-heading" className="text-2xl">
        Dyskusja
      </h2>

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Brak komentarzy. {canDiscuss ? "Rozpocznij rozmowę o tym wydarzeniu." : ""}
        </p>
      ) : (
        <ol className="grid gap-3">
          {(comments ?? []).map((comment) => {
            if (comment.deleted_at) {
              return (
                <li
                  key={comment.id}
                  className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground"
                >
                  Komentarz usunięty · {fmtDateTime(comment.deleted_at)}
                </li>
              );
            }

            const isOwn = comment.author_id === user?.id;
            const isEditing = editingId === comment.id;

            return (
              <li key={comment.id} className="grid gap-1.5 rounded-lg bg-secondary px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">
                    {comment.authorName ?? "Usunięty użytkownik"}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {commentRoleLabel(comment.author_role)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <time dateTime={comment.created_at}>{fmtDateTime(comment.created_at)}</time>
                    {canDiscuss && isOwn && !isEditing && (
                      <>
                        <button
                          type="button"
                          aria-label="Edytuj komentarz"
                          className="text-primary transition-colors hover:text-primary/80"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditDraft(comment.body);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Usuń komentarz"
                          className="text-destructive transition-colors hover:text-destructive/80"
                          onClick={() => void handleDelete(comment.id)}
                          disabled={deleteComment.isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </span>
                </div>

                {isEditing ? (
                  <div className="grid gap-2">
                    <Textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Anuluj
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleEdit(comment.id)}
                        disabled={editComment.isPending || !editDraft.trim()}
                      >
                        {editComment.isPending ? "Zapisywanie…" : "Zapisz"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {comment.body}
                  </p>
                )}

                {comment.edited_at && !isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Komentarz edytowany · {fmtDateTime(comment.edited_at)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {canDiscuss && (
        <form onSubmit={handleAdd} className="grid gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Napisz komentarz…"
            rows={3}
            aria-label="Nowy komentarz"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={addComment.isPending || !draft.trim()}>
              {addComment.isPending ? "Wysyłanie…" : "Dodaj komentarz"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
