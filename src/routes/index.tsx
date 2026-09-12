import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarRange, MessageSquareText, PawPrint } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroAsset from "@/assets/hero.jpg.asset.json";
import avatarAsset from "@/assets/avatar.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Psiennik — dziennik behawioralny psa" },
      {
        name: "description",
        content:
          "Wspólny dziennik behawioralny psa dla właścicieli i behawiorystów: wydarzenia dnia, oceny, kalendarz i zalecenia.",
      },
      { property: "og:title", content: "Psiennik — dziennik behawioralny psa" },
      {
        property: "og:description",
        content:
          "Wspólny dziennik behawioralny psa dla właścicieli i behawiorystów: wydarzenia dnia, oceny, kalendarz i zalecenia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: PawPrint,
    title: "Wydarzenia dnia",
    description: "Spacery, treningi i trudne sytuacje zapisane w kilka sekund, z prostą oceną.",
  },
  {
    icon: CalendarRange,
    title: "Kalendarz i analiza",
    description: "Widok tygodniowy z kolorami ocen oraz wykresy pokazujące postępy psa.",
  },
  {
    icon: MessageSquareText,
    title: "Behawiorysta w zespole",
    description: "Zaproś behawiorystkę kodem — dopisze komentarze i zalecenia do wydarzeń.",
  },
];

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/psy", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <h1 className="max-w-xl text-4xl leading-tight text-primary md:text-5xl lg:text-6xl">
              Lepsza współpraca. Szybsze postępy psa.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Wspólny dziennik treningowy dla Ciebie i behawiorysty. Wiedza i instrukcje, które
              nigdy nie giną.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/auth">Jestem właścicielem</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-primary text-primary hover:bg-slate-50 sm:w-auto"
              >
                <Link to="/auth">Jestem behawiorystą</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroAsset.url}
              alt="Para z border collie na spacerze"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="w-full bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <img
              src={heroAsset.url}
              alt="Para z border collie na spacerze"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-lg text-2xl leading-snug text-primary md:text-3xl lg:text-4xl">
              Aplikacja przetestowana na prawdziwych spacerach i brudnych łapach.
            </p>
            <div className="flex items-center gap-3">
              <img
                src={avatarAsset.url}
                alt="Pies na spacerze"
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Zespół Psiennika + setki testujących czworonogów
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border bg-slate-50 shadow-none rounded-xl">
              <CardContent className="grid gap-4 p-6">
                <Icon className="size-7 text-primary" />
                <h2 className="text-2xl text-primary">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
