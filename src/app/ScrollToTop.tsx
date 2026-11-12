import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/**
 * Every new screen opens from the top (D-138). React Router keeps the window where it was, so
 * going from a long list to a record showed the record from the middle. Only a change of
 * screen (pathname) scrolls: query changes on the same screen (A4 opens comments with
 * `?comments=`) keep the place. Back and forward (POP) are left to the browser.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  const previous = useRef(pathname);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (type !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, type]);

  return null;
}
