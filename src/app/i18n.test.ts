import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from './i18n';

afterEach(async () => {
  await i18n.changeLanguage('es');
});

describe('i18n (D-99)', () => {
  it('ships Spanish and loads English on demand', async () => {
    expect(i18n.t('designSystem.title')).toBe('Sistema de diseño');
    await i18n.changeLanguage('en');
    await waitFor(() => expect(i18n.t('designSystem.title')).toBe('Design system'));
    expect(document.documentElement.lang).toBe('en');
  });
});
