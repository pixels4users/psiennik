import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Entry } from "@/lib/dogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RecommendationDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: Entry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setComment(entry?.behaviorist_comment ?? "");
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("entries")
        .update({ behaviorist_comment: comment.trim() || null })
        .eq("id", entry.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["entries", entry.dog_id] });
      toast.success("Zalecenie zapisane");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać zalecenia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Zalecenie behawiorysty
          </DialogTitle>
          <DialogDescription>
            {entry ? `Wydarzenie: ${entry.title}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="comment">Zalecenia / uwagi</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="np. Powtarzać ćwiczenie z miską, skrócić spacer do 30 min…"
              rows={4}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
