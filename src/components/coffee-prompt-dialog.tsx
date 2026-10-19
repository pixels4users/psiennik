import { Coffee, CupSoda, Heart } from "lucide-react";

const COFFEE_BASE = "https://buycoffee.to/psiennik";
const COFFEE_OPTIONS = [
  { size: "small", amount: "9 zł", Icon: Coffee },
  { size: "medium", amount: "16 zł", Icon: Heart },
  { size: "large", amount: "25 zł", Icon: CupSoda },
] as const;
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
        <p className="pt-2 text-center text-sm font-semibold text-foreground">
          Postaw kawę za:
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {COFFEE_OPTIONS.map(({ size, amount, Icon }) => (
            <a
              key={size}
              href={`${COFFEE_BASE}?coffeeSize=${size}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSupport}
              aria-label={`Postaw kawę za ${amount}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-card-foreground shadow-sm transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-7 text-primary" aria-hidden="true" />
              <span className="text-lg font-semibold">{amount}</span>
            </a>
          ))}
        </div>
        <div className="grid gap-2">

          <Button variant="ghost" onClick={handleLater}>
            Może później
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
