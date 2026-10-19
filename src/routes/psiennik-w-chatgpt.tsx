import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import chatgptPluginsAsset from "@/assets/chatgpt-wtyczki.png.asset.json";
import { SITE_URL, socialMeta } from "@/lib/seo";

const MCP_URL = "https://psiennik.pl/mcp";

export const Route = createFileRoute("/psiennik-w-chatgpt")({
  head: () => ({
    meta: socialMeta({
      title: "Psiennik w ChatGPT — instrukcja krok po kroku",
      description:
        "Połącz Psiennika z ChatGPT w 2 minuty i pytaj o dziennik, postępy i zalecenia behawiorysty swoimi słowami.",
      path: "/psiennik-w-chatgpt",
      image: "homepage",
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/psiennik-w-chatgpt` }],
  }),
  component: ChatGptGuide,
});

const EXAMPLES = [
  "Co nowego w dzienniku Lucy z ostatnich 7 dni?",
  "Jakie zalecenia zostawiła behawiorystka po ostatnim spacerze?",
  "Wypisz trudne sytuacje z tego miesiąca i podpowiedz, o co zapytać na konsultacji.",
];

function CopyUrl() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-background p-4 sm:flex-row sm:items-center">
      <code className="flex-1 break-all font-mono text-base text-primary">{MCP_URL}</code>
      <Button
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(MCP_URL);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? "Skopiowano" : "Kopiuj adres"}
      </Button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-4 border-t border-primary/15 pt-8 sm:grid-cols-[4rem_1fr]">
      <span className="font-display text-5xl leading-none text-muted-foreground">0{n}</span>
      <div>
        <h2 className="text-3xl text-primary">{title}</h2>
        <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function ChatGptGuide() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <p className="eyebrow">Psiennik w Twoim AI</p>
      <h1 className="mt-4 text-4xl text-primary sm:text-5xl">Jak połączyć Psiennika z ChatGPT</h1>
      <p className="mt-4 text-muted-foreground">
        Jednorazowo, w około 2 minuty. Potem po prostu pytasz ChatGPT o swojego psa — sam zajrzy do dziennika i
        zaleceń. Nie trzeba nic przepisywać.
      </p>

      <ol className="mt-12 space-y-10">
        <Step n={1} title="Otwórz wtyczki w ChatGPT">
          <p>
            W ChatGPT (najwygodniej w przeglądarce na komputerze) przejdź do <strong>Ustawienia → Wtyczki</strong>.
            Kliknij <strong>Dodaj</strong> w prawym górnym rogu i wybierz{" "}
            <strong>„Dodaj niestandardowy serwer MCP"</strong>.
          </p>
          <figure className="overflow-hidden rounded-2xl border border-primary/15">
            <img
              src={chatgptPluginsAsset.url}
              alt="Ekran Wtyczki w ChatGPT z rozwiniętym menu Dodaj i opcją Dodaj niestandardowy serwer MCP"
              width="1586"
              height="1920"
              loading="lazy"
              className="w-full"
            />
          </figure>
          <p className="text-sm">
            Psiennika nie znajdziesz na liście publicznych wtyczek — tę listę tworzy OpenAI dla dużych firm. Dodanie
            ręczne działa tak samo.
          </p>
        </Step>

        <Step n={2} title="Wklej adres Psiennika">
          <p>
            W polu nazwy wpisz <strong>Psiennik</strong>, a w polu adresu wklej:
          </p>
          <CopyUrl />
          <p>
            Jeśli pojawi się wybór sposobu logowania, zostaw <strong>OAuth</strong>. Zatwierdź.
          </p>
        </Step>

        <Step n={3} title="Zaloguj się i kliknij „Zezwól”">
          <p>
            ChatGPT otworzy okno Psiennika. Zaloguj się tym samym kontem, którego używasz w Psienniku, i kliknij{" "}
            <strong>Zezwól</strong>. Gotowe — Psiennik pojawi się w zakładce <strong>Osobiste</strong>.
          </p>
        </Step>

        <Step n={4} title="Pytaj swoimi słowami">
          <p>Otwórz nowy czat i napisz, np.:</p>
          <ul className="space-y-2">
            {EXAMPLES.map((e) => (
              <li key={e} className="flex gap-3 rounded-2xl bg-secondary p-4 text-primary">
                <MessageSquareText className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {e}
              </li>
            ))}
          </ul>
        </Step>
      </ol>

      <div className="mt-12 flex gap-4 rounded-2xl border border-primary/15 p-6">
        <ShieldCheck className="size-7 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-primary">Twoje dane są bezpieczne</p>
          <p className="mt-1">
            ChatGPT widzi tylko psy, do których Ty masz dostęp, i tylko je czyta — niczego nie zmienia. Połączenie
            możesz w każdej chwili usunąć w ustawieniach wtyczek ChatGPT.
          </p>
        </div>
      </div>

      <Button asChild size="lg" className="mt-10">
        <Link to="/auth">Nie masz konta? Załóż je za darmo</Link>
      </Button>
    </div>
  );
}
