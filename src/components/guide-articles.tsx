import type { ReactNode } from "react";
import sandalyAsset from "@/assets/guide-sandaly.jpg.asset.json";
import type { GuideSlug } from "@/lib/guides";

type Section = { heading: string; body: ReactNode };
type ArticleContent = {
  h1: string;
  summary: ReactNode;
  notes: [string, string][];
  notesHeading: string;
  example: [string, string, string][];
  exampleNote: string;
  exampleSummary: string;
  sections: Section[];
  mistakes: string[];
  afterNotes?: ReactNode;
};

const P = ({ children }: { children: ReactNode }) => <p className="mt-3 text-muted-foreground">{children}</p>;

export const ARTICLES: Record<GuideSlug, ArticleContent> = {
  "dziennik-obserwacji-psa": {
    h1: "Pies szczeka na inne psy? Zacznij od dziennika obserwacji",
    summary: (
      <>
        Po każdym spacerze zapisz, gdzie i kiedy pies zareagował, z jakiej odległości, co pomogło i jak szybko wrócił
        do spokoju. Po kilku tygodniach widać wzorce, a behawiorysta dostaje konkretny materiał zamiast wspomnień z
        ostatnich dni.
      </>
    ),
    sections: [
      {
        heading: "Dlaczego pies reaguje na inne psy?",
        body: (
          <P>
            Powodów może być wiele: strach, frustracja na smyczy, brak doświadczeń, ból albo po prostu zbyt mały
            dystans. Z zewnątrz te reakcje często wyglądają podobnie. Dlatego nie warto zgadywać przyczyny na własną
            rękę — ocenę zostaw behawioryście, a sam zbieraj rzetelne obserwacje. Jeśli zachowanie zmieniło się nagle,
            porozmawiaj też z lekarzem weterynarii.
          </P>
        ),
      },
    ],
    notesHeading: "Co zapisywać po każdym spacerze",
    notes: [
      ["Pora i miejsce", "Rano na osiedlu czy wieczorem w parku — reakcje często zależą od otoczenia."],
      ["Odległość", "Z jakiej odległości pies zauważył drugiego psa i kiedy zaczął reagować."],
      ["Reakcja", "Co dokładnie się stało: zatrzymanie, wpatrywanie się, szczekanie, ciągnięcie na smyczy."],
      ["Co pomogło", "Zwiększenie dystansu, zmiana kierunku, spokojna komenda, smakołyk."],
      ["Powrót do spokoju", "Ile czasu minęło, zanim pies znów mógł iść spokojnie."],
      ["Ocena dnia", "Prosta skala: dobrze, wyzwanie, trudno. Bez szukania winnych."],
    ],
    exampleNote: "Przykład — tak mógłby wyglądać tydzień Humusa.",
    example: [
      ["Poniedziałek", "Wyzwanie", "Pies za płotem, ok. 10 m. Szczekanie, po zmianie strony ulicy spokój po 2 minutach."],
      ["Środa", "Trudno", "Spotkanie zza rogu, ok. 3 m. Silna reakcja, potrzebowaliśmy wrócić do domu."],
      ["Piątek", "Dobrze", "Dwa psy z daleka, ok. 20 m. Humus popatrzył i wrócił do węszenia."],
      ["Niedziela", "Dobrze", "Spacer w nowym miejscu o spokojnej porze. Bez reakcji."],
    ],
    exampleSummary:
      "Już z czterech wpisów widać, że najtrudniej jest przy małym dystansie i nagłych spotkaniach, a lepiej przy kilkunastu metrach. To dobry punkt wyjścia do rozmowy ze specjalistą.",
    mistakes: [
      "Zapisywanie dopiero po kilku dniach, z pamięci.",
      "Same oceny („zły dzień”) bez opisu sytuacji i odległości.",
      "Notowanie tylko trudnych spacerów — spokojne też pokazują, co pomaga.",
      "Zmienianie wielu rzeczy naraz, przez co trudno ocenić, co zadziałało.",
    ],
  },
  "lek-separacyjny-psa": {
    h1: "Lęk separacyjny u psa: co zapisywać, gdy zostaje sam",
    summary: (
      <>
        Zanim zaczniesz cokolwiek zmieniać, przez dwa–trzy tygodnie zapisuj, jak długo pies był sam, co działo się
        przed wyjściem, co zastałeś po powrocie i — jeśli możesz — co pokazało nagranie. Taki dziennik bardzo ułatwia
        behawioryście ocenę sytuacji.
      </>
    ),
    sections: [
      {
        heading: "Skąd wiadomo, że to problem z samotnością?",
        body: (
          <P>
            Wycie, szczekanie, drapanie drzwi czy załatwianie się w domu mogą mieć różne przyczyny: nudę, hałas za
            oknem, niedawną przeprowadzkę, ale też problemy zdrowotne. Nie stawiaj diagnozy samodzielnie. Zbieraj
            obserwacje, skonsultuj się z behawiorystą, a jeśli zachowanie pojawiło się nagle lub pies załatwia się w
            domu — także z lekarzem weterynarii.
          </P>
        ),
      },
    ],
    notesHeading: "Co zapisywać przy każdym wyjściu",
    notes: [
      ["Czas samotności", "O której wyszedłeś i wróciłeś. Krótkie wyjścia też się liczą."],
      ["Przed wyjściem", "Spacer, posiłek, zabawa, a może pośpiech i nerwowe szukanie kluczy."],
      ["Sygnały przy wyjściu", "Czy pies chodził za Tobą, dyszał, piszczał, gdy brałeś kurtkę."],
      ["Po powrocie", "Ślady drapania, zniszczenia, siusiu, mokre legowisko, skargi sąsiadów."],
      ["Nagranie", "Jeśli masz kamerę: kiedy zaczął się niepokój i ile trwał."],
      ["Ocena dnia", "Dobrze, wyzwanie, trudno — krótko i bez oceniania psa."],
    ],
    exampleNote: "Przykład — tak mógłby wyglądać tydzień Luny.",
    example: [
      ["Poniedziałek", "Trudno", "Sama 4 godziny. Na nagraniu wycie po 5 minutach, drapanie drzwi."],
      ["Wtorek", "Wyzwanie", "Sama 1 godzinę po długim spacerze. Niepokój przez pierwsze 10 minut, potem leżała."],
      ["Czwartek", "Dobrze", "Wyjście na 15 minut z gryzakiem. Spokojnie, bez śladów."],
      ["Sobota", "Trudno", "Wyjście w pośpiechu, bez spaceru. Załatwiła się przy drzwiach."],
    ],
    exampleSummary:
      "Z takich notatek widać, że długość nieobecności i to, co działo się wcześniej, mają znaczenie. Behawiorysta może na tej podstawie zaplanować dalszą pracę.",
    mistakes: [
      "Karanie psa po powrocie za zniszczenia — nie łączy ich z karą, a stres rośnie.",
      "Zapisywanie tylko złych dni.",
      "Pomijanie krótkich wyjść, np. do śmietnika.",
      "Zmienianie kilku rzeczy jednocześnie bez notowania, co się zmieniło.",
    ],
  },
  "pies-niszczy-przedmioty": {
    h1: "Pies niszczy buty i przedmioty: jak to obserwować",
    summary: (
      <>
        Zapisuj, co pies zniszczył, kiedy, czy był wtedy sam i co działo się wcześniej. Po kilku tygodniach zobaczysz,
        czy chodzi o nudę, ząbkowanie, samotność czy konkretne sytuacje — i łatwiej będzie dobrać rozwiązanie razem z
        behawiorystą.
      </>
    ),
    sections: [
      {
        heading: "Dlaczego psy gryzą rzeczy?",
        body: (
          <>
            <P>
              Gryzienie to naturalne zachowanie psa. U szczeniąt łączy się z ząbkowaniem i poznawaniem świata, u
              dorosłych psów bywa sposobem na nudę, nadmiar energii albo stres, na przykład przy samotności. Buty i
              kapcie pachną opiekunem, więc często padają ofiarą jako pierwsze.
            </P>
            <img
              src={sandalyAsset.url}
              alt="Szczeniak przy niebieskich sandałach w domu"
              loading="lazy"
              width={1200}
              height={630}
              className="mt-6 aspect-[1200/630] w-full rounded-2xl object-cover"
            />
          </>
        ),
      },
    ],
    notesHeading: "Co zapisywać przy każdym zniszczeniu",
    notes: [
      ["Co i gdzie", "But w przedpokoju, kabel za kanapą, róg poduszki."],
      ["Kiedy", "Pora dnia i to, czy pies był sam, czy ktoś był w domu."],
      ["Co było wcześniej", "Spacer, zabawa, długi dzień bez ruchu, goście, hałas."],
      ["Dostępne zabawki", "Czy pies miał pod ręką gryzak lub zabawkę do gryzienia."],
      ["Twoja reakcja", "Co zrobiłeś i jak pies na to zareagował."],
      ["Ocena dnia", "Dobrze, wyzwanie, trudno."],
    ],
    exampleNote: "Przykład — tak mógłby wyglądać tydzień Lunki.",
    example: [
      ["Poniedziałek", "Trudno", "Pogryziony but w przedpokoju. Sama 3 godziny, rano tylko krótki spacer."],
      ["Środa", "Dobrze", "Długi spacer i gryzak przed wyjściem. Bez zniszczeń."],
      ["Piątek", "Wyzwanie", "Przy domownikach gryzła kapeć wieczorem, dała się przekierować na zabawkę."],
      ["Niedziela", "Dobrze", "Buty schowane do szafki, gryzak dostępny. Spokojny dzień."],
    ],
    exampleSummary:
      "Widać, że zniszczenia pojawiają się po dniach z mniejszą ilością ruchu i gdy buty są w zasięgu. To konkretne wskazówki do rozmowy ze specjalistą.",
    mistakes: [
      "Karanie po fakcie, gdy pies nie wie, za co.",
      "Brak bezpiecznych rzeczy do gryzienia.",
      "Notowanie tylko tego, co zniszczone, bez kontekstu dnia.",
      "Zostawianie kusiących rzeczy w zasięgu podczas pracy nad problemem.",
    ],
  },
};
