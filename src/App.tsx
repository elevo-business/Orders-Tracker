import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { FloorPage } from '@/pages/FloorPage';
import { OrderPage } from '@/pages/OrderPage';
import { KitchenPage } from '@/pages/KitchenPage';
import { MenuPage } from '@/pages/MenuPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<FloorPage />} />
        <Route path="/order/:orderId" element={<OrderPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </Shell>
  );
}
