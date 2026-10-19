import { Coffee } from "lucide-react";
import { BUYCOFFEE_URL } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SNOOZE_DAYS_AFTER_LATER,
  SNOOZE_DAYS_AFTER_SUPPORT,
  snoozeCoffeePrompt,
} from "@/lib/coffee-prompt";

export function CoffeePromptDialog({
  open,
  onOpenChange,
  onCloseComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Wywoływane po każdym zamknięciu (przyciski, krzyżyk, Escape). */
  onCloseComplete?: () => void;
}) {
  const close = () => {
    onOpenChange(false);
    onCloseComplete?.();
  };

  const handleSupport = () => {
    void snoozeCoffeePrompt(SNOOZE_DAYS_AFTER_SUPPORT);
    window.open(BUYCOFFEE_URL, "_blank", "noopener,noreferrer");
    close();
  };

  const handleLater = () => {
    void snoozeCoffeePrompt(SNOOZE_DAYS_AFTER_LATER);
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10">
            <Coffee className="size-6 text-primary" aria-hidden="true" />
          </span>
          <DialogTitle className="text-xl">Postawisz mi kawę?</DialogTitle>
          <DialogDescription className="text-base">
            Hej, widzę, że aktywnie korzystasz z Psiennika — bardzo mnie to cieszy!
            Aplikacja jest i pozostanie darmowa, bez reklam. Jeśli chcesz wesprzeć
            jej utrzymanie i rozwój, możesz postawić mi kawę.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 pt-2">
          <Button onClick={handleSupport} className="gap-2">
            <Coffee className="size-4" aria-hidden="true" />
            Postaw kawę
          </Button>
          <Button variant="ghost" onClick={handleLater}>
            Może później
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
