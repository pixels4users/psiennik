import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDog } from "@/lib/account.functions";
import { useDogAccess } from "@/lib/access";
import type { Dog } from "@/lib/dogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteDogButton({
  dog,
  onDeleted,
  className,
}: {
  dog: Dog;
  onDeleted?: () => void;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteDog);
  const { data: access } = useDogAccess(dog.id);
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const others = access?.filter((row) => row.user_id !== dog.owner_id).length ?? 0;
  const ready = word.trim().toLowerCase() === "usuń";

  const handleDelete = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      await remove({ data: { dogId: dog.id } });
      queryClient.removeQueries({ queryKey: ["dogs", dog.id] });
      queryClient.removeQueries({ queryKey: ["dog-access", dog.id] });
      await queryClient.invalidateQueries({ queryKey: ["dogs"] });
      queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
      toast.success(`Usunięto psa: ${dog.name}`);
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć psa");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        setOpen(v);
        if (!v) setWord("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className={className}>
          <Trash2 aria-hidden="true" />
          Usuń psa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć psa {dog.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Tej operacji nie można cofnąć.</strong> Znikną
                wszystkie wpisy, zalecenia, komentarze, zdjęcia i wideo psa oraz dostępy
                współwłaścicieli i behawiorystów.
              </p>
              {others > 0 && (
                <p>
                  Dostęp straci {others} {others === 1 ? "osoba" : others < 5 ? "osoby" : "osób"}.
                </p>
              )}
              <p>Jeśli chcesz zachować kopię, najpierw użyj „Pobierz moje dane” w Ustawieniach.</p>
              <p>
                Aby potwierdzić, wpisz poniżej słowo <strong>usuń</strong>.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Wpisz usuń"
          aria-label="Potwierdzenie usunięcia psa"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Anuluj</AlertDialogCancel>
          <Button variant="destructive" disabled={!ready || busy} onClick={handleDelete}>
            {busy ? "Usuwanie…" : "Usuń psa"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
