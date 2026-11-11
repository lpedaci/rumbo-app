import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { appRoutes } from '@/app/App';

/** Renders the whole app at a route, with the same data router setup as production. */
export function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
