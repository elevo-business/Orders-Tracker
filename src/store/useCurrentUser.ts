import { useStore } from './useStore';
import { useSession } from './useSession';
import type { User } from '@/types';

/** Liefert den aktuell angemeldeten Benutzer (oder undefined). */
export function useCurrentUser(): User | undefined {
  const userId = useSession((s) => s.currentUserId);
  return useStore((s) => s.users.find((u) => u.id === userId));
}
