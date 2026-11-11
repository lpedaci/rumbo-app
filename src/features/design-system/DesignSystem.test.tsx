import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import es from '@/locales/es.json';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useSessionStore.getState().resetSessionState();
});

describe('Design system site (D-98)', () => {
  it('is public, has a single h1 and shows real components', async () => {
    renderAt('/design-system');
    const h1s = await screen.findAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(es.designSystem.hero.highlight);
    expect(
      screen.getByRole('heading', { level: 2, name: es.designSystem.sections.components.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.designSystem.components.filled })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: new RegExp(es.designSystem.components.email) })).toBeInTheDocument();
  });
});
