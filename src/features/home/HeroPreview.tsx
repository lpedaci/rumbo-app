import { motion } from 'motion/react';
import heroHire from '@/assets/home/hero-hire.jpg';
import heroHr from '@/assets/home/hero-hr.jpg';
import heroManager from '@/assets/home/hero-manager.jpg';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Three role homes, small and overlapping: Sofía and Martín behind, Carla in front. */
const SCREENS = [
  { src: heroHire, className: 'left-0 top-8 w-[44%]', front: false },
  { src: heroManager, className: 'right-0 top-8 w-[44%]', front: false },
  { src: heroHr, className: 'left-[23%] top-0 w-[54%]', front: true },
];

/**
 * G0 hero from 640 px (D-123): a light look at the product, three small screens of the role
 * homes fading out downwards (on phones the hero stays text only). The fade is a transparency mask, not a
 * colored gradient on the background (2.2). Decorative: the hero text says what Rumbo is.
 */
export function HeroPreview() {
  const reduce = useShouldReduceMotion();
  return (
    <div
      aria-hidden
      className="relative mt-12 hidden h-56 w-full max-w-3xl sm:block md:h-72 xl:mt-16 xl:h-[26rem] xl:max-w-5xl [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]"
    >
      {SCREENS.map((screen, i) => (
        <motion.div
          key={screen.src}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.long, ease: easing.emphasizedDecelerate, delay: 0.35 + i * 0.05 }}
          className={cn(
            'absolute overflow-hidden rounded-lg border border-outline-variant bg-surface p-1',
            screen.front ? 'z-10 shadow-elevation-1' : 'z-0',
            screen.className,
          )}
        >
          <img
            src={screen.src}
            alt=""
            loading="eager"
            className="aspect-[16/10] w-full rounded-md object-cover object-top"
          />
        </motion.div>
      ))}
    </div>
  );
}
