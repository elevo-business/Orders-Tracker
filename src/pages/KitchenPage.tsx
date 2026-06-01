import { useEffect, useState } from 'react';
import { Check, Clock, Flame } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Order } from '@/types';

/** Tickt jede Sekunde, damit die „seit X Min"-Anzeige live mitläuft. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function elapsed(now: number, ts?: number): { mins: number; label: string } {
  if (!ts) return { mins: 0, label: '0:00' };
  const sec = Math.floor((now - ts) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return { mins: m, label: `${m}:${s.toString().padStart(2, '0')}` };
}

export function KitchenPage() {
  const now = useNow();
  const orders = useStore((s) => s.orders);
  const setItemStatus = useStore((s) => s.setItemStatus);
  const bumpOrder = useStore((s) => s.bumpOrder);

  // Bestellungen mit noch offenen Küchen-Positionen, älteste zuerst
  const active = orders
    .filter((o) => o.status === 'gesendet' && o.items.some((i) => i.status === 'zubereitung' || i.status === 'fertig'))
    .sort((a, b) => (a.sentAt ?? 0) - (b.sentAt ?? 0));

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Flame className="text-orange-400" /> Küchen-Display
          </h1>
          <p className="text-sm text-slate-400">Live-Bestellungen · {active.length} offen</p>
        </div>
        <span className="rounded-full bg-slate-800 px-4 py-2 text-sm font-mono">
          {new Date(now).toLocaleTimeString('de-DE')}
        </span>
      </header>

      <div className="scroll-area flex-1 px-6 pb-6">
        {active.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
            <Check size={56} />
            <p className="text-lg font-semibold">Alles erledigt – keine offenen Bestellungen</p>
          </div>
        ) : (
          <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.map((order) => (
              <KitchenTicket key={order.id} order={order} now={now} onItem={setItemStatus} onBump={bumpOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KitchenTicket({
  order,
  now,
  onItem,
  onBump,
}: {
  order: Order;
  now: number;
  onItem: (orderId: string, itemId: string, status: 'fertig' | 'serviert') => void;
  onBump: (orderId: string) => void;
}) {
  const { mins, label } = elapsed(now, order.sentAt);
  // Farbcodierung nach Wartezeit
  const urgency = mins >= 15 ? 'border-red-500' : mins >= 8 ? 'border-amber-400' : 'border-slate-700';
  const kitchenItems = order.items.filter((i) => i.status === 'zubereitung' || i.status === 'fertig');
  const allReady = kitchenItems.every((i) => i.status === 'fertig');

  return (
    <div className={`flex flex-col rounded-2xl border-t-4 bg-slate-800 ${urgency}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-lg font-extrabold">{order.tableName}</p>
          <p className="text-xs text-slate-400">#{order.number}</p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-sm font-bold ${
            mins >= 15 ? 'bg-red-500 text-white' : mins >= 8 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700'
          }`}
        >
          <Clock size={14} /> {label}
        </span>
      </div>

      <div className="space-y-1 px-3 pb-3">
        {kitchenItems.map((item) => {
          const done = item.status === 'fertig';
          return (
            <button
              key={item.id}
              onClick={() => onItem(order.id, item.id, done ? 'serviert' : 'fertig')}
              className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition active:scale-[0.98] ${
                done ? 'bg-green-500/15 text-green-300' : 'bg-slate-700/60 hover:bg-slate-700'
              }`}
            >
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${done ? 'border-green-400 bg-green-400 text-slate-900' : 'border-slate-500'}`}>
                {done && <Check size={14} />}
              </span>
              <span className="flex-1">
                <span className="font-bold">
                  {item.qty}× {item.name}
                </span>
                {item.modifiers.length > 0 && (
                  <span className="block text-sm text-slate-400">
                    {item.modifiers.map((m) => m.name).join(', ')}
                  </span>
                )}
                {item.note && <span className="block text-sm font-semibold text-amber-300">⚠ {item.note}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onBump(order.id)}
        className={`m-3 mt-0 rounded-xl py-3 font-bold transition active:scale-[0.98] ${
          allReady ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
        }`}
      >
        {allReady ? '✓ Alle fertig' : 'Alle als fertig markieren'}
      </button>
    </div>
  );
}
