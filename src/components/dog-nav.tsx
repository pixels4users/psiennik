import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dog } from "@/lib/dogs";

export function DogNav({ dog, active }: { dog: Dog; active: "lista" | "kalendarz" }) {
  return (
    <div className="grid gap-4">
      <Link
        to="/psy"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Wszystkie psy
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{dog.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-secondary p-1">
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
        </div>
      </div>
    </div>
  );
}
