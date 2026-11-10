import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { findDemoPerson } from '@/features/auth/auth-service';
import { useCurrentUser } from '@/store/session-store';

export type ScreenId =
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7'
  | 'J1' | 'J2' | 'J3'
  | 'N1' | 'N2' | 'N3'
  | 'S1' | 'S2' | 'S3';

/** Temporary page for screens built in later steps (5 to 10). Keeps routes and navigation working. */
export function UpcomingPage({ screen }: { screen: ScreenId }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const person = user && findDemoPerson(user.personId);

  return (
    <>
      <PageHeader
        eyebrow={person ? t('upcoming.greeting', { name: person.name.split(' ')[0] }) : undefined}
        title={t(`upcoming.screens.${screen}`)}
      />
      <InlineAlert tone="info">{t('upcoming.body')}</InlineAlert>
    </>
  );
}
