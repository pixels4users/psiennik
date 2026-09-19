/** Shared motion foundations. Seconds for Motion, mirrored CSS tokens in styles.css. */
export const motionTokens = {
  duration: { fast: 0.16, normal: 0.24, slow: 0.55 },
  easing: { smooth: [0.22, 1, 0.36, 1] as const },
  distance: { sm: 8, md: 16, lg: 24 },
  stagger: 0.08,
  scale: { press: 0.98, pop: 1.02 },
} as const;
