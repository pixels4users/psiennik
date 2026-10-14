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
          <Link to="/poradnik" className="underline hover:text-primary">
            Poradniki
          </Link>
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
        <a href="https://buycoffee.to/psiennik" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img
            src="https://buycoffee.to/static/img/share/share-button-primary--pl.png"
            alt="Postaw kawę dla Psiennik na buycoffee.to"
            width={234}
            height={61}
            loading="lazy"
            className="h-auto w-[180px] sm:w-[234px]"
          />
        </a>
      </div>
    </footer>
  );
}
