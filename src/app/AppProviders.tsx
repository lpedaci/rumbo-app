import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { TooltipProvider } from '@/components/ui/Tooltip';

/** App-wide providers. `reducedMotion="user"` makes Motion respect the OS setting. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
