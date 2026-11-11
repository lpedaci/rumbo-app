import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/dates';
import type { AppNotification } from '@/types/domain';

/**
 * Title and body of a notification in the current language (D-105): the store keeps the type
 * and its parameters; dates go out as DD/MM/AAAA and counts drive the plural.
 */
export function useNotificationText() {
  const { t } = useTranslation();
  return useCallback(
    (n: AppNotification) => {
      const values: Record<string, string | number> = { ...n.params };
      if (n.params.date) values.date = formatDate(n.params.date);
      if (n.params.count) values.count = Number(n.params.count);
      return {
        title: t(`notifications.types.${n.type}.title`),
        body: t(`notifications.types.${n.type}.body`, values),
      };
    },
    [t],
  );
}
