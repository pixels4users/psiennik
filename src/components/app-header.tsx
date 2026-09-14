import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, PawPrint, User, UserPlus } from "lucide-react";
import logoAsset from "@/assets/psiennik-logo-3.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { useIsBehaviorist } from "@/lib/access";
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
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link to={user ? "/psy" : "/"} aria-label="Psiennik — strona główna">
            <img
              src={logoAsset.url}
              alt="Psiennik"
              width={152}
              height={56}
              className="h-10 w-auto"
            />
          </Link>

          {user && (
            <nav className="flex min-w-0 items-center">
              <Link
                to="/psy"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                activeProps={{ className: "bg-secondary font-medium text-primary" }}
                activeOptions={{ exact: true }}
              >
                <PawPrint className="size-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isBehaviorist ? "Psy pod opieką" : "Twoje psy"}
                </span>
                <span className="sm:hidden">Psy</span>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 sm:px-3">
                  <User className="size-4" />
                  <span className="hidden max-w-32 truncate sm:inline">
                    {profile?.display_name || profile?.email || "Moje konto"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  {isBehaviorist ? "Behawiorysta" : "Właściciel"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isBehaviorist && (
                  <DropdownMenuItem className="sm:hidden" onClick={() => setInviteOpen(true)}>
                    Zaproś klienta
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                  Mój profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Wyloguj się</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
