import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  /** Seconds to wait, for staggered pieces (30 to 50 ms steps, 2.6). */
  delay?: number;
  /** `mount` plays on load (the hero); `view` plays once when it scrolls into view. */
  trigger?: 'mount' | 'view';
  className?: string;
}

/**
 * Entrance animation of G0 (D-74): a short fade and 16 px rise with the M3 emphasized
 * easing, once. With reduced motion it is only a fade (2.6, F17). Never loops.
 */
export function Reveal({ children, delay = 0, trigger = 'view', className }: RevealProps) {
  const reduce = useShouldReduceMotion();
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: 16 };
  const shown = {
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? duration.short : duration.long * 1.5, ease: easing.emphasizedDecelerate, delay },
  };
  return trigger === 'mount' ? (
    <motion.div className={className} initial={hidden} animate={shown}>
      {children}
    </motion.div>
  ) : (
    <motion.div className={className} initial={hidden} whileInView={shown} viewport={{ once: true, amount: 0.15 }}>
      {children}
    </motion.div>
  );
}
