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

  const openKitchenItems = orders
    .filter((o) => o.status === 'gesendet')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'zubereitung' && myStationIds.includes(i.stationId)).length;

  const openTables = orders.filter((o) => o.status === 'offen' || o.status === 'gesendet').length;

  const nav: NavItem[] = [
    { to: '/pos', label: 'Tische', icon: <LayoutGrid size={22} />, badge: openTables, show: can.floor(role) },
    { to: '/kitchen', label: 'Küche', icon: <ChefHat size={22} />, badge: openKitchenItems, show: can.kitchen(role) },
    { to: '/menu', label: 'Karte', icon: <UtensilsCrossed size={22} />, show: can.menu(role) },
    { to: '/reports', label: 'Berichte', icon: <BarChart3 size={22} />, show: can.reports(role) },
    { to: '/history', label: 'Rechnungen', icon: <ReceiptText size={22} />, show: can.history(role) },
    { to: '/settings', label: 'Verwaltung', icon: <Settings size={22} />, show: can.manage(role) },
  ].filter((item) => item.show);

  // Der Bestell-Screen läuft im Vollbild ohne Navigation (eigener Zurück-Button).
  const isOrderScreen = location.pathname.startsWith('/order/');

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100 md:flex-row">
      {/* Seitenleiste – ab Tablet (md) */}
      {!isOrderScreen && (
        <aside className="hidden w-24 shrink-0 flex-col items-center gap-1 bg-slate-900 py-4 text-slate-400 md:flex">
          <div className="mb-4 flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop">
              <ClipboardList size={26} />
            </div>
            <span className="text-[10px] font-bold tracking-wide text-slate-500">ELEVO</span>
          </div>

          <nav className="flex flex-1 flex-col items-center gap-1">
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
                {item.badge ? <Badge count={item.badge} /> : null}
              </NavLink>
            ))}
          </nav>

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

      {/* Inhalt */}
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

      {/* Untere Navigationsleiste – nur Handy (unter md) */}
      {!isOrderScreen && (
        <nav className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-t border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-400 md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex min-w-[58px] flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`
              }
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
              {item.badge ? <Badge count={item.badge} /> : null}
            </NavLink>
          ))}
          {user && (
            <button
              onClick={logout}
              className="flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-slate-400"
            >
              <LogOut size={22} />
              <span>Abmelden</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
