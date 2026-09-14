import { Link } from "@tanstack/react-router";
import { OPERATOR } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 text-sm text-muted-foreground md:flex md:items-center md:justify-between">
        <p className="leading-relaxed">
          {OPERATOR.name} ·{" "}
          <a className="underline" href={`mailto:${OPERATOR.email}`}>
            {OPERATOR.email}
          </a>
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/kontakt" className="underline hover:text-primary">
            Kontakt
          </Link>
          <Link to="/regulamin" className="underline hover:text-primary">
            Regulamin
          </Link>
          <Link to="/prywatnosc" className="underline hover:text-primary">
            Polityka prywatności
          </Link>
        </nav>
      </div>
    </footer>
  );
}
