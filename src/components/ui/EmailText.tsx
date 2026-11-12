import { cn } from '@/lib/utils';

/**
 * An email always shown complete (2.7, D-125): when it does not fit, it wraps before the "@" into
 * two lines ("nicolas.acosta" / "@nortia.demo"), never in the middle of a word. Only a single part
 * longer than the whole line breaks inside, as a last resort.
 */
export function EmailText({ email, className }: { email: string; className?: string }) {
  const at = email.indexOf('@');
  return (
    <span className={cn('min-w-0 [overflow-wrap:break-word]', className)}>
      {at > 0 ? (
        <>
          {email.slice(0, at)}
          <wbr />
          {email.slice(at)}
        </>
      ) : (
        email
      )}
    </span>
  );
}
