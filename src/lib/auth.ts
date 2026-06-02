import type { Role, Station, User } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  kellner: 'Service',
  kueche: 'Küche',
};

export const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-violet-100 text-violet-700',
  kellner: 'bg-brand-100 text-brand-700',
  kueche: 'bg-amber-100 text-amber-700',
};

/** Zentrale Rechtevergabe. Admin darf grundsätzlich alles. */
export const can = {
  reports: (role?: Role) => role === 'admin',
  stats: (role?: Role) => role === 'admin',
  history: (role?: Role) => role === 'admin',
  manage: (role?: Role) => role === 'admin',
  menu: (role?: Role) => role === 'admin',
  floor: (role?: Role) => role === 'admin' || role === 'kellner',
  kitchen: (role?: Role) => role === 'admin' || role === 'kueche',
};

/** Stationen, die ein Benutzer sehen darf. Admin und Service sehen alle. */
export function allowedStations(user: User | undefined, stations: Station[]): Station[] {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'kellner') return stations;
  return stations.filter((st) => user.stationIds.includes(st.id));
}
