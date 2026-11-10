import { HashRouter } from 'react-router';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

/**
 * HashRouter is required for GitHub Pages: the server only knows `index.html`,
 * so client routes live after the `#`.
 */
export function App() {
  return (
    <HashRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  );
}
