import { useEffect, useRef, type ReactNode } from "react";
import { motion, useAnimationControls, useInView } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/** Content is visible in SSR and without JS; only off-screen sections are revealed. */
export function Reveal({
  children,
  className,
  order = 0,
  distance = "md",
  speed = "slow",
}: {
  children: ReactNode;
  className?: string;
  order?: number;
  distance?: "none" | keyof typeof motionTokens.distance;
  speed?: keyof typeof motionTokens.duration;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prepared = useRef(false);
  const revealed = useRef(false);
  const controls = useAnimationControls();
  const inView = useInView(ref, { once: true });
  const reduced = usePrefersReducedMotion();
  const offset = distance === "none" ? 0 : motionTokens.distance[distance];

  useEffect(() => {
    if (reduced) {
      revealed.current = true;
      controls.stop();
      controls.set({ opacity: 1, y: 0 });
      return;
    }
    if (revealed.current) return;
    if (!prepared.current) {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds?.height) return;
      prepared.current = true;
      if (bounds.top >= window.innerHeight) {
        controls.set({ opacity: 0, y: offset });
      } else {
        // Never hide SSR content already visible on hydration or scroll restoration.
        revealed.current = true;
        return;
      }
    }
    if (inView) {
      revealed.current = true;
      // Stacked mobile blocks enter independently, without a desktop row's delay.
      const delay = window.matchMedia("(min-width: 768px)").matches
        ? Math.min(Math.max(order, 0), 3) * motionTokens.stagger
        : 0;
      void controls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: motionTokens.duration[speed],
          delay,
          ease: motionTokens.easing.smooth,
        },
      });
    }
  }, [inView, reduced, controls, offset, order, speed]);

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      initial={false}
      animate={controls}
      exit={{ opacity: 0 }}
      onFocusCapture={() => {
        // Keyboard users must never land on an invisible link during a reveal.
        revealed.current = true;
        controls.stop();
        controls.set({ opacity: 1, y: 0 });
      }}
    >
      {children}
    </motion.div>
  );
}
