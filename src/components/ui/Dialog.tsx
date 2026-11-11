import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { IconButton } from './IconButton';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface DialogContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons. Main action last: it renders on the right on desktop and on top on mobile (2.1.3). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Modal dialog. Focus moves inside on open, stays trapped, Escape closes it
 * and focus returns to the trigger (Radix Dialog, CLAUDE.md 2.10).
 */
export function DialogContent({ title, description, children, actions, className }: DialogContentProps) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/32 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg bg-surface-container-lowest p-6 shadow-elevation-2',
          'duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogPrimitive.Title className="text-title-large text-on-surface">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <IconButton icon="close" label={t('ui.close')} className="-mt-2 -mr-2" />
          </DialogPrimitive.Close>
        </div>
        {description ? (
          <DialogPrimitive.Description className="text-body-medium text-on-surface-variant">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        {children}
        {actions && <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** States the consequence, for example "¿Eliminar esta tarea?" (2.9). */
  title: string;
  description: string;
  /** Repeats the consequence, for example "Eliminar tarea". Never "Sí". */
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

/** Confirmation before destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        actions={
          <>
            <DialogClose asChild>
              <Button variant="outlined" fullWidth className="sm:w-auto">
                {t('ui.cancel')}
              </Button>
            </DialogClose>
            <Button
              variant={destructive ? 'danger' : 'filled'}
              fullWidth
              className="sm:w-auto"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
