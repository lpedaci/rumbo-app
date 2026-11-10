import type { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TASK_OFFSET_MAX, TASK_OFFSET_MIN } from './validation';

const VALIDATION_PARAMS = { min: TASK_OFFSET_MIN, max: TASK_OFFSET_MAX };

/** Translates a Zod/React Hook Form error (an i18n key) into the message shown under the field. */
export function useFieldError() {
  const { t } = useTranslation();
  return (error?: FieldError): string | undefined =>
    error?.message ? t(error.message, VALIDATION_PARAMS) : undefined;
}
