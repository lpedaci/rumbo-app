import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import es from '@/locales/es.json';
import { RouteErrorPage } from './RouteErrorPage';

function Broken(): never {
  throw new Error('features.map is not a function');
}

describe('RouteErrorPage (D-71)', () => {
  it('replaces the raw stack with a clear page and ways out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([{ path: '/', element: <Broken />, errorElement: <RouteErrorPage /> }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { level: 1, name: es.errorPage.title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.errorPage.reload })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.errorPage.home })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: es.errorPage.reset })).toBeInTheDocument();
    // The technical detail is there, folded and as plain text
    expect(screen.getByText('features.map is not a function')).toBeInTheDocument();
  });
});
