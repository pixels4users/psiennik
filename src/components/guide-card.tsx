import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Guide } from "@/lib/guides";

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border bg-card shadow-none">
      <div className="aspect-[1200/630] overflow-hidden bg-muted">
        <img src={guide.imageUrl} alt={guide.imageAlt} loading="lazy" className="size-full object-cover" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <h2 className="text-2xl leading-tight text-primary">{guide.title}</h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{guide.description}</p>
        <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
          <Link to="/poradnik/$slug" params={{ slug: guide.slug }}>
            Czytaj
            <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
