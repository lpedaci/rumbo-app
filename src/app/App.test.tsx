import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import templatesSeed from '@/data/templates.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
import { renderAt } from '@/test/render-app';
import i18n from './i18n';


beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('routing and access control', () => {
  it('shows the demo start (G0) to a visitor without session, with a single h1 in Spanish', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.home.title);
    expect(document.documentElement.lang).toBe('es');
  });

  it('G0 offers one journey per role, each opening the login with that role preselected', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const links = screen.getAllByRole('link', { name: /^Recorrer como/ });
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/login?demo=carla',
      '/login?demo=martin',
      '/login?demo=sofia',
      '/login?demo=diego',
    ]);
  });

  it('G0 shows figures from the demo data and an accessible FAQ accordion (D-70)', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const stats = screen.getByRole('region', { name: es.home.stats.title });
    const templates = useDataStore.getState().templates.length;
    expect(within(stats).getByText(es.home.stats.templates).previousElementSibling).toHaveTextContent(String(templates));
    const question = screen.getByRole('button', { name: new RegExp(es.home.faq.items[0]!.q.replace('?', '\?')) });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(es.home.faq.items[0]!.a)).toBeVisible();
  });

  it('the login is clean: no role cards and no "Vas a entrar como…" notice (D-66)', async () => {
    renderAt('/login?demo=carla');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.auth.login.title);
    expect(screen.queryByText(/Vas a entrar como/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.auth.login.ssoMicrosoft })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.auth.login.ssoGoogle })).toBeInTheDocument();
  });

  it('with ?demo=carla, SSO signs in with her fictitious account and goes on to verification', async () => {
    renderAt('/login?demo=carla');
    fireEvent.click(await screen.findByRole('button', { name: es.auth.login.ssoGoogle }));
    // G2: neutral simulation with Carla's fictitious work account, checked step by step
    expect(await screen.findByText('Cuenta de trabajo: carla@nortia.demo')).toBeInTheDocument();
    expect(screen.getByText('carla@nortia.demo')).toBeInTheDocument();
    // It continues by itself; "Continuar" skips the wait
    fireEvent.click(screen.getByRole('button', { name: es.auth.sso.continue }));
    expect(await screen.findByRole('heading', { level: 1, name: es.auth.mfa.title })).toBeInTheDocument();
  });

  it('with ?demo=carla, the email form comes prefilled with her work email', async () => {
    renderAt('/login?demo=carla');
    fireEvent.click(await screen.findByRole('button', { name: es.auth.login.emailToggle }));
    expect(screen.getByLabelText(/Correo de trabajo/)).toHaveValue('carla@nortia.demo');
  });

  it('remembers the requested route when there is no session', async () => {
    renderAt('/admin/templates');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.auth.login.title);
    expect(useSessionStore.getState().returnTo).toBe('/admin/templates');
  });

  it('exposes a skip link to the main landmark', async () => {
    renderAt('/login');
    expect(await screen.findByRole('link', { name: es.app.skipToContent })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows G7 and audits the attempt when a role opens another role route', () => {
    act(() => {
      switchRole('hire');
    });
    useSessionStore.getState().markWelcomeSeen('p-sofia');
    renderAt('/admin');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.forbidden.title);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({
      action: 'auth.access_denied',
      actorId: 'p-sofia',
      resource: '/admin',
      result: 'denied',
    });
  });

  it('lets each role into its own workspace', () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.upcoming.screens.A1);
  });

  it('shows the not found page for unknown routes', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(es.notFound.title);
  });
});

describe('layout (G6): top bar and side navigation', () => {
  it('has a top bar with help and notifications, and folds the sidebar to icons', async () => {
    useUiStore.setState({ navCollapsed: null });
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/templates');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('button', { name: es.layout.help.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.layout.notifications.title })).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: es.layout.menu.collapse });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-controls', 'app-sidebar');
    fireEvent.click(toggle);

    const expand = screen.getByRole('button', { name: es.layout.menu.expand });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    // Folded items keep their accessible name and the active state.
    const sidebar = screen.getByRole('navigation', { name: es.layout.mainNav });
    expect(within(sidebar).getByRole('link', { name: es.layout.nav.templates })).toHaveAttribute('aria-current', 'page');
    expect(useUiStore.getState().navCollapsed).toBe(true);
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

  it('Spanish texts avoid voseo, "usted", long dashes and banned words (CLAUDE.md 2.9)', () => {
    const valuesOf = (obj: object): string[] =>
      Object.values(obj).flatMap((value) => (typeof value === 'object' && value !== null ? valuesOf(value) : [String(value)]));
    const texts = valuesOf(es).join(' | ');
    expect(texts).not.toMatch(/—/);
    expect(texts).not.toMatch(/\b(vos|usted)\b/i);
    // "Clave" as password is banned; "contactos clave" (key contacts, F1) is fine.
    expect(texts).not.toMatch(/\b(tu|la|una|su|nueva) clave\b/i);
    expect(texts).not.toMatch(/\b(loguea|password|dashboard|template|mail|móvil|ordenador)\b/i);
    // Microsoft discourages "corporate account" next to its sign-in button (2.9, D-44).
    expect(texts).not.toMatch(/corporativ|empresarial/i);
  });

  it('seed task texts follow the fixed vocabulary too (D-44)', () => {
    expect(JSON.stringify(templatesSeed)).not.toMatch(/corporativ|empresarial|—/i);
  });

  it('switches <html lang> when the language changes', async () => {
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
  });
});
