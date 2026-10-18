import reaktywnoscAsset from "@/assets/guide-lek.jpg.asset.json";
import lekAsset from "@/assets/guide-reaktywnosc.jpg.asset.json";
import niszczenieAsset from "@/assets/guide-niszczenie.jpg.asset.json";
import { SITE_URL } from "@/lib/seo";

export type GuideSlug = "dziennik-obserwacji-psa" | "lek-separacyjny-psa" | "pies-niszczy-przedmioty";

export type Guide = {
  slug: GuideSlug;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "dziennik-obserwacji-psa",
    title: "Pies szczeka na inne psy? Jak prowadzić dziennik obserwacji przed wizytą u behawiorysty",
    description:
      "Co zapisywać po spacerze, gdy pies reaguje na inne psy, jak wygląda przykładowy tydzień wpisów i jak pokazać dziennik behawioryście.",
    imageUrl: reaktywnoscAsset.url,
    imageAlt: "Mały pies szczekający na chodniku",
  },
  {
    slug: "lek-separacyjny-psa",
    title: "Lęk separacyjny u psa: co zapisywać, gdy zostaje sam",
    description:
      "Jak obserwować zachowanie psa, który źle znosi samotność, co notować przed wyjściem i po powrocie oraz jak przygotować się do konsultacji.",
    imageUrl: lekAsset.url,
    imageAlt: "Pies patrzący przez metalowe ogrodzenie",
  },
  {
    slug: "pies-niszczy-przedmioty",
    title: "Pies niszczy buty i przedmioty: jak to obserwować",
    description:
      "Kiedy pies gryzie buty i meble, warto zapisać, co, kiedy i w jakiej sytuacji. Podpowiadamy, jak prowadzić takie notatki i co z nich wynika.",
    imageUrl: niszczenieAsset.url,
    imageAlt: "Szczeniak gryzący but w domu",
  },
];

export function getGuide(slug: GuideSlug): Guide {
  return GUIDES.find((g) => g.slug === slug)!;
}

export function guideHead(slug: GuideSlug) {
  const g = getGuide(slug);
  const url = `${SITE_URL}/poradnik/${g.slug}`;
  const image = `${SITE_URL}${g.imageUrl}`;
  return {
    meta: [
      { title: g.title },
      { name: "description", content: g.description },
      { property: "og:title", content: g.title },
      { property: "og:description", content: g.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: g.title },
      { name: "twitter:description", content: g.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.description,
          image,
          inLanguage: "pl",
          author: { "@type": "Organization", name: "Psiennik", url: SITE_URL },
          publisher: { "@type": "Organization", name: "Psiennik", url: SITE_URL },
          mainEntityOfPage: url,
        }),
      },
    ],
  };
}
