import { Link, useNavigate } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";
import { useRole, type Role } from "@/lib/role";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Właściciel",
  behaviorist: "Behawiorysta",
};

export function AppHeader() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <PawPrint className="size-5 text-primary" />
          <span className="font-display text-2xl leading-none text-primary">Psiennik</span>
        </Link>
        {role && (
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  navigate({ to: "/psy" });
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  role === r ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-accent/60",
                )}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
