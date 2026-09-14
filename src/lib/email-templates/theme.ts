// Wspólny styl wiadomości e-mail — kolory marki Psiennik (forest / keylime).
export const main = { backgroundColor: '#f7f6f1', fontFamily: 'Georgia, "Times New Roman", serif' }

export const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #ddf5d6',
  borderRadius: '14px',
  padding: '32px 28px',
  maxWidth: '560px',
}

export const brand = {
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#1a3e20',
  margin: '0 0 20px',
  fontFamily: 'Arial, sans-serif',
}

export const h1 = {
  fontSize: '24px',
  fontWeight: 'normal' as const,
  color: '#1a3e20',
  margin: '0 0 18px',
}

export const text = {
  fontSize: '15px',
  color: '#40464a',
  lineHeight: '1.6',
  margin: '0 0 22px',
  fontFamily: 'Arial, sans-serif',
}

export const link = { color: '#1a3e20', textDecoration: 'underline' }

export const button = {
  backgroundColor: '#1a3e20',
  color: '#ffffff',
  fontSize: '15px',
  border: '1px solid #1a3e20',
  borderRadius: '10px',
  padding: '13px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  fontFamily: 'Arial, sans-serif',
}

export const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  letterSpacing: '4px',
  fontWeight: 'bold' as const,
  color: '#1a3e20',
  backgroundColor: '#ddf5d6',
  borderRadius: '10px',
  padding: '14px 18px',
  margin: '0 0 28px',
}

export const footer = {
  fontSize: '12px',
  color: '#8a8f92',
  margin: '30px 0 0',
  lineHeight: '1.6',
  fontFamily: 'Arial, sans-serif',
}

// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ddf5d6 !important; color: #1a3e20 !important; border-color: #ddf5d6 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ddf5d6 !important; color: #1a3e20 !important; }
  [data-ogsb] .dm-btn { background-color: #ddf5d6 !important; color: #1a3e20 !important; }
`
