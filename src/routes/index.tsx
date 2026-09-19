import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, CalendarRange, Check, MessageSquareText, PawPrint } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DogDoodle, Paw, PawTrail } from "@/components/dog-motifs";
import { Reveal } from "@/components/reveal";
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
  },
];

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/psy", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="landing overflow-clip bg-background">
      <section className="landing-hero relative mx-auto max-w-7xl px-5 text-center sm:px-8">
        <p className="eyebrow flex items-center justify-center gap-2">
          <PawPrint className="size-4" aria-hidden="true" />
          Dla ludzi, którzy chcą lepiej rozumieć swoje psy
        </p>
        <h1 className="hero-title mx-auto mt-6 max-w-5xl">
          Zgrana paczka:
          <br />
          Ty, Twój pies i specjalista.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Wspólny dziennik treningowy dla Ciebie i specjalisty.
          <br className="hidden sm:block" /> Wiedza i instrukcje, które nigdy nie giną.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/auth" search={{ rola: "owner" }}>
              Jestem właścicielem
              <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ rola: "behaviorist" }}>
              Jestem behawiorystą
            </Link>
          </Button>
        </div>
        <a
          href="#dziennik-w-praktyce"
          className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground hover:text-primary"
        >
          Zajrzyj do dziennika
          <ArrowDown className="size-4" />
        </a>
        <PawTrail className="hero-paws hidden lg:block" />
      </section>

      <section id="dziennik-w-praktyce" className="showcase-section mx-auto max-w-6xl scroll-mt-8 px-5 sm:px-8">
        <div className="relative">
          <div className="showcase-frame grid gap-0 overflow-hidden rounded-[2rem] border border-primary/15 bg-secondary lg:grid-cols-[1.05fr_1fr]">
            <div className="relative min-h-72 overflow-hidden">
              <img
                src={heroAsset.url}
                alt="Para z border collie na spacerze"
                width="900"
                height="675"
                className="h-full max-h-[540px] w-full object-cover"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl bg-background/95 p-4 text-left sm:bottom-7 sm:left-7 sm:right-7">
                <Paw className="w-9 shrink-0 text-primary" />
                <p className="font-display text-2xl leading-tight text-primary">
                  Za każdym wpisem
                  <br />
                  stoi Wasz wspólny dzień.
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center p-5 text-left sm:p-9">
              <div className="mb-6 flex items-center justify-between gap-3">
                <p className="eyebrow">Tak wygląda Wasz dziennik</p>
                <span className="rounded-full border border-primary/20 px-2.5 py-1 text-xs text-primary">Przykład</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={dogProfile1Asset.url}
                  alt=""
                  width="56"
                  height="56"
                  className="size-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-display text-3xl leading-none text-primary">Humus</p>
                  <p className="mt-1 text-xs text-muted-foreground">Małe kroki, zapisane na co dzień</p>
                </div>
              </div>
              <Reveal distance="sm" className="mt-5 rounded-2xl border border-primary/10 bg-background p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Dziś · rano</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                    <span className="size-2 rounded-full bg-good" />
                    Dobrze
                  </span>
                </div>
                <h2 className="mt-3 text-3xl">Spokojny spacer</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Minęliśmy dwa psy bez szczekania. Pomogło zwiększenie dystansu i spokojna komenda.
                </p>
                <div className="mt-4 rounded-xl bg-secondary p-3.5">
                  <p className="flex items-center gap-2 text-xs font-medium text-primary">
                    <MessageSquareText className="size-4" />
                    Zalecenie behawiorysty
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-primary">
                    Zostańcie przy tym dystansie. Zwróć uwagę, jak szybko Humus wraca do spokoju.
                  </p>
                </div>
              </Reveal>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="size-4 text-primary" />
                Wydarzenie i zalecenie zawsze obok siebie.
              </p>
            </div>
          </div>
          <Reveal
            distance="none"
            speed="normal"
            order={1}
            className="pointer-events-none absolute -bottom-8 -right-16 hidden w-40 xl:block"
          >
            <DogDoodle className="w-full rotate-12 text-primary" />
          </Reveal>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Mniej szukania. Więcej zrozumienia.</p>
            <h2 className="section-title mt-4">
              Codzienność, która
              <br />
              układa się w całość.
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-0">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Reveal
              key={title}
              order={index}
              className="feature-column border-t border-primary/15 pt-6 md:border-l md:border-t-0 md:px-8 md:pt-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                  <Icon className="size-6 text-primary" />
                </span>
                <span className="font-display text-3xl text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-3xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-secondary/55">
        <div className="landing-section mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Dziennik w praktyce</p>
              <h2 className="section-title mt-4 max-w-xl">
                Każdy pies ma
                <br />
                swoją historię.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Zapisuj wydarzenia, reakcje i postępy. Ty i behawiorysta widzicie ten sam, uporządkowany obraz
              codzienności psa.
            </p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {JOURNAL_PREVIEWS.map((preview, index) => (
              <Reveal key={preview.name} order={index} distance="sm">
                <DogJournalPreviewCard {...preview} />
              </Reveal>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Przykładowe wpisy w dzienniku.</p>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 md:grid-cols-[0.85fr_1fr] md:gap-20">
          <div className="relative">
            <Reveal distance="sm">
              <img
                src={socialProofAsset.url}
                alt="Opiekunowie z border collie w plenerze"
                width="650"
                height="650"
                loading="lazy"
                className="aspect-square w-full rounded-[48%_48%_2rem_2rem] object-cover"
              />
            </Reveal>
            <Reveal
              distance="none"
              speed="normal"
              order={1}
              className="pointer-events-none absolute -bottom-5 -right-3 w-24"
            >
              <Paw className="rotate-[20deg] text-sage" />
            </Reveal>
          </div>
          <Reveal distance="sm" order={1}>
            <p className="eyebrow">Z życia z psem</p>
            <h2 className="section-title mt-4">
              Przetestowany na spacerach.
              <br />
              <em>I brudnych łapach.</em>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Spacery, treningi i trudne sytuacje. To z takich chwil powstaje historia Twojego psa — i wskazówki do
              dalszej pracy z behawiorystą.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto mb-16 max-w-7xl px-5 sm:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center sm:py-20">
          <Paw className="pointer-events-none absolute -left-6 -top-8 -z-10 w-48 rotate-[-20deg] text-sage/10" />
          <p className="eyebrow text-sage">Wasz następny krok</p>
          <h2 className="section-title mt-4 text-primary-foreground">
            Dobre historie
            <br />
            zaczynają się od łapy.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Zacznij od pierwszego wydarzenia. Resztę zapiszecie po drodze.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ rola: "owner" }}>
                Jestem właścicielem
                <ArrowUpRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/auth" search={{ rola: "behaviorist" }}>
                Jestem behawiorystą
              </Link>
            </Button>
          </div>
          <PawTrail className="cta-paws hidden lg:block" />
        </div>
      </section>
    </div>
  );
}
