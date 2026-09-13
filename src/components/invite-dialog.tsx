import { useState } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Copy, Link, Trash2, RefreshCw, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useDogRole } from "@/lib/auth";
import {
  useCreateInvite,
  useDogAccess,
  useDogInvites,
  useRevokeAccess,
  useCompleteProcess,
} from "@/lib/access";
import type { Dog } from "@/lib/dogs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  owner: "Właściciel",
  coowner: "Współwłaściciel",
  behaviorist: "Behawiorysta",
};

const STATUS_LABELS: Record<string, string> = {
  active: "aktywna",
  completed: "zakończona",
  pending: "oczekująca",
};

export function AccessDialog({
  dog,
  open,
  onOpenChange,
}: {
  dog: Dog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: access, isLoading } = useDogAccess(dog.id);
  const { data: invites } = useDogInvites(dog.id);
  const { data: role } = useDogRole(dog.id);
  const createInvite = useCreateInvite(dog.id);
  const revoke = useRevokeAccess(dog.id);
  const complete = useCompleteProcess(dog.id);
  const [pendingRole, setPendingRole] = useState<"owner" | "behaviorist" | null>(null);

  const canInviteBehaviorist = role?.canManage;
  const canInviteCoOwner = role?.isPrimaryOwner;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kod skopiowany");
    } catch {
      toast.info(`Kod: ${code}`);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link skopiowany");
    } catch {
      toast.info(`Link: ${url}`);
    }
  };

  const generate = (roleType: "owner" | "behaviorist") => {
    setPendingRole(roleType);
    createInvite.mutate(roleType, {
      onSuccess: (invite) => {
        setPendingRole(null);
        toast.success(`Kod dla ${ROLE_LABELS[roleType === "owner" ? "coowner" : "behaviorist"]} został utworzony`);
        copy(invite.code);
      },
      onError: (err) => {
        setPendingRole(null);
        toast.error(err instanceof Error ? err.message : "Nie udało się utworzyć kodu");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Osoby z dostępem
          </DialogTitle>
          <DialogDescription>
            Zarządzaj współwłaścicielami i behawiorystą. Każdy zaproszony użytkownik otrzymuje kod.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          {(canInviteBehaviorist || canInviteCoOwner) && (
            <div className="grid gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Nowe zaproszenie
              </p>
              <div className="flex gap-2">
                {canInviteCoOwner && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={createInvite.isPending}
                    onClick={() => generate("owner")}
                  >
                    <Users className="mr-2 size-4" />
                    Współwłaściciel
                  </Button>
                )}
                {canInviteBehaviorist && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={createInvite.isPending}
                    onClick={() => generate("behaviorist")}
                  >
                    <UserPlus className="mr-2 size-4" />
                    Behawiorysta
                  </Button>
                )}
              </div>
              {pendingRole && (
                <p className="text-xs text-muted-foreground">
                  Tworzenie kodu dla {ROLE_LABELS[pendingRole === "owner" ? "coowner" : "behaviorist"]}…
                </p>
              )}
            </div>
          )}

          {invites && invites.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Aktywne kody
              </p>
              {invites.map((invite) => {
                const inviteUrl = `${window.location.origin}/auth?code=${encodeURIComponent(invite.code)}`;
                return (
                  <div
                    key={invite.id}
                    className="grid gap-2 rounded-lg bg-keylime px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl tracking-widest text-primary">
                          {invite.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invite.role === "owner" ? "Współwłaściciel" : "Behawiorysta"} · ważny do{" "}
                          {format(parseISO(invite.expires_at), "d MMMM yyyy", { locale: pl })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Kopiuj kod"
                          onClick={() => copy(invite.code)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Kopiuj link"
                          onClick={() => copyLink(inviteUrl)}
                        >
                          <Link className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Wyślij ten link osobie, którą zapraszasz. Po zalogowaniu lub rejestracji zostanie automatycznie dodana do psa.
                    </p>
                    <p className="truncate text-xs text-primary">{inviteUrl}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Dostęp do psa
            </p>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              access?.map((row) => {
                const isMe = row.user_id === user?.id;
                const isPrimaryOwner = row.role === "owner" && row.user_id === dog.owner_id;
                const isCoOwner = row.role === "owner" && row.user_id !== dog.owner_id;
                const isBehaviorist = row.role === "behaviorist";
                const canRevoke =
                  (role?.isPrimaryOwner && !isMe) ||
                  (role?.role === "coowner" && isBehaviorist) ||
                  (isMe && !isPrimaryOwner);
                const canComplete = isMe && isBehaviorist && row.process_status === "active";

                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {isMe ? "Ty" : row.profile?.display_name || row.profile?.email || "Użytkownik"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPrimaryOwner
                          ? "Właściciel"
                          : isCoOwner
                            ? "Współwłaściciel"
                            : `Behawiorysta · ${STATUS_LABELS[row.process_status] ?? row.process_status}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {canComplete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={complete.isPending}
                          onClick={() =>
                            complete.mutate(undefined, {
                              onSuccess: () => toast.success("Proces zakończony"),
                              onError: (err) =>
                                toast.error(err instanceof Error ? err.message : "Błąd"),
                            })
                          }
                        >
                          <RefreshCw className={cn("mr-1 size-3", complete.isPending && "animate-spin")} />
                          Zakończ
                        </Button>
                      )}
                      {canRevoke && (
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
