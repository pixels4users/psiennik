import { useState, type RefObject } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { inviteErrorMessage, useRedeemInvite } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function JoinDialog({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const redeem = useRedeemInvite();
  const navigate = useNavigate();

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCode("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redeem.isPending || !code.trim()) return;
    setError(null);
    try {
      const { dogId } = await redeem.mutateAsync(code.trim());
      if (dogId) {
        toast.success("Pies dodany do Twojej listy");
        changeOpen(false);
        navigate({ to: "/pies/$id", params: { id: dogId } });
      } else {
        toast.success("Połączono z behawiorystą");
        changeOpen(false);
      }
    } catch (err) {
      setError(inviteErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current?.isConnected) {
            event.preventDefault();
            returnFocusRef.current.focus({ preventScroll: true });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Wpisz kod zaproszenia
          </DialogTitle>
          <DialogDescription>
            Wpisz kod zaproszenia otrzymany od właściciela psa lub kod behawiorysty.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Kod zaproszenia</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="np. K7T2QA"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby={error ? "invite-code-error" : undefined}
            />
            {error && (
              <p id="invite-code-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={redeem.isPending || !code.trim()}>
              {redeem.isPending ? "Sprawdzanie…" : "Użyj kodu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
