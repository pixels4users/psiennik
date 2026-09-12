import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarRange, MessageSquareText, PawPrint } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="max-w-2xl text-5xl leading-tight">
        Dziennik behawioralny psa, który prowadzi się sam
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Zapisuj, co działo się w ciągu dnia, oznaczaj kolorem i dziel się dziennikiem z
        behawiorystką — bez arkuszy i notatek rozsianych po telefonie.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/auth">Zacznij za darmo</Link>
        </Button>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="shadow-none">
            <CardContent className="grid gap-3 p-6">
              <Icon className="size-6 text-primary" />
              <h2 className="text-2xl">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
