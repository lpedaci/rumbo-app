import { Toast } from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { dismissToast, type ToastTone, useToasts } from './toast-store';

const toneIcon: Record<ToastTone, IconName> = {
  success: 'check_circle',
  info: 'info',
  error: 'error',
};

/**
 * Renders toasts announced politely to screen readers (aria-live via Radix Toast).
 * Errors that need action use inline alerts, not toasts.
 * Mounted once in AppProviders.
 */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToasts();

  return (
    <Toast.Provider swipeDirection="down" duration={5000} label={t('ui.notificationsRegion')}>
      {toasts.map((item) => (
        <Toast.Root
          key={item.id}
          type={item.tone === 'error' ? 'foreground' : 'background'}
          onOpenChange={(open) => {
            if (!open) dismissToast(item.id);
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-md bg-inverse-surface py-2 pr-2 pl-4 text-body-medium text-inverse-on-surface shadow-elevation-2',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        >
          <Icon name={toneIcon[item.tone]} size={20} />
          <Toast.Description className="min-w-0 flex-1">{item.message}</Toast.Description>
          <Toast.Close asChild>
            <IconButton icon="close" label={t('ui.dismiss')} size="xs" className="text-inverse-on-surface" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed right-0 bottom-0 left-0 z-60 mx-auto flex w-full max-w-md flex-col gap-2 p-4 outline-none md:right-4 md:left-auto md:mx-0" />
    </Toast.Provider>
  );
}
