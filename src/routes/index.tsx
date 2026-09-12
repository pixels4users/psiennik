import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PawPrint, Stethoscope } from "lucide-react";
import { useRole, type Role } from "@/lib/role";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dziennik psa — wybierz rolę" },
      {
        name: "description",
        content:
          "Wspólny dziennik behawioralny psa: właściciel zapisuje wydarzenia, behawiorysta dodaje zalecenia.",
      },
      { property: "og:title", content: "Dziennik psa — wybierz rolę" },
      {
        property: "og:description",
        content:
          "Wspólny dziennik behawioralny psa: właściciel zapisuje wydarzenia, behawiorysta dodaje zalecenia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoleSelectPage,
});

const OPTIONS: { role: Role; title: string; description: string; icon: typeof PawPrint }[] = [
  {
    role: "owner",
    title: "Jestem właścicielem",
    description: "Dodajesz psy, zapisujesz wydarzenia i śledzisz postępy w dzienniku.",
    icon: PawPrint,
  },
  {
    role: "behaviorist",
    title: "Jestem behawiorystą",
    description: "Przeglądasz dzienniki psów i dodajesz komentarze oraz zalecenia.",
    icon: Stethoscope,
  },
];

function RoleSelectPage() {
  const { setRole } = useRole();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="text-4xl">Kim jesteś?</h1>
      <p className="mt-2 text-muted-foreground">
        Wybierz rolę — zawsze możesz ją zmienić w nagłówku strony.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {OPTIONS.map(({ role, title, description, icon: Icon }) => (
          <Card
            key={role}
            role="button"
            tabIndex={0}
            onClick={() => {
              setRole(role);
              navigate({ to: "/psy" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setRole(role);
                navigate({ to: "/psy" });
              }
            }}
            className="cursor-pointer shadow-none transition-colors hover:bg-keylime"
          >
            <CardContent className="grid gap-3 p-8">
              <Icon className="size-7 text-primary" />
              <h2 className="text-2xl">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
