import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Bell, ChevronDown, LogOut, PawPrint, Plus, Settings, User, UserPlus } from "lucide-react";
import logoAsset from "@/assets/psiennik-logo-3.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { useIsBehaviorist } from "@/lib/access";
import { useDogs } from "@/lib/dogs";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";
import { InviteClientDialog } from "@/components/behaviorist-invite";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatStamp(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl });
  } catch {
    return "";
  }
}

export function AppHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: isBehaviorist } = useIsBehaviorist();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addDogOpen, setAddDogOpen] = useState(false);

  const items = notifications ?? [];
  const unread = items.filter((item) => !item.read_at).length;

  const openNotification = (item: AppNotification) => {
    if (!item.read_at) markRead.mutate(item.id);
    if (item.dog_id && item.entry_id) {
      navigate({
        to: "/pies/$id/wydarzenie/$entryId",
        params: { id: item.dog_id, entryId: item.entry_id },
        search: { wroc: undefined },
      });
      return;
    }
    if (item.dog_id) {
      navigate({ to: "/pies/$id", params: { id: item.dog_id } });
      return;
    }
    navigate({ to: "/psy" });
  };

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
                <OwnerDogNavigation onAddDog={() => setAddDogOpen(true)} />
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
            {isBehaviorist === false && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-1 hidden gap-1.5 lg:inline-flex"
                onClick={() => setAddDogOpen(true)}
              >
                Dodaj psa
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            )}

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
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Powiadomienia</DropdownMenuLabel>
                  {unread > 0 && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        markAllRead.mutate();
                      }}
                    >
                      Oznacz wszystkie
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">Brak nowości</div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {items.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        className="items-start gap-2"
                        onClick={() => openNotification(item)}
                      >
                        {!item.read_at && (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          />
                        )}
                        <span className={`min-w-0 flex-1 ${item.read_at ? "opacity-70" : ""}`}>
                          <span className="block text-sm whitespace-normal">{item.title}</span>
                          {item.body && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.body}
                            </span>
                          )}
                          <span className="block text-xs text-muted-foreground">
                            {formatStamp(item.created_at)}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden min-h-10 items-center gap-2 px-2 text-sm md:flex lg:px-3">
              <User className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden max-w-28 truncate lg:inline">
                {profile?.display_name || profile?.email || "Konto"}
              </span>
            </div>

            <Button variant="ghost" size="icon" aria-label="Wyloguj się" onClick={signOut}>
              <LogOut className="size-4" />
            </Button>

            {isBehaviorist && <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} />}
            {isBehaviorist === false && (
              <DogFormDialog open={addDogOpen} onOpenChange={setAddDogOpen} />
            )}
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

function OwnerDogNavigation({ onAddDog }: { onAddDog: () => void }) {
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onAddDog}>
            <Plus className="size-4" aria-hidden="true" />
            Dodaj psa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
