import { HashRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';

/**
 * HashRouter is required for GitHub Pages: the server only knows `index.html`,
 * so client routes live after the `#`.
 */
export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
