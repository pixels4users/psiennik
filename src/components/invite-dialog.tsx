import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCreateInvite, useDogAccess, useDogInvites, useRevokeAccess } from "@/lib/access";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function InviteDialog({
  dogId,
  open,
  onOpenChange,
}: {
  dogId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: access, isLoading } = useDogAccess(dogId);
  const { data: invites } = useDogInvites(dogId);
  const createInvite = useCreateInvite(dogId);
  const revoke = useRevokeAccess(dogId);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kod skopiowany");
    } catch {
      toast.info(`Kod: ${code}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Zaproś behawiorystkę
          </DialogTitle>
          <DialogDescription>
            Wygeneruj kod i przekaż go behawiorystce — wpisze go u siebie i zobaczy dziennik psa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Button
              onClick={() =>
                createInvite.mutate(undefined, {
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Nie udało się utworzyć kodu"),
                })
              }
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? "Tworzenie…" : "Wygeneruj kod"}
            </Button>

            {invites?.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-keylime px-4 py-3"
              >
                <div>
                  <p className="font-display text-2xl tracking-widest text-primary">
                    {invite.code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ważny do {format(parseISO(invite.expires_at), "d MMMM yyyy", { locale: pl })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Kopiuj kod"
                  onClick={() => copy(invite.code)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Dostęp do psa
            </p>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              access?.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {row.profile?.display_name || row.profile?.email || "Użytkownik"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.role === "owner" ? "Właściciel" : "Behawiorysta"}
                    </p>
                  </div>
                  {row.role === "behaviorist" && row.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Cofnij dostęp"
                      onClick={() =>
                        revoke.mutate(row.id, {
                          onSuccess: () => toast.success("Dostęp cofnięty"),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
