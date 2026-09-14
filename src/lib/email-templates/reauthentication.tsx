import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

import { brand, codeStyle, container, footer, h1, main, text } from './theme'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Twój kod weryfikacyjny</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Psiennik</Text>
        <Heading style={h1}>Potwierdź swoją tożsamość</Heading>
        <Text style={text}>Użyj poniższego kodu, aby potwierdzić, że to Ty:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Kod wkrótce wygaśnie. Jeśli to nie Ty prosiłeś o kod, zignoruj tę
          wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
