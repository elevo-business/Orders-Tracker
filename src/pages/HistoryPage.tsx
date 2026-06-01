import { useMemo, useState } from 'react';
import { Banknote, CreditCard, ReceiptText, Search, Split } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { itemTotal, orderTax, orderTotal } from '@/lib/order';
import type { Order } from '@/types';
import { Modal } from '@/components/Modal';

function methodLabel(order: Order): { label: string; icon: React.ReactNode } {
  const parts = order.payment?.parts ?? [];
  if (parts.length > 1) return { label: 'Split', icon: <Split size={16} /> };
  if (parts[0]?.method === 'karte') return { label: 'Karte', icon: <CreditCard size={16} /> };
  return { label: 'Bar', icon: <Banknote size={16} /> };
}

export function HistoryPage() {
  const orders = useStore((s) => s.orders);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);

  const paid = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'bezahlt' && o.paidAt)
        .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0)),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paid;
    return paid.filter(
      (o) =>
        String(o.number).includes(q) ||
        (o.tableName ?? '').toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [paid, query]);

  const total = filtered.reduce((sum, o) => sum + orderTotal(o), 0);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-8 py-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Rechnungsverlauf</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} Rechnungen · Summe {formatMoney(total)}
          </p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nr., Tisch oder Produkt …"
            className="input w-72 pl-10"
          />
        </div>
      </header>

      <div className="scroll-area flex-1 px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <ReceiptText size={48} />
            <p className="font-semibold">Noch keine bezahlten Rechnungen.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nr.</th>
                  <th className="px-5 py-3">Zeit</th>
                  <th className="px-5 py-3">Tisch</th>
                  <th className="px-5 py-3">Pos.</th>
                  <th className="px-5 py-3">Zahlart</th>
                  <th className="px-5 py-3 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const m = methodLabel(o);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setDetail(o)}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 font-bold">#{o.number}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {o.paidAt ? new Date(o.paidAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3">{o.tableName}</td>
                      <td className="px-5 py-3 text-slate-500">{o.items.length}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                          {m.icon} {m.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold">{formatMoney(orderTotal(o))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Beleg #${detail?.number ?? ''}`} size="sm">
        {detail && <Receipt order={detail} />}
      </Modal>
    </div>
  );
}

function Receipt({ order }: { order: Order }) {
  const settings = useStore((s) => s.settings);
  const tax = orderTax(order, settings);
  const tip = order.payment?.tip ?? 0;

  return (
    <div className="font-mono text-sm text-slate-700">
      <div className="mb-3 text-center">
        <p className="text-base font-bold">{settings.restaurantName}</p>
        <p className="text-xs text-slate-400">{settings.address}</p>
      </div>
      <div className="mb-2 flex justify-between text-xs text-slate-500">
        <span>{order.tableName}</span>
        <span>{order.paidAt ? new Date(order.paidAt).toLocaleString('de-DE') : ''}</span>
      </div>
      <div className="border-y border-dashed border-slate-300 py-2">
        {order.items.map((item) => (
          <div key={item.id} className="mb-1">
            <div className="flex justify-between">
              <span>
                {item.qty}× {item.name}
              </span>
              <span>{formatMoney(itemTotal(item))}</span>
            </div>
            {item.modifiers.length > 0 && (
              <div className="pl-4 text-xs text-slate-400">{item.modifiers.map((m) => m.name).join(', ')}</div>
            )}
          </div>
        ))}
      </div>
      <div className="py-2">
        <Row label={`inkl. ${(settings.taxRate * 100).toFixed(0)}% MwSt`} value={formatMoney(tax)} muted />
        {tip > 0 && <Row label="Trinkgeld" value={formatMoney(tip)} muted />}
        <div className="mt-1 flex justify-between text-base font-extrabold">
          <span>Summe</span>
          <span>{formatMoney(orderTotal(order) + tip)}</span>
        </div>
      </div>
      <div className="border-t border-dashed border-slate-300 pt-2 text-xs">
        {order.payment?.parts.map((p, i) => (
          <Row key={i} label={p.method === 'karte' ? 'Karte' : 'Bar'} value={formatMoney(p.amount)} muted />
        ))}
        {order.payment && order.payment.change > 0 && (
          <Row label="Rückgeld" value={formatMoney(order.payment.change)} muted />
        )}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">Vielen Dank für Ihren Besuch!</p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-slate-500' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
