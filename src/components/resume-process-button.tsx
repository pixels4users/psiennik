import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resumeErrorMessage, useResumeProcess, useSubscriptionLimits } from "@/lib/access";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Wznowienie zakończonej współpracy — widoczne tylko dla behawiorysty przy danym psie. */
export function ResumeProcessButton({
  dogId,
  dogName,
  className,
  variant = "default",
  size = "default",
}: {
  dogId: string;
  dogName: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const resume = useResumeProcess(dogId);
  const limits = useSubscriptionLimits();

  function handleConfirm() {
    if (limits.atLimit) {
      toast.error(
        `Nie możesz wznowić współpracy — masz już maksymalną liczbę aktywnych procesów (${limits.active}/${limits.max}). Zakończ jeden z nich, aby zwolnić miejsce.`,
      );
      setOpen(false);
      return;
    }
    resume.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Współpraca przy psie ${dogName} została wznowiona`);
        setOpen(false);
      },
      onError: (err) => toast.error(resumeErrorMessage(err, dogName)),
    });
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <RefreshCw className={cn("size-4", resume.isPending && "animate-spin")} />
        Wznów współpracę
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wznowić współpracę przy psie {dogName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pies wróci do aktywnych, cała dotychczasowa historia pozostaje bez zmian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resume.isPending}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={resume.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              Wznów współpracę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
