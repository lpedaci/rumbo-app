import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DESIGN_SYSTEM_MD_URL, REPO_URL } from '@/app/links';
import { AuthorLinks } from '@/components/brand/AuthorLinks';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon } from '@/components/ui/Icon';
import { withHighlight } from '@/features/home/SectionHeading';
import { useRevealOnce } from '@/lib/use-reveal-once';
import { cn } from '@/lib/utils';
import { ComponentsSection } from './DsComponents';
import { AppLayersFigure, TokenTiersFigure } from './DsFigures';
import { ColorSection, IconsSection, MotionSection, SpaceSection, TypeSection } from './DsFoundations';

type SectionId =
  | 'principles'
  | 'tokens'
  | 'color'
  | 'type'
  | 'space'
  | 'icons'
  | 'motion'
  | 'components'
  | 'patterns'
  | 'a11y'
  | 'voice'
  | 'app';

const GROUPS: { key: 'foundations' | 'components' | 'patterns' | 'guidelines'; ids: SectionId[] }[] = [
  { key: 'foundations', ids: ['principles', 'tokens', 'color', 'type', 'space', 'icons', 'motion'] },
  { key: 'components', ids: ['components'] },
  { key: 'patterns', ids: ['patterns', 'app'] },
  { key: 'guidelines', ids: ['a11y', 'voice'] },
];
const ORDER = GROUPS.flatMap((g) => g.ids);

function DsSection({ id, children }: { id: SectionId; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section id={`ds-${id}`} aria-labelledby={`ds-${id}-title`} className="flex scroll-mt-28 flex-col gap-6">
      {/* Intro uses the full width of the content, like the rest of the product (D-103) */}
      <div className="flex flex-col gap-2">
        <p className="text-label-large text-primary">{t(`designSystem.sections.${id}.eyebrow`)}</p>
        <h2 id={`ds-${id}-title`} className="text-headline-small text-pretty text-on-surface md:text-display-small">
          {t(`designSystem.sections.${id}.title`)}
        </h2>
        <p className="text-body-large text-pretty text-on-surface-variant">{t(`designSystem.sections.${id}.intro`)}</p>
      </div>
      {children}
    </section>
  );
}

/** Highlights in the index the last section whose top has passed under the top bar. */
function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>('principles');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: SectionId = 'principles';
      for (const id of ORDER) {
        const el = document.getElementById(`ds-${id}`);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return active;
}

/** Counts the custom properties declared on :root, so the hero number is never written by hand. */
function countTokens(): number | null {
  {
    const names = new Set<string>();
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list: CSSRuleList) => {
        for (const rule of [...list]) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (const prop of [...rule.style])
              if (
                prop.startsWith('--md-') ||
                prop.startsWith('--rumbo-') ||
                prop.startsWith('--chart-') ||
                prop.startsWith('--space-') ||
                prop.startsWith('--elevation-')
              )
                names.add(prop);
          } else if ('cssRules' in rule) {
            walk((rule as CSSGroupingRule).cssRules);
          }
        }
      };
      walk(rules);
    }
    return names.size || null;
  }
}

function scrollToSection(id: string) {
  const el = document.getElementById(`ds-${id}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el?.querySelector('h2')?.setAttribute('tabindex', '-1');
  (el?.querySelector('h2') as HTMLElement | null)?.focus({ preventScroll: true });
}

/**
 * Public site of Rumbo's design system (D-98), at /#/design-system: principles, token
 * architecture, foundations read live from the tokens, real component specimens, patterns
 * and guidelines. Linked from the G0 footer and the README; docs/design-system.md stays as
 * the Markdown version.
 */
export function DesignSystemPage() {
  const { t } = useTranslation();
  const active = useActiveSection();
  const [tokenCount] = useState(countTokens);
  const stagger = useRevealOnce<HTMLElement>();
  const principles = t('designSystem.principles', { returnObjects: true }) as { title: string; body: string }[];
  const patterns = t('designSystem.patterns', { returnObjects: true }) as string[][];
  const a11y = t('designSystem.a11y', { returnObjects: true }) as string[][];
  const voice = t('designSystem.voice.principles', { returnObjects: true }) as string[][];
  const vocab = t('designSystem.voice.vocab', { returnObjects: true }) as string[][];

  useEffect(() => {
    const previous = document.title;
    document.title = `${t('designSystem.docTitle')} · Rumbo`;
    return () => {
      document.title = previous;
    };
  }, [t]);

  const stats: [string, string][] = [
    [tokenCount ? String(tokenCount) : '·', t('designSystem.hero.stats.tokens')],
    ['7', t('designSystem.hero.stats.roles')],
    ['11', t('designSystem.hero.stats.type')],
    [String(patterns.length), t('designSystem.hero.stats.patterns')],
  ];

  return (
    <div className="min-h-dvh bg-surface-container-lowest">
      <a
        href="#ds-main"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 text-label-large text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('designSystem.skip')}
      </a>

      <header className="sticky top-0 z-40 px-(--space-gutter) pt-3">
        <div className="mx-auto flex h-16 w-full max-w-[max(80rem,80%)] items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Logo showCompany={false} />
            <span aria-hidden className="hidden h-5 w-px bg-outline-variant sm:block" />
            <span className="hidden truncate text-label-large text-on-surface-variant sm:block">
              {t('designSystem.title')}
            </span>
          </Link>
          <nav aria-label={t('designSystem.nav.label')} className="hidden items-center gap-6 lg:flex">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => scrollToSection(g.ids[0]!)}
                className="rounded-xs text-label-large text-primary hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t(`designSystem.nav.${g.key}`)}
              </button>
            ))}
          </nav>
          <Button asChild trailingIcon="arrow_forward">
            <Link to="/">{t('designSystem.nav.demo')}</Link>
          </Button>
        </div>
      </header>

      <main id="ds-main" tabIndex={-1} className="px-(--space-gutter) pb-16 focus:outline-none">
        <div className="mx-auto w-full max-w-[max(80rem,80%)]">
          {/* Hero */}
          <section className="bg-texture-grid -mx-(--space-gutter) flex flex-col items-center gap-6 px-(--space-gutter) py-16 text-center lg:py-24">
            <p className="text-label-large text-balance text-primary">{t('designSystem.hero.eyebrow')}</p>
            <h1 className="text-display-small text-pretty text-on-surface lg:text-display-medium">
              {withHighlight(t('designSystem.hero.title'), t('designSystem.hero.highlight'))}
            </h1>
            <p className="text-body-large text-pretty text-on-surface-variant">
              {t('designSystem.hero.intro')}
            </p>
            <ul
              ref={stagger}
              data-stagger
              className="grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-8 pt-4 sm:grid-cols-4"
            >
              {stats.map(([n, label], i) => (
                <li key={label} className="flex flex-col items-center gap-1">
                  <span className={cn('text-display-small tabular-nums', i % 2 ? 'text-tertiary' : 'text-primary')}>
                    {n}
                  </span>
                  <span className="text-body-medium text-on-surface-variant">{label}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="text" trailingIcon="open_in_new">
              <a href={DESIGN_SYSTEM_MD_URL} target="_blank" rel="noopener noreferrer">
                {t('designSystem.hero.md')}
              </a>
            </Button>
          </section>

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-12">
            {/* Index: a menu on small screens, a sticky list with the current section from 1280 px */}
            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="xl:hidden">
                <FilterMenu
                  label={t('designSystem.nav.menu')}
                  value={active}
                  onChange={(v) => scrollToSection(v)}
                  options={ORDER.map((id) => ({ value: id, label: t(`designSystem.sections.${id}.eyebrow`) }))}
                />
              </div>
              <nav aria-label={t('designSystem.nav.onThisPage')} className="hidden flex-col gap-5 xl:flex">
                {GROUPS.map((g) => (
                  <div key={g.key} className="flex flex-col gap-1">
                    <p className="px-3 text-label-medium text-on-surface-variant">{t(`designSystem.nav.${g.key}`)}</p>
                    <ul className="flex flex-col">
                      {g.ids.map((id) => (
                        <li key={id}>
                          <a
                            href={`#ds-${id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(id);
                            }}
                            aria-current={active === id ? 'true' : undefined}
                            className={cn(
                              'flex min-h-9 items-center rounded-sm px-3 text-label-large transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                              active === id
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface hover:bg-surface-container',
                            )}
                          >
                            {t(`designSystem.sections.${id}.eyebrow`)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            <div className="flex min-w-0 flex-col gap-20">
              <DsSection id="principles">
                <ul className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 xl:grid-cols-4">
                  {principles.map((p, i) => (
                    <li
                      key={p.title}
                      className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
                    >
                      <span className="text-display-small text-primary tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-title-medium text-on-surface">{p.title}</h3>
                      <p className="text-body-medium text-on-surface-variant">{p.body}</p>
                    </li>
                  ))}
                </ul>
              </DsSection>
              <DsSection id="tokens">
                <TokenTiersFigure />
              </DsSection>
              <DsSection id="color">
                <ColorSection />
              </DsSection>
              <DsSection id="type">
                <TypeSection />
              </DsSection>
              <DsSection id="space">
                <SpaceSection />
              </DsSection>
              <DsSection id="icons">
                <IconsSection />
              </DsSection>
              <DsSection id="motion">
                <MotionSection />
              </DsSection>
              <DsSection id="components">
                <ComponentsSection />
              </DsSection>
              <DsSection id="patterns">
                <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-2">
                  {patterns.map(([ref, title, body]) => (
                    <li
                      key={ref}
                      className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
                    >
                      <span className="w-fit rounded-full bg-tertiary-container px-2.5 py-0.5 text-label-medium text-on-tertiary-container tabular-nums">
                        {ref}
                      </span>
                      <h3 className="text-title-medium text-on-surface">{title}</h3>
                      <p className="text-body-medium text-on-surface-variant">{body}</p>
                    </li>
                  ))}
                </ul>
              </DsSection>
              <DsSection id="app">
                <AppLayersFigure />
              </DsSection>
              <DsSection id="a11y">
                <ul className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 lg:grid-cols-3">
                  {a11y.map(([title, body]) => (
                    <li
                      key={title}
                      className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
                    >
                      <Icon name="check_circle" size={24} className="shrink-0 text-success" />
                      <span className="flex flex-col gap-1">
                        <h3 className="text-title-medium text-on-surface">{title}</h3>
                        <span className="text-body-medium text-on-surface-variant">{body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </DsSection>
              <DsSection id="voice">
                <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
                  <ul className="flex flex-col gap-3">
                    {voice.map(([title, body]) => (
                      <li
                        key={title}
                        className="flex flex-col gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
                      >
                        <h3 className="text-title-medium text-on-surface">{title}</h3>
                        <p className="text-body-medium text-on-surface-variant">{body}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
                    <table className="w-full text-left text-body-medium">
                      <thead className="bg-surface-container text-title-small text-on-surface-variant">
                        <tr>
                          <th scope="col" className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <Icon name="check_circle" size={16} className="text-success" />
                              {t('designSystem.voice.use')}
                            </span>
                          </th>
                          <th scope="col" className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <Icon name="block" size={16} className="text-error" />
                              {t('designSystem.voice.avoid')}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vocab.map(([use, avoid]) => (
                          <tr key={use} className="border-t border-outline-variant">
                            <td className="px-4 py-3 text-on-surface">{use}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{avoid}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DsSection>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant px-(--space-gutter) py-8">
        {/* Same authorship line as the G0 footer (D-103); then credits and links */}
        <div className="mx-auto flex w-full max-w-[max(80rem,80%)] flex-col gap-5">
          <AuthorLinks />
          <p className="text-body-small text-on-surface-variant">{t('designSystem.footer.credits')}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-outline-variant pt-5">
            <li>
              <Link to="/" className="inline-flex min-h-12 items-center gap-1 text-label-large text-primary hover:underline sm:min-h-10">
                {t('designSystem.footer.demo')}
              </Link>
            </li>
            <li>
              <a
                href={DESIGN_SYSTEM_MD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 text-label-large text-primary hover:underline sm:min-h-10"
              >
                {t('designSystem.footer.md')}
              </a>
            </li>
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 text-label-large text-primary hover:underline sm:min-h-10"
              >
                {t('designSystem.footer.repo')}
              </a>
            </li>
          </ul>
          <p className="text-center text-body-small text-on-surface-variant">
            {t('home.footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
