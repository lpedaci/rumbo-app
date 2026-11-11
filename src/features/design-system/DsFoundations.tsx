import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { contrast, readToken } from '@/lib/contrast';
import { cn } from '@/lib/utils';

/** Reads token values from the loaded CSS, so the site always shows what the CSS really has. */
function useTokens(names: string[]): Record<string, string> {
  const key = names.join('|');
  return useMemo(() => Object.fromEntries(key.split('|').map((n) => [n, readToken(n)])), [key]);
}

function ContrastBadge({ ratio }: { ratio: number }) {
  const { t } = useTranslation();
  if (!ratio) return null;
  const level = ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail';
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2 text-label-medium tabular-nums',
        level === 'fail'
          ? 'bg-error-container text-on-error-container'
          : 'bg-success-container text-on-success-container',
      )}
    >
      <Icon name={level === 'fail' ? 'error' : 'check_circle'} size={16} />
      {ratio.toFixed(1).replace('.', ',')}:1 · {t(`designSystem.color.${level}`)}
    </span>
  );
}

const ROLES: { key: string; prefix: string }[] = [
  { key: 'primary', prefix: 'md-sys-color' },
  { key: 'secondary', prefix: 'md-sys-color' },
  { key: 'tertiary', prefix: 'md-sys-color' },
  { key: 'error', prefix: 'md-sys-color' },
  { key: 'success', prefix: 'md-custom-color' },
  { key: 'warning', prefix: 'md-custom-color' },
  { key: 'info', prefix: 'md-custom-color' },
];

/** One M3 color role: base and container swatches with their "on" colors and live contrast. */
function RoleCard({ role, prefix }: { role: string; prefix: string }) {
  const { t } = useTranslation();
  const v = useTokens([
    `${prefix}-${role}`,
    `${prefix}-on-${role}`,
    `${prefix}-${role}-container`,
    `${prefix}-on-${role}-container`,
  ]);
  const base = v[`${prefix}-${role}`] ?? '';
  const on = v[`${prefix}-on-${role}`] ?? '';
  const container = v[`${prefix}-${role}-container`] ?? '';
  const onContainer = v[`${prefix}-on-${role}-container`] ?? '';
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
      <div
        className="flex h-24 flex-col justify-between p-3"
        style={{ background: `var(--${prefix}-${role})`, color: `var(--${prefix}-on-${role})` }}
      >
        <span className="text-label-large">{t(`designSystem.color.roles.${role}`)}</span>
        <span className="text-label-medium tabular-nums uppercase">{base}</span>
      </div>
      <div
        className="flex h-14 items-end justify-between p-3"
        style={{ background: `var(--${prefix}-${role}-container)`, color: `var(--${prefix}-on-${role}-container)` }}
      >
        <span className="text-label-medium">{t('designSystem.color.container')}</span>
        <span className="text-label-medium tabular-nums uppercase">{container}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-body-small text-on-surface-variant">{t(`designSystem.color.uses.${role}`)}</p>
        <div className="flex flex-wrap gap-1.5">
          {base && on && <ContrastBadge ratio={contrast(base, on)} />}
          {container && onContainer && <ContrastBadge ratio={contrast(container, onContainer)} />}
        </div>
      </div>
    </li>
  );
}

const SURFACES = [
  'surface',
  'surface-container-lowest',
  'surface-container',
  'surface-container-high',
  'on-surface',
  'on-surface-variant',
  'outline',
  'outline-variant',
  'inverse-surface',
];

export function ColorSection() {
  const { t } = useTranslation();
  const surfaces = useTokens(SURFACES.map((s) => `md-sys-color-${s}`));
  const charts = useTokens(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']);
  const people = useTokens(['rumbo-role-hr', 'rumbo-role-manager', 'rumbo-role-hire', 'rumbo-role-it']);
  const demo = [
    { key: 'hr', name: 'Carla Méndez', role: 'admin' as const },
    { key: 'manager', name: 'Martín Rossi', role: 'manager' as const },
    { key: 'hire', name: 'Sofía Ramírez', role: 'hire' as const },
    { key: 'it', name: 'Diego Ferreyra', role: 'it_admin' as const },
  ];
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-title-large text-on-surface">{t('designSystem.color.brand')}</h3>
        <ul className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.slice(0, 3).map((r) => (
            <RoleCard key={r.key} role={r.key} prefix={r.prefix} />
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-title-large text-on-surface">{t('designSystem.color.status')}</h3>
        <ul className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.slice(3).map((r) => (
            <RoleCard key={r.key} role={r.key} prefix={r.prefix} />
          ))}
        </ul>
        <p className="flex items-start gap-2 text-body-medium text-on-surface-variant">
          <Icon name="info" size={20} className="shrink-0 text-info" />
          {t('designSystem.color.rule')}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-title-large text-on-surface">{t('designSystem.color.surfaces')}</h3>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <li
              key={s}
              className="flex min-w-0 items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-2"
            >
              <span
                aria-hidden
                className="size-12 shrink-0 rounded-sm border border-outline-variant"
                style={{ background: `var(--md-sys-color-${s})` }}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <code className="truncate text-label-medium text-on-surface">{s}</code>
                <span className="text-body-small text-on-surface-variant">
                  {t(`designSystem.color.surfaceNames.${s}`)} ·{' '}
                  <span className="uppercase tabular-nums">{surfaces[`md-sys-color-${s}`]}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
          <h3 className="text-title-large text-on-surface">{t('designSystem.color.people')}</h3>
          <p className="text-body-medium text-on-surface-variant">{t('designSystem.color.peopleNote')}</p>
          <ul className="grid grid-cols-2 gap-3">
            {demo.map((p) => (
              <li key={p.key} className="flex min-w-0 items-center gap-3">
                <Avatar name={p.name} role={p.role} size="lg" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-title-small text-on-surface">
                    {t(`designSystem.color.peopleNames.${p.key}`)}
                  </span>
                  <span className="text-body-small text-on-surface-variant uppercase tabular-nums">
                    {people[`rumbo-role-${p.key}`]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
          <h3 className="text-title-large text-on-surface">{t('designSystem.color.charts')}</h3>
          <p className="text-body-medium text-on-surface-variant">{t('designSystem.color.chartsNote')}</p>
          <ol className="flex h-28 items-end gap-1.5 sm:gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className="w-full rounded-t-sm"
                  style={{ height: `${100 - i * 12}%`, minHeight: '2rem', background: `var(--chart-${i})` }}
                />
                <span className="w-full truncate text-center text-label-small text-on-surface-variant uppercase tabular-nums">
                  {charts[`chart-${i}`]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Literal class names, so Tailwind generates them (it does not see template strings). */
const TYPE_CLASS: Record<string, string> = {
  'display-small': 'text-display-small',
  'headline-small': 'text-headline-small',
  'title-large': 'text-title-large',
  'title-medium': 'text-title-medium',
  'title-small': 'text-title-small',
  'body-large': 'text-body-large',
  'body-medium': 'text-body-medium',
  'body-small': 'text-body-small',
  'label-large': 'text-label-large',
  'label-medium': 'text-label-medium',
  'label-small': 'text-label-small',
};
const SHAPE_CLASS: Record<string, string> = {
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const TYPE_ROLES = [
  'display-small',
  'headline-small',
  'title-large',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
];

/** One type role: the sample in its real class and the size read from the browser. */
function TypeRow({ role }: { role: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLParagraphElement>(null);
  const specRef = useRef<HTMLSpanElement>(null);
  // Size, line height and weight as the browser renders them, written straight into the DOM.
  useEffect(() => {
    if (!ref.current || !specRef.current) return;
    const s = getComputedStyle(ref.current);
    const px = (v: string) => Math.round(parseFloat(v));
    specRef.current.textContent = `${px(s.fontSize)} / ${px(s.lineHeight) || '·'} · ${s.fontWeight}`;
  }, []);
  return (
    <li className="grid min-w-0 grid-cols-1 gap-2 border-b border-outline-variant py-4 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)_10rem] md:items-baseline md:gap-6">
      <code className="text-label-medium text-primary">text-{role}</code>
      <p ref={ref} className={cn(TYPE_CLASS[role], 'min-w-0 break-words text-on-surface')}>
        {t(`designSystem.type.samples.${role}`)}
      </p>
      <span className="flex flex-col text-body-small text-on-surface-variant md:text-right">
        <span ref={specRef} className="tabular-nums" />
        <span>{t(`designSystem.type.uses.${role}`)}</span>
      </span>
    </li>
  );
}

export function TypeSection() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
      <ul className="flex flex-col">
        {TYPE_ROLES.map((r) => (
          <TypeRow key={r} role={r} />
        ))}
      </ul>
      <p className="text-body-small text-on-surface-variant">{t('designSystem.type.note')}</p>
    </div>
  );
}

export function SpaceSection() {
  const { t } = useTranslation();
  const spaces = ['space-gutter', 'space-bento-gap', 'space-card-padding', 'space-section'];
  const sv = useTokens(spaces);
  const shapes = ['xs', 'sm', 'md', 'lg', 'xl', 'full'];
  return (
    <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        <h3 className="text-title-large text-on-surface">{t('designSystem.space.spacing')}</h3>
        <ul className="flex flex-col gap-3">
          {spaces.map((s) => (
            <li key={s} className="flex min-w-0 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-2">
                <code className="text-label-medium text-on-surface">--{s}</code>
                <span className="text-body-small text-on-surface-variant tabular-nums">{sv[s]}</span>
              </span>
              <span className="h-3 rounded-full bg-primary" style={{ width: `var(--${s})` }} />
              <span className="text-body-small text-on-surface-variant">{t(`designSystem.space.tokens.${s}`)}</span>
            </li>
          ))}
        </ul>
        <p className="text-body-small text-on-surface-variant">{t('designSystem.space.rhythm')}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        <h3 className="text-title-large text-on-surface">{t('designSystem.space.shape')}</h3>
        <ul className="grid grid-cols-2 gap-3">
          {shapes.map((s) => (
            <li key={s} className="flex flex-col items-start gap-1.5">
              <span
                aria-hidden
                className={cn('h-12 w-full border border-primary/40 bg-primary-container', SHAPE_CLASS[s])}
              />
              <span className="text-body-small text-on-surface-variant">{t(`designSystem.space.shapes.${s}`)}</span>
            </li>
          ))}
        </ul>
        <p className="text-body-small text-on-surface-variant">{t('designSystem.space.shapeNote')}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface p-4 md:p-6">
        <h3 className="text-title-large text-on-surface">{t('designSystem.space.elevation')}</h3>
        <ul className="flex flex-col gap-4">
          <li className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-medium text-on-surface">
            {t('designSystem.space.levels.tonal')}
          </li>
          <li className="rounded-lg bg-surface-container-lowest p-4 text-body-medium text-on-surface shadow-elevation-1">
            {t('designSystem.space.levels.e1')}
          </li>
          <li className="rounded-lg bg-surface-container-lowest p-4 text-body-medium text-on-surface shadow-elevation-2">
            {t('designSystem.space.levels.e2')}
          </li>
        </ul>
      </div>
    </div>
  );
}

const ICONS: IconName[] = [
  'home',
  'dashboard',
  'group',
  'route',
  'task_alt',
  'event',
  'fact_check',
  'flag',
  'lock',
  'security',
  'support_agent',
  'notifications',
];

export function IconsSection() {
  const { t } = useTranslation();
  const rules = t('designSystem.icons.rules', { returnObjects: true }) as string[];
  return (
    <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {ICONS.map((name) => (
            <li key={name} className="flex flex-col items-center gap-2 rounded-md bg-surface-container p-3">
              <span className="flex gap-2 text-on-surface">
                <Icon name={name} size={24} />
                <Icon name={name} size={24} filled className="text-primary" />
              </span>
              <code className="w-full truncate text-center text-label-small text-on-surface-variant">{name}</code>
            </li>
          ))}
        </ul>
        <p className="flex gap-4 text-body-small text-on-surface-variant">
          <span>{t('designSystem.icons.outline')}</span>
          <span className="text-primary">{t('designSystem.icons.filled')}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        {rules.map((r) => (
          <li key={r} className="flex items-start gap-2 text-body-medium text-on-surface">
            <Icon name="check_circle" size={20} className="shrink-0 text-success" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Plots a CSS cubic-bezier() so the curve is visible, not only named. */
function Curve({ value }: { value: string }) {
  const nums = (value.match(/-?[\d.]+/g) ?? []).map(Number);
  if (nums.length !== 4) return <span className="block h-24" />;
  const [x1, y1, x2, y2] = nums as [number, number, number, number];
  const p = (x: number, y: number) => `${8 + x * 84},${92 - y * 84}`;
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
      <rect x="8" y="8" width="84" height="84" fill="none" stroke="var(--md-sys-color-outline-variant)" />
      <path
        d={`M${p(0, 0)} C${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}`}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MotionSection() {
  const { t } = useTranslation();
  const v = useTokens([
    'md-sys-motion-easing-standard',
    'md-sys-motion-easing-emphasized-decelerate',
    'md-sys-motion-easing-emphasized-accelerate',
    'md-sys-motion-duration-short',
    'md-sys-motion-duration-medium',
    'md-sys-motion-duration-long',
  ]);
  const [run, setRun] = useState(0);
  const uses = t('designSystem.motion.uses', { returnObjects: true }) as string[];
  const curves: [string, string][] = [
    ['standard', 'md-sys-motion-easing-standard'],
    ['decelerate', 'md-sys-motion-easing-emphasized-decelerate'],
    ['accelerate', 'md-sys-motion-easing-emphasized-accelerate'],
  ];
  return (
    <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        <ul className="flex flex-col gap-3">
          {curves.map(([k, token]) => (
            <li key={k} className="flex min-w-0 items-center gap-4">
              <Curve value={v[token] ?? ''} />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-title-small text-on-surface">{t(`designSystem.motion.curves.${k}`)}</span>
                <code className="text-body-small break-all text-on-surface-variant">{v[token]}</code>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-body-medium text-on-surface">
          {t('designSystem.motion.durations')}: {t('designSystem.motion.short')} {v['md-sys-motion-duration-short']} ·{' '}
          {t('designSystem.motion.medium')} {v['md-sys-motion-duration-medium']} · {t('designSystem.motion.long')}{' '}
          {v['md-sys-motion-duration-long']}
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
        <ul key={run} className="ds-stagger flex flex-col gap-2">
          {uses.map((u) => (
            <li
              key={u}
              className="flex items-start gap-2 rounded-md bg-surface-container px-3 py-2 text-body-medium text-on-surface"
            >
              <Icon name="check_circle" size={20} className="shrink-0 text-primary" />
              {u}
            </li>
          ))}
        </ul>
        <Button variant="outlined" leadingIcon="refresh" className="w-fit" onClick={() => setRun((n) => n + 1)}>
          {t('designSystem.motion.replay')}
        </Button>
        <p className="text-body-small text-on-surface-variant">{t('designSystem.motion.reduced')}</p>
      </div>
    </div>
  );
}
