import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { orderTotal } from '@/lib/order';
import type { Order, Table } from '@/types';

function minutesSince(ts?: number): number {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / 60000);
}

export function FloorPage() {
  const navigate = useNavigate();
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const openOrderForTable = useStore((s) => s.openOrderForTable);
  const startTakeaway = useStore((s) => s.startTakeaway);

  const activeOrderByTable = new Map<string, Order>();
  for (const o of orders) {
    if (o.tableId && (o.status === 'offen' || o.status === 'gesendet')) {
      activeOrderByTable.set(o.tableId, o);
    }
  }

  const takeawayOrders = orders.filter(
    (o) => o.type === 'mitnahme' && (o.status === 'offen' || o.status === 'gesendet'),
  );

  const zones = [...new Set(tables.map((t) => t.zone))];

  const handleTable = (table: Table) => {
    const id = openOrderForTable(table);
    navigate(`/order/${id}`);
  };

  const handleTakeaway = () => {
    const id = startTakeaway();
    navigate(`/order/${id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tischübersicht</h1>
          <p className="text-sm text-slate-500">Tisch wählen, um eine Bestellung zu öffnen</p>
        </div>
        <button onClick={handleTakeaway} className="btn-primary">
          <ShoppingBag size={20} /> Mitnahme
        </button>
      </header>

      <div className="scroll-area flex-1 px-8 pb-8">
        {takeawayOrders.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
              Mitnahme ({takeawayOrders.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {takeawayOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/order/${o.id}`)}
                  className="card flex flex-col gap-1 border-l-4 border-amber-400 p-4 text-left active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <ShoppingBag size={18} className="text-amber-500" /> #{o.number}
                  </span>
                  <span className="text-sm text-slate-500">{o.items.length} Pos.</span>
                  <span className="text-lg font-extrabold">{formatMoney(orderTotal(o))}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {zones.map((zone) => (
          <section key={zone} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">{zone}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {tables
                .filter((t) => t.zone === zone)
                .map((table) => {
                  const order = activeOrderByTable.get(table.id);
                  const occupied = !!order;
                  const total = order ? orderTotal(order) : 0;
                  const mins = minutesSince(order?.createdAt);
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTable(table)}
                      className={`relative flex aspect-square flex-col justify-between rounded-2xl p-4 text-left shadow-card transition active:scale-[0.97] ${
                        occupied
                          ? order!.status === 'gesendet'
                            ? 'bg-brand-600 text-white'
                            : 'bg-amber-400 text-slate-900'
                          : 'bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-lg font-extrabold">{table.name}</span>
                        <span className="flex items-center gap-1 text-xs opacity-80">
                          <Users size={14} /> {table.seats}
                        </span>
                      </div>
                      {occupied ? (
                        <div>
                          <div className="flex items-center gap-1 text-xs opacity-90">
                            <Clock size={13} /> {mins} Min
                          </div>
                          <div className="text-xl font-extrabold">{formatMoney(total)}</div>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">frei</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
