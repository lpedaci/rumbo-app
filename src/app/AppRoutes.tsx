import { Route, Routes } from 'react-router';
import { NotFoundPage } from '@/features/system/NotFoundPage';
import { PlaceholderPage } from '@/features/system/PlaceholderPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
