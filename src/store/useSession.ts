import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ID } from '@/types';

/** Die Anmeldung gilt pro Gerät/Tab (sessionStorage), nicht geräteübergreifend.
 *  So kann ein Tablet als „Küche", ein anderes als „Service" angemeldet sein. */
interface SessionState {
  currentUserId: ID | null;
  /** Im Küchen-Display aktuell ausgewählte Stationen. */
  selectedStationIds: ID[];
  soundEnabled: boolean;

  login: (userId: ID, allowedStationIds: ID[]) => void;
  logout: () => void;
  setSelectedStations: (ids: ID[]) => void;
  toggleSound: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      currentUserId: null,
      selectedStationIds: [],
      soundEnabled: true,

      login: (userId, allowedStationIds) =>
        set({ currentUserId: userId, selectedStationIds: allowedStationIds }),
      logout: () => set({ currentUserId: null, selectedStationIds: [] }),
      setSelectedStations: (ids) => set({ selectedStationIds: ids }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: 'elevo-pos-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
