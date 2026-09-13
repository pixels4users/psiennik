import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, User } from "lucide-react";
import logoAsset from "@/assets/psiennik-logo-3.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { useIsBehaviorist } from "@/lib/access";
import { useNews } from "@/lib/notifications";
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

  const total = (news ?? []).reduce((sum, item) => sum + item.count, 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to={user ? "/psy" : "/"} aria-label="Psiennik — strona główna">
          <img
            src={logoAsset.url}
            alt="Psiennik"
            width={152}
            height={56}
            className="h-10 w-auto"
          />
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
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
                <Button variant="ghost" className="gap-2">
                  <User className="size-4" />
                  <span className="max-w-32 truncate">
                    {profile?.display_name || profile?.email || "Moje konto"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  {isBehaviorist ? "Behawiorysta" : "Właściciel"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/psy" })}>Psy</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                  Mój profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Wyloguj się</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to="/auth">Zaloguj się</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
