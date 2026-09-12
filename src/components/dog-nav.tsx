import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dog } from "@/lib/dogs";
import { useRole } from "@/lib/auth";
import { DogAvatar } from "@/components/dog-avatar";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { InviteDialog } from "@/components/invite-dialog";
import { Button } from "@/components/ui/button";

export function DogNav({
  dog,
  active,
}: {
  dog: Dog;
  active: "lista" | "kalendarz" | "tabela" | "analiza";
}) {
  const { role } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="grid gap-4">
      <Link
        to="/psy"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Wszystkie psy
      </Link>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex min-w-0 items-center gap-4">
          <DogAvatar dog={dog} className="size-20" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-4xl">{dog.name}</h1>
              {role === "owner" && (
                <>
                  <Button variant="ghost" size="icon" aria-label="Edytuj psa" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Zaproś behawiorystkę"
                    onClick={() => setInviteOpen(true)}
                  >
                    <UserPlus className="size-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-secondary p-1">
          <Link
            to="/pies/$id"
            params={{ id: dog.id }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active === "lista"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground hover:bg-accent/60",
            )}
          >
            Lista
          </Link>
          <Link
            to="/pies/$id/kalendarz"
            params={{ id: dog.id }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active === "kalendarz"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground hover:bg-accent/60",
            )}
          >
            Kalendarz
          </Link>
          <Link
            to="/pies/$id/tabela"
            params={{ id: dog.id }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active === "tabela"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground hover:bg-accent/60",
            )}
          >
            Tabela
          </Link>
          <Link
            to="/pies/$id/analiza"
            params={{ id: dog.id }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active === "analiza"
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground hover:bg-accent/60",
            )}
          >
            Analiza
          </Link>
        </div>
      </div>
      <DogFormDialog dog={dog} open={editOpen} onOpenChange={setEditOpen} />
      <InviteDialog dogId={dog.id} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
