import { cn } from '@/lib/utils';

/** Loading placeholder: soft opacity pulse, no animated gradient (2.6). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse-soft rounded-sm bg-surface-container-high', className)} />;
}
