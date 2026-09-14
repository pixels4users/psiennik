import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import {
  brand,
  button,
  container,
  darkModeCss,
  footer,
  h1,
  link,
  main,
  text,
} from './theme'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Zaproszenie do {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Masz zaproszenie</Heading>
        <Text style={text}>
          Ktoś zaprosił Cię do{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Kliknij przycisk poniżej, aby przyjąć zaproszenie i założyć konto.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Przyjmij zaproszenie
        </Button>
        <Text style={footer}>
          Jeśli nie spodziewałeś się tego zaproszenia, po prostu zignoruj tę
          wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
