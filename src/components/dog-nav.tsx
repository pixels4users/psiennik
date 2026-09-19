import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Users,
  UserPlus,
  AlertCircle,
  BookOpen,
  CalendarDays,
  Table2,
  MessageSquareText,
  ChartNoAxesCombined,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDogs, type Dog } from "@/lib/dogs";
import { useAuth, useDogRole } from "@/lib/auth";
import { useDogAccess, useIsBehaviorist } from "@/lib/access";
import { rememberSelectedDog } from "@/lib/selected-dog";
import { DogAvatar } from "@/components/dog-avatar";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { AccessDialog } from "@/components/invite-dialog";
import { Paw } from "@/components/dog-motifs";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { key: "dziennik", label: "Dziennik", path: "/pies/$id", icon: BookOpen },
  { key: "kalendarz", label: "Kalendarz", path: "/pies/$id/kalendarz", icon: CalendarDays },
  { key: "tabela", label: "Tabela", path: "/pies/$id/tabela", icon: Table2 },
  { key: "zalecenia", label: "Zalecenia", path: "/pies/$id/zalecenia", icon: MessageSquareText },
  { key: "analiza", label: "Analiza", path: "/pies/$id/analiza", icon: ChartNoAxesCombined },
] as const;

export function DogNav({ dog, active }: { dog: Dog; active: (typeof VIEWS)[number]["key"] }) {
  const { user } = useAuth();
  const { data: role, isLoading } = useDogRole(dog.id);
  const { data: isBehaviorist } = useIsBehaviorist();
  const { data: access } = useDogAccess(dog.id);
  const [editOpen, setEditOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const hasCoOwner =
    access?.some((row) => row.role === "owner" && row.user_id !== dog.owner_id) ?? false;
  const coOwner = access?.find((row) => row.role === "owner" && row.user_id !== dog.owner_id);
  const coOwnerName = coOwner?.profile?.display_name || coOwner?.profile?.email;
  const behaviorist = access?.find((row) => row.role === "behaviorist");
  const behavioristName = behaviorist?.profile?.display_name || behaviorist?.profile?.email;

  useEffect(() => {
    if (isBehaviorist === false) rememberSelectedDog(dog.id, user?.id);
  }, [dog.id, user?.id, isBehaviorist]);

  return (
    <div className="grid min-w-0 gap-5">
      {isBehaviorist && (
        <div className="flex items-center">
          <Link
            to="/psy"
            className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Wszystkie psy
          </Link>
        </div>
      )}

      <section
        aria-label={`Profil psa ${dog.name}`}
        className="dog-masthead relative isolate overflow-hidden px-1 py-2 sm:px-2 sm:py-4"
      >
        <Paw className="pointer-events-none absolute -right-4 -top-5 -z-10 w-44 rotate-[22deg] text-sage/50" />
        <div className="grid min-w-0 gap-5 lg:grid-cols-[auto_minmax(0,1fr)_minmax(13rem,auto)_auto] lg:items-center lg:gap-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6 lg:contents">
            <DogAvatar dog={dog} className="size-20 sm:size-24" />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="min-w-0 text-3xl leading-none [overflow-wrap:anywhere] sm:text-5xl">
                  {dog.name}
                </h1>
                {!isLoading && role?.canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edytuj psa"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {role?.canManage && (
            <>
              <div className="grid min-w-0 gap-2 text-sm">
                <p className="min-w-0 text-muted-foreground">
                  Behawiorysta:{" "}
                  <span className="font-medium text-foreground [overflow-wrap:anywhere]">
                    {behavioristName || (behaviorist ? "Bez podanej nazwy" : "Brak")}
                  </span>
                </p>
                <p className="min-w-0 text-muted-foreground">
                  Współwłaściciel:{" "}
                  <span className="font-medium text-foreground [overflow-wrap:anywhere]">
                    {coOwnerName || (hasCoOwner ? "Bez podanej nazwy" : "Brak")}
                  </span>
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto w-fit justify-start px-0"
                  onClick={() => setAccessOpen(true)}
                >
                  <Users aria-hidden="true" />
                  Zarządzaj dostępem
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
              {role.canEditEntries && (
                <Button asChild className="w-full sm:w-fit lg:justify-self-end">
                  <Link
                    to="/pies/$id/wydarzenie/nowe"
                    params={{ id: dog.id }}
                    search={{ wroc: active === "kalendarz" ? "kalendarz" : undefined }}
                  >
                    <Plus />
                    Dodaj wydarzenie
                  </Link>
                </Button>
              )}
            </>
          )}
          {!role?.canManage && (
            <div className="hidden lg:block" aria-hidden="true" />
          )}
          {!role?.canManage && role?.canEditEntries && (
            <div className="hidden lg:block" aria-hidden="true" />
          )}
          {!role?.canManage && role?.canEditEntries && (
            <div>
              <Button asChild className="w-full sm:w-fit">
                <Link
                  to="/pies/$id/wydarzenie/nowe"
                  params={{ id: dog.id }}
                  search={{ wroc: active === "kalendarz" ? "kalendarz" : undefined }}
                >
                  <Plus />
                  Dodaj wydarzenie
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <nav
        aria-label="Widoki dziennika psa"
        className="dog-view-nav flex max-w-full gap-1 overflow-x-auto pb-2"
      >
        {VIEWS.map(({ key, label, path, icon: Icon }) => (
          <Link
            key={key}
            to={path}
            params={{ id: dog.id }}
            aria-current={active === key ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors sm:flex-1",
              active === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {role?.isReadOnly && (
        <div className="flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-foreground">
          <AlertCircle className="size-4 shrink-0 text-warn" />
          Współpraca z behawiorystą została zakończona — dziennik jest w trybie tylko do odczytu.
        </div>
      )}
      <DogFormDialog dog={dog} open={editOpen} onOpenChange={setEditOpen} />
      <AccessDialog dog={dog} open={accessOpen} onOpenChange={setAccessOpen} />
    </div>
  );
}
