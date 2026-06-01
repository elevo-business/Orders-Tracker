import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChefHat,
  ClipboardList,
  LayoutGrid,
  BarChart3,
  Settings,
  UtensilsCrossed,
  ReceiptText,
  LogOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSession } from '@/store/useSession';
import { useCurrentUser } from '@/store/useCurrentUser';
import { ROLE_LABELS, allowedStations, can } from '@/lib/auth';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  show: boolean;
}

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const orders = useStore((s) => s.orders);
  const stations = useStore((s) => s.stations);
  const user = useCurrentUser();
  const logout = useSession((s) => s.logout);

  const role = user?.role;
  const myStationIds = allowedStations(user, stations).map((s) => s.id);

  // Offene Küchen-Positionen, die diesen Benutzer betreffen
  const openKitchenItems = orders
    .filter((o) => o.status === 'gesendet')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'zubereitung' && myStationIds.includes(i.stationId)).length;

  const openTables = orders.filter((o) => o.status === 'offen' || o.status === 'gesendet').length;

  const nav: NavItem[] = [
    { to: '/pos', label: 'Tische', icon: <LayoutGrid size={24} />, badge: openTables, show: can.floor(role) },
    { to: '/kitchen', label: 'Küche', icon: <ChefHat size={24} />, badge: openKitchenItems, show: can.kitchen(role) },
    { to: '/menu', label: 'Karte', icon: <UtensilsCrossed size={24} />, show: can.menu(role) },
    { to: '/reports', label: 'Berichte', icon: <BarChart3 size={24} />, show: can.reports(role) },
    { to: '/history', label: 'Rechnungen', icon: <ReceiptText size={24} />, show: can.history(role) },
    { to: '/settings', label: 'Verwaltung', icon: <Settings size={24} />, show: can.manage(role) },
  ];

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

          <nav className="flex flex-1 flex-col items-center gap-1">
            {nav
              .filter((item) => item.show)
              .map((item) => (
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
          </nav>

          {/* Aktueller Benutzer + Abmelden */}
          {user && (
            <button
              onClick={logout}
              className="flex w-20 flex-col items-center gap-1 rounded-2xl py-3 text-xs font-semibold text-slate-400 transition hover:bg-slate-800/60 hover:text-red-300"
              title={`${user.name} · ${ROLE_LABELS[user.role]} – Abmelden`}
            >
              <LogOut size={22} />
              <span className="max-w-[72px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          )}
        </aside>
      )}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
