/**
 * Page templates of the information architecture (docs/information-architecture.md, section 7),
 * used to show a loading state with the shape of the screen that is coming (D-140).
 */
export type PageKind = 'dashboard' | 'list' | 'cards' | 'detail' | 'form' | 'steps';

const RULES: [RegExp, PageKind][] = [
  // Panels: the home of each role, the security summary and the reports
  [/^\/(admin|manager|me)\/?$/, 'dashboard'],
  [/^\/it\/security\/?$/, 'dashboard'],
  [/^\/admin\/reports\/?$/, 'dashboard'],
  // Template catalog (2.2.1, pattern 11)
  [/^\/admin\/templates\/?$/, 'cards'],
  // Forms
  [/^\/admin\/hires\/new\/?$/, 'form'],
  [/^\/manager\/hires\/[^/]+\/checkin\/[^/]+\/?$/, 'form'],
  [/^\/me\/checkin(\/[^/]+)?\/?$/, 'form'],
  [/^\/account\/preferences\/?$/, 'form'],
  // Records
  [/^\/admin\/(hires|people|templates)\/[^/]+(\/(preview|versions))?\/?$/, 'detail'],
  [/^\/manager\/hires\/[^/]+\/?$/, 'detail'],
  [/^\/it\/(requests|access-reviews)\/[^/]+\/?$/, 'detail'],
  [/^\/me\/tasks\/[^/]+\/?$/, 'detail'],
  // Step flows outside the layout
  [/^\/(login(\/.*)?|consent|access-help)\/?$/, 'steps'],
];

/** The page template of a route; listings are the default. */
export function pageKind(pathname: string): PageKind {
  return RULES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'list';
}
