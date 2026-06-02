import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { LoginScreen } from '@/components/LoginScreen';
import { FloorPage } from '@/pages/FloorPage';
import { OrderPage } from '@/pages/OrderPage';
import { KitchenPage } from '@/pages/KitchenPage';
import { MenuPage } from '@/pages/MenuPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { StatsPage } from '@/pages/StatsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useCurrentUser } from '@/store/useCurrentUser';
import { can } from '@/lib/auth';
import type { ReactNode } from 'react';

export default function App() {
  const user = useCurrentUser();

  if (!user) return <LoginScreen />;

  const role = user.role;
  // Startseite je nach Rolle
  const home = can.floor(role) ? '/pos' : can.kitchen(role) ? '/kitchen' : '/reports';

  const guard = (allowed: boolean, node: ReactNode) =>
    allowed ? node : <Navigate to={home} replace />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="/pos" element={guard(can.floor(role), <FloorPage />)} />
        <Route path="/order/:orderId" element={guard(can.floor(role), <OrderPage />)} />
        <Route path="/kitchen" element={guard(can.kitchen(role), <KitchenPage />)} />
        <Route path="/menu" element={guard(can.menu(role), <MenuPage />)} />
        <Route path="/reports" element={guard(can.reports(role), <ReportsPage />)} />
        <Route path="/stats" element={guard(can.stats(role), <StatsPage />)} />
        <Route path="/history" element={guard(can.history(role), <HistoryPage />)} />
        <Route path="/settings" element={guard(can.manage(role), <SettingsPage />)} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </Shell>
  );
}
