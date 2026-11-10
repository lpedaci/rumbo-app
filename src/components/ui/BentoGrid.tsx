import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { stagger, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Bento layout (CLAUDE.md 2.4): 12 columns from 1280 px, 6 columns from 768 px,
 * 1 column on mobile (cards keep their source order, which is the priority order).
 * Cards fade and rise in sequence, 40 ms apart.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  const reduce = useShouldReduceMotion();

  return (
    <motion.div
      className={cn('grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-6 xl:grid-cols-12', className)}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : stagger } } }}
    >
      {children}
    </motion.div>
  );
}
