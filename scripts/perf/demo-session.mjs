// Signs in a demo person on the production build with the real flow (G1 → SSO → MFA), then
// marks the privacy notice as accepted and the guided welcome as seen, so the measured page is
// the screen itself and not G8 or the welcome dialog. Used by the performance scripts (D-131).
const PERSON = { carla: 'p-carla', martin: 'p-martin', sofia: 'p-sofia', diego: 'p-diego' };

export async function signIn(page, base, demo) {
  // Start signed out: clear the session from a same-origin page that does not run the app,
  // since the running app writes its session back (activity tracking).
  await page.goto(`${base}robots.txt`);
  await page.evaluate(() => localStorage.removeItem('rumbo-session'));
  await page.goto(`${base}#/login?demo=${demo}`);
  await page.getByRole('button', { name: 'Continuar con Microsoft' }).click();
  // G2 goes on by itself to the verification with the demo code already filled in
  await page.getByRole('button', { name: 'Verificar', exact: true }).click({ timeout: 15000 });
  await page.waitForURL((url) => !url.hash.startsWith('#/login'), { timeout: 15000 });
  await page.evaluate((personId) => {
    const data = JSON.parse(localStorage.getItem('rumbo-data') ?? '{"state":{}}');
    const state = data.state;
    state.consents = [
      ...(state.consents ?? []).filter((c) => c.personId !== personId),
      { personId, noticeVersion: state.securityPolicy?.privacyNoticeVersion ?? '2026.1', acceptedAt: '2026-11-01T12:00:00.000Z' },
    ];
    localStorage.setItem('rumbo-data', JSON.stringify(data));
    const session = JSON.parse(localStorage.getItem('rumbo-session'));
    session.state.welcomeSeen = Object.values({ a: 'p-carla', b: 'p-martin', c: 'p-sofia', d: 'p-diego' });
    localStorage.setItem('rumbo-session', JSON.stringify(session));
  }, PERSON[demo]);
}
