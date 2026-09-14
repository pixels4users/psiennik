import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

import { brand, button, container, darkModeCss, footer, h1, main, text } from './theme'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Twój link do logowania w {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Twój link do logowania</Heading>
        <Text style={text}>
          Kliknij przycisk poniżej, aby zalogować się do {siteName}. Link jest
          ważny tylko przez chwilę.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Zaloguj się
        </Button>
        <Text style={footer}>
          Jeśli nie prosiłeś o ten link, po prostu zignoruj tę wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
