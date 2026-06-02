import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Category,
  ID,
  ModifierOption,
  Order,
  OrderItem,
  Payment,
  Product,
  Settings,
  Station,
  Table,
  User,
  Variant,
} from '@/types';
import { uid } from '@/lib/id';
import {
  seedCategories,
  seedProducts,
  seedSettings,
  seedStations,
  seedTables,
  seedUsers,
} from './seed';

/** Felder, die persistiert und zwischen Tabs/Geräten synchronisiert werden. */
interface DataState {
  settings: Settings;
  stations: Station[];
  users: User[];
  categories: Category[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  orderCounter: number;
}

interface Actions {
  // Stationen / Küchen
  addStation: (data: Omit<Station, 'id'>) => void;
  updateStation: (id: ID, patch: Partial<Station>) => void;
  removeStation: (id: ID) => void;

  // Benutzer
  addUser: (data: Omit<User, 'id'>) => void;
  updateUser: (id: ID, patch: Partial<User>) => void;
  removeUser: (id: ID) => void;

  // Speisekarte
  addCategory: (data: Omit<Category, 'id' | 'sort'>) => void;
  updateCategory: (id: ID, patch: Partial<Category>) => void;
  removeCategory: (id: ID) => void;
  addProduct: (data: Omit<Product, 'id'>) => void;
  updateProduct: (id: ID, patch: Partial<Product>) => void;
  removeProduct: (id: ID) => void;

  // Bestellungen
  openOrderForTable: (table: Table) => ID;
  startTakeaway: () => ID;
  addItem: (
    orderId: ID,
    product: Product,
    modifiers: ModifierOption[],
    variant?: Variant,
    note?: string,
  ) => void;
  changeQty: (orderId: ID, itemId: ID, delta: number) => void;
  removeItem: (orderId: ID, itemId: ID) => void;
  setItemNote: (orderId: ID, itemId: ID, note: string) => void;
  sendOrder: (orderId: ID) => void;
  setItemStatus: (orderId: ID, itemId: ID, status: OrderItem['status']) => void;
  /** Markiert alle offenen Positionen der angegebenen Stationen als fertig. */
  bumpStation: (orderId: ID, stationIds: ID[]) => void;
  /** Schließt den Bon ab: alle Positionen der Stationen werden „serviert" und
   *  verschwinden damit vom Küchen-Display. */
  serveStation: (orderId: ID, stationIds: ID[]) => void;
  /** Bezahlt die Bestellung. Ohne `selection` wird der gesamte offene Betrag
   *  bezahlt; mit `selection` nur die angegebenen Artikelmengen (Teilzahlung). */
  payOrder: (orderId: ID, payment: Payment, selection?: { itemId: ID; qty: number }[]) => void;
  cancelOrder: (orderId: ID) => void;

  // Einstellungen / Wartung
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemoData: () => void;
}

type Store = DataState & Actions;

const initialData: DataState = {
  settings: seedSettings,
  stations: seedStations,
  users: seedUsers,
  categories: seedCategories,
  products: seedProducts,
  tables: seedTables,
  orders: [],
  orderCounter: 0,
};

const STORAGE_KEY = 'elevo-pos-v4';
const SYNC_CHANNEL = 'elevo-pos-sync';

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

      addStation: (data) => set((s) => ({ stations: [...s.stations, { ...data, id: uid('st-') }] })),
      updateStation: (id, patch) =>
        set((s) => ({ stations: s.stations.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),
      removeStation: (id) =>
        set((s) => ({
          stations: s.stations.filter((st) => st.id !== id),
          // Verwaiste Kategorien einer anderen Station zuordnen
          categories: s.categories.map((c) =>
            c.stationId === id ? { ...c, stationId: s.stations.find((st) => st.id !== id)?.id ?? '' } : c,
          ),
          users: s.users.map((u) => ({ ...u, stationIds: u.stationIds.filter((sid) => sid !== id) })),
        })),

      addUser: (data) => set((s) => ({ users: [...s.users, { ...data, id: uid('u-') }] })),
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      addCategory: (data) =>
        set((s) => ({
          categories: [...s.categories, { ...data, id: uid('cat-'), sort: s.categories.length + 1 }],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          products: s.products.filter((p) => p.categoryId !== id),
        })),

      addProduct: (data) => set((s) => ({ products: [...s.products, { ...data, id: uid('p-') }] })),
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      openOrderForTable: (table) => {
        const existing = get().orders.find(
          (o) => o.tableId === table.id && (o.status === 'offen' || o.status === 'gesendet'),
        );
        if (existing) return existing.id;
        const number = get().orderCounter + 1;
        const order: Order = {
          id: uid('o-'),
          number,
          type: 'tisch',
          tableId: table.id,
          tableName: table.name,
          items: [],
          status: 'offen',
          createdAt: Date.now(),
          payments: [],
        };
        set((s) => ({ orders: [...s.orders, order], orderCounter: number }));
        return order.id;
      },

      startTakeaway: () => {
        const number = get().orderCounter + 1;
        const order: Order = {
          id: uid('o-'),
          number,
          type: 'mitnahme',
          tableName: 'Mitnahme',
          items: [],
          status: 'offen',
          createdAt: Date.now(),
          payments: [],
        };
        set((s) => ({ orders: [...s.orders, order], orderCounter: number }));
        return order.id;
      },

      addItem: (orderId, product, modifiers, variant, note) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const base = variant?.price ?? product.price;
            const unitPrice = base + modifiers.reduce((sum, m) => sum + m.price, 0);
            const stationId = s.categories.find((c) => c.id === product.categoryId)?.stationId ?? '';
            const modSig = modifiers.map((m) => m.id).sort().join(',');
            // Gleiche Position (Produkt + Variante + Optionen + Notiz), die noch nicht gefeuert wurde → Menge erhöhen.
            const match = o.items.find(
              (i) =>
                i.productId === product.id &&
                i.status === 'neu' &&
                (i.variantName ?? '') === (variant?.name ?? '') &&
                (i.note ?? '') === (note ?? '') &&
                i.modifiers.map((m) => m.name).sort().join(',') ===
                  modifiers.map((m) => m.name).sort().join(','),
            );
            if (match) {
              return {
                ...o,
                items: o.items.map((i) => (i.id === match.id ? { ...i, qty: i.qty + 1 } : i)),
              };
            }
            const item: OrderItem = {
              id: uid('i-') + modSig,
              productId: product.id,
              name: product.name,
              stationId,
              variantName: variant?.name,
              unitPrice,
              qty: 1,
              modifiers: modifiers.map((m) => ({ name: m.name, price: m.price })),
              note,
              status: 'neu',
            };
            return { ...o, items: [...o.items, item] };
          }),
        })),

      changeQty: (orderId, itemId, delta) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const items = o.items.flatMap((i) => {
              if (i.id !== itemId) return [i];
              const paid = Math.max(0, i.paidQty ?? 0);
              // Menge nie unter die bereits bezahlte Menge senken.
              const newQty = Math.max(paid, i.qty + delta);
              if (newQty <= 0) return []; // nur entfernen, wenn nichts bezahlt ist
              return [{ ...i, qty: newQty }];
            });
            return { ...o, items };
          }),
        })),

      removeItem: (orderId, itemId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? // Bereits (teil-)bezahlte Positionen lassen sich nicht löschen.
                { ...o, items: o.items.filter((i) => i.id !== itemId || (i.paidQty ?? 0) > 0) }
              : o,
          ),
        })),

      setItemNote: (orderId, itemId, note) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, note } : i)) }
              : o,
          ),
        })),

      sendOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const now = Date.now();
            const items = o.items.map((i) =>
              i.status === 'neu' ? { ...i, status: 'zubereitung' as const, firedAt: now } : i,
            );
            return { ...o, items, status: 'gesendet', sentAt: o.sentAt ?? now };
          }),
        })),

      setItemStatus: (orderId, itemId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)) }
              : o,
          ),
        })),

      bumpStation: (orderId, stationIds) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  items: o.items.map((i) =>
                    i.status === 'zubereitung' && stationIds.includes(i.stationId)
                      ? { ...i, status: 'fertig' as const }
                      : i,
                  ),
                }
              : o,
          ),
        })),

      serveStation: (orderId, stationIds) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  items: o.items.map((i) =>
                    (i.status === 'zubereitung' || i.status === 'fertig') && stationIds.includes(i.stationId)
                      ? { ...i, status: 'serviert' as const }
                      : i,
                  ),
                }
              : o,
          ),
        })),

      payOrder: (orderId, payment, selection) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            let items: OrderItem[];
            if (!selection) {
              // Gesamten offenen Betrag bezahlen.
              items = o.items.map((i) => ({ ...i, paidQty: i.qty }));
            } else {
              const want = new Map(selection.map((x) => [x.itemId, Math.max(0, x.qty)]));
              items = o.items.map((i) => {
                const add = want.get(i.id);
                if (!add) return i;
                // Bezahlte Menge erhöhen, aber nie über die Gesamtmenge.
                const paid = Math.min(i.qty, Math.max(0, i.paidQty ?? 0) + add);
                return { ...i, paidQty: paid };
              });
            }
            const fullyPaid = items.length > 0 && items.every((i) => (i.paidQty ?? 0) >= i.qty);
            return {
              ...o,
              items,
              payments: [...o.payments, payment],
              status: fullyPaid ? 'bezahlt' : o.status,
              paidAt: fullyPaid ? Date.now() : o.paidAt,
            };
          }),
        })),

      cancelOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'storniert' } : o)),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetDemoData: () => set(() => ({ ...initialData })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/* ----------------------------------------------------------------------------
 * Echtzeit-Synchronisation zwischen mehreren Tabs/Fenstern desselben Geräts
 * (z. B. Kasse in einem Tab, Küchen-Display in einem anderen). Funktioniert
 * vollständig offline über die BroadcastChannel-API.
 * ------------------------------------------------------------------------- */

const DATA_KEYS: (keyof DataState)[] = [
  'settings',
  'stations',
  'users',
  'categories',
  'products',
  'tables',
  'orders',
  'orderCounter',
];

function pickData(state: Store): DataState {
  return {
    settings: state.settings,
    stations: state.stations,
    users: state.users,
    categories: state.categories,
    products: state.products,
    tables: state.tables,
    orders: state.orders,
    orderCounter: state.orderCounter,
  };
}

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  const channel = new BroadcastChannel(SYNC_CHANNEL);
  let applyingRemote = false;
  let lastSent = '';

  useStore.subscribe((state) => {
    if (applyingRemote) return;
    const data = pickData(state);
    const serialized = JSON.stringify(data);
    if (serialized === lastSent) return;
    lastSent = serialized;
    channel.postMessage(data);
  });

  channel.onmessage = (event) => {
    const incoming = event.data as Partial<DataState>;
    if (!incoming) return;
    const patch: Partial<DataState> = {};
    for (const key of DATA_KEYS) {
      if (key in incoming) (patch as Record<string, unknown>)[key] = incoming[key];
    }
    applyingRemote = true;
    lastSent = JSON.stringify(pickData({ ...useStore.getState(), ...patch } as Store));
    useStore.setState(patch as Partial<Store>);
    applyingRemote = false;
  };
}
