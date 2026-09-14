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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Potwierdź swój adres e-mail w {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Potwierdź swój adres e-mail</Heading>
        <Text style={text}>
          Dziękujemy za założenie konta w{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Potwierdź adres{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          , klikając przycisk poniżej — potem możesz zacząć prowadzić dziennik
          swojego psa.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Potwierdź adres e-mail
        </Button>
        <Text style={footer}>
          Jeśli to nie Ty zakładałeś konto, po prostu zignoruj tę wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
