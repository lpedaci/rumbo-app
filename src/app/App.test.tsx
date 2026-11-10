import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import { AppRoutes } from './AppRoutes';
import i18n from './i18n';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('app shell', () => {
  it('renders the placeholder home with a single h1 in Spanish', () => {
    renderAt('/');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.placeholder.title);
    expect(document.documentElement.lang).toBe('es');
  });

  it('exposes a skip link to the main landmark', () => {
    renderAt('/');
    const skip = screen.getByRole('link', { name: es.app.skipToContent });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows the not found page for unknown routes', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.notFound.title);
    expect(screen.getByRole('link', { name: es.notFound.backHome })).toBeInTheDocument();
  });
});

describe('locales', () => {
  const keysOf = (obj: object, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([key, value]) =>
      typeof value === 'object' && value !== null ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

  it('Spanish and English have the same keys', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });

  it('Spanish texts avoid voseo, "usted" and long dashes', () => {
    const texts = JSON.stringify(es);
    expect(texts).not.toMatch(/—/);
    expect(texts).not.toMatch(/\b(vos|usted)\b/i);
  });

  it('switches <html lang> when the language changes', async () => {
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
  });
});
