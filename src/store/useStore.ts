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
  Table,
} from '@/types';
import { uid } from '@/lib/id';
import { seedCategories, seedProducts, seedSettings, seedTables } from './seed';

/** Felder, die persistiert und zwischen Tabs/Geräten synchronisiert werden. */
interface DataState {
  settings: Settings;
  categories: Category[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  orderCounter: number;
}

interface Actions {
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
  addItem: (orderId: ID, product: Product, modifiers: ModifierOption[], note?: string) => void;
  changeQty: (orderId: ID, itemId: ID, delta: number) => void;
  removeItem: (orderId: ID, itemId: ID) => void;
  setItemNote: (orderId: ID, itemId: ID, note: string) => void;
  sendOrder: (orderId: ID) => void;
  setItemStatus: (orderId: ID, itemId: ID, status: OrderItem['status']) => void;
  bumpOrder: (orderId: ID) => void;
  payOrder: (orderId: ID, payment: Payment) => void;
  cancelOrder: (orderId: ID) => void;

  // Einstellungen / Wartung
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemoData: () => void;
}

type Store = DataState & Actions;

const initialData: DataState = {
  settings: seedSettings,
  categories: seedCategories,
  products: seedProducts,
  tables: seedTables,
  orders: [],
  orderCounter: 0,
};

const STORAGE_KEY = 'elevo-pos-v1';
const SYNC_CHANNEL = 'elevo-pos-sync';

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

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
        };
        set((s) => ({ orders: [...s.orders, order], orderCounter: number }));
        return order.id;
      },

      addItem: (orderId, product, modifiers, note) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const unitPrice = product.price + modifiers.reduce((sum, m) => sum + m.price, 0);
            const modSig = modifiers.map((m) => m.id).sort().join(',');
            // Gleiche Position (Produkt + Optionen + Notiz), die noch nicht gefeuert wurde → Menge erhöhen.
            const match = o.items.find(
              (i) =>
                i.productId === product.id &&
                i.status === 'neu' &&
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
            const items = o.items
              .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
              .filter((i) => i.qty > 0);
            return { ...o, items };
          }),
        })),

      removeItem: (orderId, itemId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o,
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

      bumpOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  items: o.items.map((i) =>
                    i.status === 'zubereitung' ? { ...i, status: 'fertig' as const } : i,
                  ),
                }
              : o,
          ),
        })),

      payOrder: (orderId, payment) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'bezahlt',
                  paidAt: Date.now(),
                  payment,
                  items: o.items.map((i) => ({ ...i, status: 'serviert' as const })),
                }
              : o,
          ),
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
  'categories',
  'products',
  'tables',
  'orders',
  'orderCounter',
];

function pickData(state: Store): DataState {
  return {
    settings: state.settings,
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
