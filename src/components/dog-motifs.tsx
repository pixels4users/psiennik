import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Original vector brand details: purely decorative, never used as controls. */
export function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 110" fill="currentColor" aria-hidden="true" className={className}>
      <ellipse cx="18" cy="40" rx="12" ry="17" transform="rotate(-28 18 40)" />
      <ellipse cx="40" cy="22" rx="12" ry="18" transform="rotate(-8 40 22)" />
      <ellipse cx="66" cy="24" rx="12" ry="18" transform="rotate(15 66 24)" />
      <ellipse cx="85" cy="46" rx="11" ry="16" transform="rotate(32 85 46)" />
      <path d="M26 65C36 45 58 43 71 65C78 75 86 86 76 94C66 103 59 92 49 93C38 94 31 102 22 94C12 85 20 76 26 65Z" />
    </svg>
  );
}

export function PawTrail({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn("paw-trail pointer-events-none", className)}
      initial="hidden"
      animate={inView || reduced ? "visible" : "hidden"}
      exit="hidden"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : motionTokens.stagger } },
      }}
    >
      {["one", "two", "three"].map((step) => (
        <div key={step} className={`paw-step paw-step-${step}`}>
          <motion.div
            className="paw-print"
            variants={{
              hidden: { opacity: 0, scale: motionTokens.scale.press },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{
              duration: reduced ? 0 : motionTokens.duration.normal,
              ease: motionTokens.easing.smooth,
            }}
          >
            <Paw />
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}

export function DogDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 230 210" fill="none" aria-hidden="true" className={className}>
      <path
        d="M65 60C53 15 19 37 22 89C24 114 39 125 56 106M165 60C177 15 211 37 208 89C206 114 191 125 174 106"
        fill="currentColor"
      />
      <path
        d="M59 75C59 24 173 22 175 77L179 123C182 190 45 190 51 123Z"
        fill="var(--color-keylime)"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M81 89L81 95M149 89L149 95"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M100 116Q115 108 130 116Q126 130 115 131Q105 129 100 116Z" fill="currentColor" />
      <path
        d="M115 132V143M92 139Q103 153 115 143Q127 154 138 139"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="dog-tail"
        d="M186 155L202 146M190 169L213 169"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M44 193Q44 174 59 174Q73 174 73 193M153 193Q153 174 168 174Q183 174 183 193"
        fill="var(--color-sage)"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M54 184V193M63 184V193M163 184V193M173 184V193"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
