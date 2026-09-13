import { useEffect, useState } from "react";
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

function InviteCard({
  invite,
  roleLabel,
}: {
  invite: { id: string; code: string; role: "owner" | "behaviorist"; expires_at: string };
  roleLabel: string;
}) {
  const inviteUrl = `${window.location.origin}/auth?code=${encodeURIComponent(invite.code)}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} skopiowany`);
    } catch {
      toast.info(`${label}: ${text}`);
    }
  };

  return (
    <div className="grid gap-2 rounded-lg bg-keylime px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl tracking-widest text-primary">{invite.code}</p>
          <p className="text-xs text-muted-foreground">
            {roleLabel} · ważny do{" "}
            {format(parseISO(invite.expires_at), "d MMMM yyyy", { locale: pl })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Kopiuj kod" onClick={() => copy(invite.code, "Kod")}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Kopiuj link" onClick={() => copy(inviteUrl, "Link")}>
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
}

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

  const [coOwnerOpen, setCoOwnerOpen] = useState(false);
  const [behavioristOpen, setBehavioristOpen] = useState(false);

  const coOwnerRow = access?.find((row) => row.role === "owner" && row.user_id !== dog.owner_id);
  const behavioristRow = access?.find((row) => row.role === "behaviorist");

  const ownerInvites = invites?.filter((invite) => invite.role === "owner") ?? [];
  const behavioristInvites = invites?.filter((invite) => invite.role === "behaviorist") ?? [];

  const canInviteCoOwner = role?.isPrimaryOwner && !coOwnerRow;
  const canInviteBehaviorist = role?.canManage && !behavioristRow;

  useEffect(() => {
    if (coOwnerRow || ownerInvites.length > 0) setCoOwnerOpen(true);
  }, [coOwnerRow, ownerInvites.length]);

  useEffect(() => {
    if (behavioristRow || behavioristInvites.length > 0) setBehavioristOpen(true);
  }, [behavioristRow, behavioristInvites.length]);

  const generate = (roleType: "owner" | "behaviorist") => {
    createInvite.mutate(roleType, {
      onSuccess: (invite) => {
        toast.success(`Kod dla ${ROLE_LABELS[roleType === "owner" ? "coowner" : "behaviorist"]} został utworzony`);
        try {
          navigator.clipboard.writeText(invite.code);
        } catch {
          toast.info(`Kod: ${invite.code}`);
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Nie udało się utworzyć kodu");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Osoby z dostępem
          </DialogTitle>
          <DialogDescription>
            Zarządzaj współwłaścicielami i behawiorystą. Każdy zaproszony użytkownik otrzymuje kod.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          {/* Współwłaściciel */}
          <section className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-foreground">Współwłaściciel</h3>
                <p className="text-sm text-muted-foreground">
                  {coOwnerRow
                    ? (coOwnerRow.profile?.display_name || coOwnerRow.profile?.email || "Użytkownik")
                    : "nie ma współwłaściciela"}
                </p>
              </div>
              {canInviteCoOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={createInvite.isPending}
                  onClick={() => setCoOwnerOpen(true)}
                >
                  <Users className="mr-2 size-4" />
                  Dodaj
                </Button>
              )}
            </div>
            {coOwnerOpen && (
              <div className="mt-4 grid gap-3">
                {!coOwnerRow && (
                  <p className="text-sm text-muted-foreground">
                    Współwłaściciel ma takie same uprawnienia jak właściciel, ale nie może usunąć głównego właściciela.
                  </p>
                )}
                {ownerInvites.length === 0 && !coOwnerRow && (
                  <Button
                    variant="secondary"
                    disabled={createInvite.isPending}
                    onClick={() => generate("owner")}
                  >
                    <Users className="mr-2 size-4" />
                    Wygeneruj kod dla współwłaściciela
                  </Button>
                )}
                {ownerInvites.map((invite) => (
                  <InviteCard key={invite.id} invite={invite} roleLabel="Współwłaściciel" />
                ))}
              </div>
            )}
          </section>

          {/* Behawiorysta */}
          <section className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-foreground">Behawiorysta</h3>
                <p className="text-sm text-muted-foreground">
                  {behavioristRow
                    ? `${behavioristRow.profile?.display_name || behavioristRow.profile?.email || "Behawiorysta"} · proces ${STATUS_LABELS[behavioristRow.process_status] ?? behavioristRow.process_status}`
                    : "nie ma behawiorysty"}
                </p>
              </div>
              {canInviteBehaviorist && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={createInvite.isPending}
                  onClick={() => setBehavioristOpen(true)}
                >
                  <UserPlus className="mr-2 size-4" />
                  Dodaj
                </Button>
              )}
            </div>
            {behavioristOpen && (
              <div className="mt-4 grid gap-3">
                {!behavioristRow && (
                  <p className="text-sm text-muted-foreground">
                    Behawiorysta widzi wpisy i może dodawać zalecenia, ale nie edytuje wydarzeń.
                  </p>
                )}
                {behavioristInvites.length === 0 && !behavioristRow && (
                  <Button
                    variant="secondary"
                    disabled={createInvite.isPending}
                    onClick={() => generate("behaviorist")}
                  >
                    <UserPlus className="mr-2 size-4" />
                    Wygeneruj kod dla behawiorysty
                  </Button>
                )}
                {behavioristInvites.map((invite) => (
                  <InviteCard key={invite.id} invite={invite} roleLabel="Behawiorysta" />
                ))}
              </div>
            )}
          </section>

          {/* Osoby z dostępem */}
          <section className="grid gap-2">
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
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
