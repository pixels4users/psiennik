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

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Potwierdź zmianę adresu e-mail w {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>Potwierdź zmianę adresu e-mail</Heading>
        <Text style={text}>
          Poproszono o zmianę adresu e-mail konta w {siteName} z{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          na{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>Kliknij przycisk poniżej, aby potwierdzić zmianę:</Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Potwierdź zmianę adresu
        </Button>
        <Text style={footer}>
          Jeśli to nie Ty prosiłeś o tę zmianę, jak najszybciej zadbaj o
          bezpieczeństwo swojego konta.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
