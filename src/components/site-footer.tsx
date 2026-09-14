import { Link } from "@tanstack/react-router";
import { OPERATOR, contactEmailLabel } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-3 px-5 py-8 text-sm text-muted-foreground md:flex md:items-center md:justify-between">
        <p className="leading-relaxed">
          Psiennik — {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.city}
          <br />
          NIP {OPERATOR.nip} · REGON {OPERATOR.regon} · kontakt:{" "}
          {OPERATOR.email ? (
            <a className="underline" href={`mailto:${OPERATOR.email}`}>
              {OPERATOR.email}
            </a>
          ) : (
            contactEmailLabel()
          )}
        </p>
        <nav className="flex gap-4">
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
