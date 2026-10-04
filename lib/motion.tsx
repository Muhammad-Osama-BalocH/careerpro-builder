'use client';

import { motion, AnimatePresence, type Variants } from 'motion/react';

/* ═══════════════════════════════════════════════════════════════
   CareerProof AI — Motion Primitives

   Fast, subtle, professional. Motion respects prefers-reduced-motion
   automatically via the motion library.
   ═══════════════════════════════════════════════════════════════ */

export { AnimatePresence };

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Variants ── */

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
};

/* ── Transition presets ── */

export const transitionDefault = { duration: 0.35, ease: EASE };
export const transitionSlow = { duration: 0.5, ease: EASE };
export const transitionFast = { duration: 0.2, ease: EASE };

/* ── Components ── */

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={transitionDefault}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      variants={fadeInUp}
      transition={{ ...transitionDefault, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Fade-in-only variant of SectionReveal — for elements where y-shift is unwanted */
export function FadeReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      variants={fadeIn}
      transition={{ ...transitionDefault, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      variants={staggerContainer}
      transition={{ ...transitionDefault, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Crossfade content swap — for tab panels, conditional sections */
export function ContentReveal({ children, className, keyProp }: { children: React.ReactNode; className?: string; keyProp?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={transitionFast}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function HoverLift({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -1.5, transition: { duration: 0.15, ease: EASE } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PressScale({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Subtle hover scale — for cards that should grow slightly on hover */
export function HoverScale({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.015, transition: { duration: 0.2, ease: EASE } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Status banner (error / success) — slides in and auto-exits */
export function StatusBanner({ children, className, visible }: { children: React.ReactNode; className?: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={transitionFast}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
