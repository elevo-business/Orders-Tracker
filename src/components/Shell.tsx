import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChefHat, ClipboardList, LayoutGrid, BarChart3, Settings, UtensilsCrossed } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const orders = useStore((s) => s.orders);

  const openKitchenItems = orders
    .filter((o) => o.status === 'gesendet')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'zubereitung').length;

  const openTables = orders.filter(
    (o) => o.status === 'offen' || o.status === 'gesendet',
  ).length;

  const nav: NavItem[] = [
    { to: '/pos', label: 'Tische', icon: <LayoutGrid size={24} />, badge: openTables },
    { to: '/kitchen', label: 'Küche', icon: <ChefHat size={24} />, badge: openKitchenItems },
    { to: '/menu', label: 'Karte', icon: <UtensilsCrossed size={24} /> },
    { to: '/reports', label: 'Berichte', icon: <BarChart3 size={24} /> },
    { to: '/settings', label: 'Einstellungen', icon: <Settings size={24} /> },
  ];

  // Order-Screen läuft im Vollbild ohne Ablenkung
  const isOrderScreen = location.pathname.startsWith('/order/');

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100">
      {!isOrderScreen && (
        <aside className="flex w-24 shrink-0 flex-col items-center gap-1 bg-slate-900 py-4 text-slate-400">
          <div className="mb-4 flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop">
              <ClipboardList size={26} />
            </div>
            <span className="text-[10px] font-bold tracking-wide text-slate-500">ELEVO</span>
          </div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex w-20 flex-col items-center gap-1 rounded-2xl py-3 text-xs font-semibold transition ${
                  isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute right-3 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </aside>
      )}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
