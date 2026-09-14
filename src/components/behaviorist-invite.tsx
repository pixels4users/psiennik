import { useEffect } from "react";
import { Copy, Link as LinkIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useBehavioristLink, useCreateBehavioristLink } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function copyText(text: string, message: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(message),
    () => toast.info(text),
  );
}

function inviteUrl(code: string) {
  const origin = typeof window === "undefined" ? "https://psiennik.pl" : window.location.origin;
  return `${origin}/auth?code=${encodeURIComponent(code)}`;
}

function CodeActions({ code }: { code: string }) {
  const create = useCreateBehavioristLink();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Kopiuj kod"
        onClick={() => copyText(code, "Kod skopiowany")}
      >
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Kopiuj link"
        onClick={() => copyText(inviteUrl(code), "Link skopiowany")}
      >
        <LinkIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Wygeneruj nowy kod"
        disabled={create.isPending}
        onClick={() =>
          create.mutate(undefined, {
            onSuccess: (l) => copyText(l.invite_code, "Nowy kod skopiowany"),
          })
        }
      >
        <RefreshCw className={cn("size-4", create.isPending && "animate-spin")} />
      </Button>
    </div>
  );
}

/** Kompaktowy pasek z kodem zapraszającym behawiorysty. */
export function BehavioristCodeBar({ children }: { children?: React.ReactNode }) {
  const { data: link, isLoading } = useBehavioristLink();

  if (isLoading) return <Skeleton className="mt-4 h-14 w-full rounded-lg" />;
  if (!link) return children ? <div className="mt-4 rounded-lg bg-secondary p-3 text-sm">{children}</div> : null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-keylime px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="font-display text-2xl tracking-widest text-primary">{link.invite_code}</p>
        {children && <span className="text-sm text-muted-foreground">{children}</span>}
      </div>
      <CodeActions code={link.invite_code} />
    </div>
  );
}

/** Okno „Zaproś klienta” — tworzy kod, gdy jeszcze go nie ma. */
export function InviteClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { data: link, isLoading } = useBehavioristLink();
  const create = useCreateBehavioristLink();

  useEffect(() => {
    if (open && !isLoading && !link && !create.isPending && !create.isSuccess) {
      create.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, link]);

  const code = link?.invite_code ?? create.data?.invite_code ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Zaproś klienta
          </DialogTitle>
          <DialogDescription>
            Wyślij ten link właścicielowi. Po rejestracji jego psy trafią pod Twoją opiekę.
          </DialogDescription>
        </DialogHeader>

        {!code ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <div className="grid gap-3 rounded-lg bg-keylime px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-3xl tracking-widest text-primary">{code}</p>
              <CodeActions code={code} />
            </div>
            <p className="truncate text-xs text-primary">{inviteUrl(code)}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zamknij
          </Button>
          <Button disabled={!code} onClick={() => code && copyText(inviteUrl(code), "Link skopiowany")}>
            Kopiuj link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Karta z kodem zapraszającym — używana w profilu. */
export function BehavioristInviteCard() {
  const { data: link, isLoading } = useBehavioristLink();
  const create = useCreateBehavioristLink();

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Kod zapraszający</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : link ? (
          <div className="grid gap-3 rounded-lg bg-keylime px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-3xl tracking-widest text-primary">
                {link.invite_code}
              </p>
              <CodeActions code={link.invite_code} />
            </div>
            <p className="truncate text-xs text-primary">{inviteUrl(link.invite_code)}</p>
          </div>
        ) : (
          <Button
            className="justify-self-start"
            disabled={create.isPending}
            onClick={() =>
              create.mutate(undefined, {
                onSuccess: (l) => copyText(l.invite_code, "Kod skopiowany"),
              })
            }
          >
            <RefreshCw className={cn("mr-2 size-4", create.isPending && "animate-spin")} />
            Wygeneruj kod
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
