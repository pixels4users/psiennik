import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

import { brand, button, container, darkModeCss, footer, h1, main, text } from "./theme";
import type { TemplateEntry } from "./registry";

export interface NotificationEmailProps {
  /** Nagłówek zdarzenia, np. „Anna dodała zalecenie dla psa Lucy". */
  headline?: string;
  /** Szczegół: tytuł wydarzenia albo fragment komentarza. */
  detail?: string | null;
  /** Adres prowadzący prosto do wpisu lub strony psa. */
  url?: string;
  /** Etykieta przycisku. */
  cta?: string;
}

export const NotificationEmail = ({
  headline = "Nowość w dzienniku",
  detail,
  url = "https://psiennik.pl/psy",
  cta = "Zobacz w Psienniku",
}: NotificationEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>{headline}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Psiennik</Text>
        <Heading style={h1}>{headline}</Heading>
        {detail ? <Text style={text}>{detail}</Text> : null}
        <Button className="dm-btn" style={button} href={url}>
          {cta}
        </Button>
        <Text style={footer}>
          Rodzaje powiadomień e-mail zmienisz w Psienniku w sekcji Ustawienia.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NotificationEmail;

const base = {
  component: NotificationEmail,
  previewData: {
    headline: "Anna dodała zalecenie dla psa Lucy",
    detail: "Spacer w parku",
    url: "https://psiennik.pl/psy",
  },
} satisfies Partial<TemplateEntry>;

export const entryTemplate = {
  ...base,
  subject: "Nowe wydarzenie w dzienniku — Psiennik",
  displayName: "Powiadomienie: nowe wydarzenie",
} satisfies TemplateEntry;

export const commentTemplate = {
  ...base,
  subject: "Nowy komentarz w dzienniku — Psiennik",
  displayName: "Powiadomienie: nowy komentarz",
} satisfies TemplateEntry;

export const recommendationTemplate = {
  ...base,
  subject: "Nowe zalecenie behawiorysty — Psiennik",
  displayName: "Powiadomienie: nowe zalecenie",
} satisfies TemplateEntry;

export const accessTemplate = {
  ...base,
  subject: "Zmiana dostępu do dziennika — Psiennik",
  displayName: "Powiadomienie: dostęp i współpraca",
} satisfies TemplateEntry;
