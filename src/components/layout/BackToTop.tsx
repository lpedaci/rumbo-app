import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';
import { useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Scroll distance after which the button shows up: hidden at the top of the page. */
const SHOW_AFTER_PX = 480;

/**
 * Floating "Volver arriba" button in the bottom right corner (D-104). It only appears once the
 * page has scrolled; at the top it is invisible and out of the tab order. Square with soft
 * corners like every button (2.1.3), white with the menu elevation because it floats (2.5).
 * Going up also moves the focus to the page title, so keyboard users land where they see.
 * `aboveBottomNav` lifts it over the bottom navigation of phones in the app (< 768 px).
 */
export function BackToTop({ aboveBottomNav = false }: { aboveBottomNav?: boolean }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const reduceMotion = useShouldReduceMotion();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goUp = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const title = document.querySelector<HTMLElement>('main h1');
    if (title) {
      if (!title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
  };

  return (
    <div
      className={cn(
        'fixed right-4 z-30 transition-[opacity,transform] duration-200 ease-standard motion-reduce:transition-opacity md:right-6 md:bottom-6',
        aboveBottomNav ? 'bottom-[5.5rem]' : 'bottom-4',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-2 opacity-0',
      )}
    >
      <Tooltip content={t('layout.backToTop')} side="left">
        <button
          type="button"
          onClick={goUp}
          aria-label={t('layout.backToTop')}
          className="flex size-12 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-primary shadow-elevation-1 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name="arrow_upward" size={24} />
        </button>
      </Tooltip>
    </div>
  );
}
