import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dog, TriangleAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Bieżący stan połączenia — aktualizowany na zdarzeniach online/offline. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return online;
}

/** Wspólny komunikat stanu na stronach psa — z ponowieniem i powrotem do listy psów. */
export function DogNotice({
  icon,
  title,
  description,
  onRetry,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </div>
      <h1 className="mt-4 font-display text-3xl font-light text-primary">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && <Button onClick={onRetry}>Spróbuj ponownie</Button>}
        <Button variant={onRetry ? "outline" : "default"} asChild>
          <Link to="/psy">Twoje psy</Link>
        </Button>
      </div>
    </div>
  );
}

/** Pies nie istnieje, identyfikator jest nieprawidłowy albo dostęp został odebrany. */
export function DogUnavailableNotice() {
  return (
    <DogNotice
      icon={<Dog className="size-6" aria-hidden="true" />}
      title="Ten pies jest niedostępny"
      description="Pies nie istnieje albo nie masz do niego dostępu."
    />
  );
}

/** Błąd pobrania danych psa — z możliwością ponowienia. */
export function DogErrorNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <DogNotice
      icon={<TriangleAlert className="size-6" aria-hidden="true" />}
      title="Nie udało się wczytać psa"
      description="Coś poszło nie tak podczas pobierania danych. Spróbuj jeszcze raz."
      onRetry={onRetry}
    />
  );
}

/** Błąd pobrania wpisów dziennika. */
export function EntriesErrorNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <DogNotice
      icon={<TriangleAlert className="size-6" aria-hidden="true" />}
      title="Nie udało się wczytać wpisów"
      description="Coś poszło nie tak podczas pobierania dziennika. Spróbuj jeszcze raz."
      onRetry={onRetry}
    />
  );
}

/** Brak połączenia z internetem. */
export function DogOfflineNotice() {
  return (
    <DogNotice
      icon={<WifiOff className="size-6" aria-hidden="true" />}
      title="Brak połączenia z internetem"
      description="Sprawdź połączenie i wróć tutaj — dane wczytamy ponownie."
    />
  );
}
