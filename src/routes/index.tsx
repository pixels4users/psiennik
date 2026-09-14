import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarRange, MessageSquareText, PawPrint } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DogJournalPreviewCard } from "@/components/dog-journal-preview-card";
import heroAsset from "@/assets/hero.jpg.asset.json";
import socialProofAsset from "@/assets/social-proof.jpg.asset.json";
import dogProfile1Asset from "@/assets/dog-profile-1.jpg.asset.json";
import dogProfile2Asset from "@/assets/dog-profile-2.jpg.asset.json";
import dogProfile3Asset from "@/assets/dog-profile-3.jpg.asset.json";
import { SITE_URL, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: socialMeta({
      title: "Psiennik — dziennik behawioralny psa",
      description:
        "Wspólny dziennik behawioralny psa dla właścicieli i behawiorystów: wydarzenia dnia, oceny, kalendarz i zalecenia.",
      path: "/",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
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
    description: "Zaproś behawiorystkę kodem — doda zalecenia do wydarzeń.",
  },
];

const JOURNAL_PREVIEWS = [
  {
    name: "Humus",
    imageUrl: dogProfile1Asset.url,
    imageAlt: "Humus odpoczywający z głową na poduszce",
    activity: "Spokojny spacer",
    description: "Minęliśmy dwa psy bez szczekania. Pomogło zwiększenie dystansu i spokojna komenda.",
    timeOfDay: "Rano",
    rating: "good" as const,
    ratingLabel: "Dobrze",
  },
  {
    name: "Lunka",
    imageUrl: dogProfile2Asset.url,
    imageAlt: "Lunka jako czarny szczeniak z białymi łapkami",
    activity: "Trening zostawania",
    description: "Trzy krótkie serie po dwie minuty. Coraz łatwiej wraca na swoje miejsce po przerwie.",
    timeOfDay: "Południe",
    rating: "warn" as const,
    ratingLabel: "Wyzwanie",
  },
  {
    name: "Luna",
    imageUrl: dogProfile3Asset.url,
    imageAlt: "Luna odpoczywająca na kanapie",
    activity: "Wyciszenie w domu",
    description: "Po wizycie gości potrzebowała więcej czasu na odpoczynek, ale samodzielnie wybrała legowisko.",
    timeOfDay: "Wieczór",
    rating: "good" as const,
    ratingLabel: "Dobrze",
    icon: activityIcon("wypoczynek"),
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
              src={socialProofAsset.url}
              alt="Dwa psy bawiące się na trawie"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-lg text-2xl leading-snug text-primary md:text-3xl lg:text-4xl">
              Aplikacja przetestowana na prawdziwych spacerach i brudnych łapach.
            </p>
          </div>
        </div>
      </section>

      {/* Journal previews */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl lg:mb-14">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Dziennik w praktyce</p>
            <h2 className="text-3xl leading-tight text-primary md:text-4xl lg:text-5xl">
              Każdy pies ma swoją historię
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Zapisuj wydarzenia, reakcje i postępy. Ty i behawiorysta widzicie ten sam, uporządkowany
              obraz codzienności psa.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {JOURNAL_PREVIEWS.map((preview) => (
              <DogJournalPreviewCard key={preview.name} {...preview} />
            ))}
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
