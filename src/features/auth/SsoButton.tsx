import googleLogo from '@/assets/brands/google-g-logo.png';
import microsoftLogo from '@/assets/brands/microsoft-logo.svg';
import { interactive } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SsoButtonProps {
  provider: 'microsoft' | 'google';
  label: string;
  onClick: () => void;
}

const LOGOS = { microsoft: microsoftLogo, google: googleLogo };

/**
 * SSO button with the official, unmodified provider logo (src/assets/brands/README.md).
 * Both providers share size, style and visual weight (Google requires equal prominence).
 * Light theme of both brand guidelines: white fill, 1 px border, dark text.
 */
export function SsoButton({ provider, label, onClick }: SsoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-14 w-full items-center justify-center gap-3 rounded-sm border border-outline bg-surface-container-lowest px-4 text-label-large text-on-surface md:h-10',
        interactive,
      )}
    >
      <img src={LOGOS[provider]} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" />
      <span>{label}</span>
    </button>
  );
}
