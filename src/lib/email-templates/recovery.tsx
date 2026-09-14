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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Zresetuj hasło do {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Zresetuj hasło</Heading>
        <Text style={text}>
          Otrzymaliśmy prośbę o zresetowanie hasła do konta w {siteName}.
          Kliknij przycisk poniżej, aby ustawić nowe hasło.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Ustaw nowe hasło
        </Button>
        <Text style={footer}>
          Jeśli to nie Ty prosiłeś o reset hasła, zignoruj tę wiadomość — hasło
          pozostanie bez zmian.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
