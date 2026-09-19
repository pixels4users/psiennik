import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, PawPrint, Settings, User, UserPlus } from "lucide-react";
import logoAsset from "@/assets/psiennik-logo-3.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { useIsBehaviorist } from "@/lib/access";
import { useDogs } from "@/lib/dogs";
import { useNews } from "@/lib/notifications";
import { InviteClientDialog } from "@/components/behaviorist-invite";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: isBehaviorist } = useIsBehaviorist();
  const { data: news } = useNews();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const total = (news ?? []).reduce((sum, item) => sum + item.count, 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="border-b border-primary/10 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-5">
          <Link to={user ? "/psy" : "/"} aria-label="Psiennik — strona główna">
            <img
              src={logoAsset.url}
              alt="Psiennik"
              width={152}
              height={56}
              className="h-9 w-auto sm:h-11"
            />
          </Link>

          {user && (
            <nav className="flex min-w-0 items-center gap-1" aria-label="Główna nawigacja">
              {isBehaviorist === false ? (
                <OwnerDogNavigation />
              ) : (
                <Link
                  to="/psy"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary sm:px-3"
                  activeProps={{ className: "bg-secondary font-medium text-primary" }}
                  activeOptions={{ exact: true }}
                >
                  <PawPrint className="size-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {isBehaviorist ? "Psy pod opieką" : "Psy"}
                  </span>
                  <span className="sm:hidden">Psy</span>
                </Link>
              )}
              <Link
                to="/profil"
                aria-label="Ustawienia"
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-secondary md:flex"
                activeProps={{ className: "bg-secondary font-medium text-primary" }}
              >
                <Settings className="size-4" aria-hidden="true" />
                Ustawienia
              </Link>
            </nav>
          )}
        </div>

        {user ? (
          <div className="flex shrink-0 items-center gap-1">
            {isBehaviorist && (
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="size-4" />
                Zaproś klienta
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Powiadomienia">
                  <Bell className="size-5" />
                  {total > 0 && (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground">
                      {total > 9 ? "9+" : total}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  {isBehaviorist ? "Nowe wpisy" : "Nowe zalecenia"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {total === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">Brak nowości</div>
                ) : (
                  news!.map((item) => (
                    <DropdownMenuItem
                      key={item.dogId}
                      onClick={() => navigate({ to: "/pies/$id", params: { id: item.dogId } })}
                    >
                      <span className="flex-1">{item.dogName}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/profil"
              aria-label="Ustawienia konta"
              className="flex min-h-10 items-center gap-2 rounded-full px-2 text-sm transition-colors hover:bg-secondary md:hidden lg:flex lg:px-3"
              activeProps={{ className: "bg-secondary font-medium text-primary" }}
            >
              <User className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden max-w-28 truncate lg:inline">
                {profile?.display_name || profile?.email || "Konto"}
              </span>
            </Link>

            <Button variant="ghost" size="icon" aria-label="Wyloguj się" onClick={signOut}>
              <LogOut className="size-4" />
            </Button>

            {isBehaviorist && <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} />}
          </div>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to="/auth">Zaloguj się / Załóż konto</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

function OwnerDogNavigation() {
  const { data: dogs, isLoading } = useDogs();
  const compact = (dogs?.length ?? 0) >= 4;

  if (isLoading) {
    return (
      <span className="flex min-h-10 items-center gap-1.5 px-2.5 text-sm text-muted-foreground">
        <PawPrint className="size-4" aria-hidden="true" />
        Psy
      </span>
    );
  }

  if (!dogs?.length) {
    return (
      <Link
        to="/psy"
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary"
        activeProps={{ className: "bg-secondary font-medium text-primary" }}
      >
        <PawPrint className="size-4" aria-hidden="true" />
        Psy
      </Link>
    );
  }

  return (
    <>
      <div className={compact ? "hidden" : "hidden items-center gap-1 lg:flex"}>
        {dogs.map((dog) => (
          <Link
            key={dog.id}
            to="/pies/$id"
            params={{ id: dog.id }}
            className="max-w-32 truncate rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            activeProps={{ className: "bg-secondary font-medium text-primary" }}
          >
            {dog.name}
          </Link>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={compact ? "gap-1.5" : "gap-1.5 lg:hidden"}>
            <PawPrint className="size-4" aria-hidden="true" />
            Psy
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Wybierz psa</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {dogs.map((dog) => (
            <DropdownMenuItem key={dog.id} asChild>
              <Link to="/pies/$id" params={{ id: dog.id }} className="w-full">
                {dog.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
