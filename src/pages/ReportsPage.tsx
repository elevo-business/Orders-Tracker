import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Receipt, TrendingUp, Trophy, Wallet, Calculator } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { orderTotal } from '@/lib/order';
import type { Order } from '@/types';

function isSameDay(ts: number, day: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

export function ReportsPage() {
  const orders = useStore((s) => s.orders);
  const [offset, setOffset] = useState(0); // 0 = heute, -1 = gestern

  const day = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const paid = orders.filter((o) => o.status === 'bezahlt' && o.paidAt && isSameDay(o.paidAt, day));

  // Geld-Summen auf Zahlungs-Basis: zählt ALLE an diesem Tag eingegangenen
  // Zahlungen (auch Teilzahlungen noch offener Tische) – korrekt für die Kasse.
  const dayPayments = orders.flatMap((o) => o.payments).filter((p) => isSameDay(p.at, day));
  const cash = dayPayments.reduce(
    (s, p) => s + p.parts.filter((x) => x.method === 'bar').reduce((a, b) => a + b.amount, 0),
    0,
  );
  const card = dayPayments.reduce(
    (s, p) => s + p.parts.filter((x) => x.method === 'karte').reduce((a, b) => a + b.amount, 0),
    0,
  );
  const tips = dayPayments.reduce((s, p) => s + p.tip, 0);

  const revenue = paid.reduce((sum, o) => sum + orderTotal(o), 0);
  const avg = paid.length ? Math.round(revenue / paid.length) : 0;

  const top = topProducts(paid);
  const hourly = hourlyRevenue(paid);
  const maxHour = Math.max(1, ...hourly.map((h) => h.total));

  const label = offset === 0 ? 'Heute' : offset === -1 ? 'Gestern' : day.toLocaleDateString('de-DE');

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Berichte</h1>
          <p className="text-sm text-slate-500">{day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="btn-ghost px-4">←</button>
          <span className="flex items-center px-2 font-bold">{label}</span>
          <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} className="btn-ghost px-4">→</button>
        </div>
      </header>

      <div className="scroll-area flex-1 px-8 pb-8">
        {/* Kennzahlen */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={<TrendingUp />} label="Umsatz" value={formatMoney(revenue)} accent="bg-brand-600" />
          <Kpi icon={<Receipt />} label="Bestellungen" value={String(paid.length)} accent="bg-slate-800" />
          <Kpi icon={<TrendingUp />} label="Ø Bon" value={formatMoney(avg)} accent="bg-violet-600" />
          <Kpi icon={<Banknote />} label="Trinkgeld" value={formatMoney(tips)} accent="bg-emerald-600" />
        </div>

        {/* Zahlarten */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Zahlarten</h3>
            <PayBar icon={<Banknote size={18} />} label="Bar" amount={cash} total={cash + card} color="bg-emerald-500" />
            <PayBar icon={<CreditCard size={18} />} label="Karte" amount={card} total={cash + card} color="bg-brand-500" />
          </div>

          {/* Umsatz nach Stunde */}
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Umsatz nach Stunde</h3>
            <div className="flex h-32 items-end gap-1">
              {hourly.map((h) => (
                <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand-500 transition-all"
                    style={{ height: `${(h.total / maxHour) * 100}%`, minHeight: h.total > 0 ? '4px' : '0' }}
                    title={formatMoney(h.total)}
                  />
                  {h.hour % 3 === 0 && <span className="text-[9px] text-slate-400">{h.hour}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top-Produkte */}
        <div className="card mt-4 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold">
            <Trophy size={18} className="text-amber-500" /> Top-Produkte
          </h3>
          {top.length === 0 ? (
            <p className="py-6 text-center text-slate-400">Noch keine Verkäufe.</p>
          ) : (
            <div className="space-y-2">
              {top.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-slate-400">{i + 1}</span>
                  <span className="flex-1 font-semibold">{p.name}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{p.qty}×</span>
                  <span className="w-24 text-right font-bold">{formatMoney(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kassensturz / Tagesabschluss */}
        <CashUp cashSales={cash} cardSales={card} revenue={revenue} tips={tips} count={paid.length} />
      </div>
    </div>
  );
}

const DENOMS = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

function CashUp({
  cashSales,
  cardSales,
  revenue,
  tips,
  count,
}: {
  cashSales: number;
  cardSales: number;
  revenue: number;
  tips: number;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [floatStr, setFloatStr] = useState('');
  const [counts, setCounts] = useState<Record<number, number>>({});

  const floatCents = parseMoneyLocal(floatStr);
  const counted = DENOMS.reduce((sum, d) => sum + d * (counts[d] ?? 0), 0);
  // Erwarteter Barbestand = Wechselgeld + alle Bareinnahmen (inkl. Bar-Trinkgeld).
  const expected = floatCents + cashSales;
  const diff = counted - expected;
  const anyCount = counted > 0;

  return (
    <div className="card mt-4 p-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold">
          <Wallet size={18} className="text-emerald-600" /> Kassensturz / Tagesabschluss
        </h3>
        <span className="text-sm font-bold text-brand-600">{open ? 'Schließen' : 'Öffnen'}</span>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Sollwerte */}
          <div className="space-y-2">
            <Summary label="Umsatz gesamt" value={formatMoney(revenue)} />
            <Summary label="davon Karte" value={formatMoney(cardSales)} muted />
            <Summary label="davon Bar" value={formatMoney(cashSales)} muted />
            <Summary label="Trinkgeld" value={formatMoney(tips)} muted />
            <Summary label="Bestellungen" value={String(count)} muted />

            <div className="pt-2">
              <label className="mb-1 block text-sm font-semibold text-slate-500">Wechselgeld / Anfangsbestand</label>
              <input
                value={floatStr}
                onChange={(e) => setFloatStr(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="input text-right"
              />
            </div>

            <div className="mt-2 rounded-xl bg-slate-50 p-3">
              <Summary label="Erwarteter Barbestand" value={formatMoney(expected)} />
              {anyCount && (
                <>
                  <Summary label="Gezählt" value={formatMoney(counted)} />
                  <div
                    className={`mt-1 flex justify-between rounded-lg px-3 py-2 text-lg font-extrabold ${
                      diff === 0 ? 'bg-green-100 text-green-700' : diff > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span>{diff === 0 ? 'Stimmt' : diff > 0 ? 'Überschuss' : 'Fehlbetrag'}</span>
                    <span>{diff > 0 ? '+' : ''}{formatMoney(diff)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Geldzähler */}
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Calculator size={16} /> Bargeld zählen
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DENOMS.map((d) => (
                <div key={d} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
                  <span className="w-14 shrink-0 text-sm font-bold text-slate-500">{formatMoney(d)}</span>
                  <span className="text-slate-300">×</span>
                  <input
                    value={counts[d] ?? ''}
                    onChange={(e) =>
                      setCounts((c) => ({ ...c, [d]: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-right outline-none focus:border-brand-400"
                  />
                  <span className="w-16 shrink-0 text-right text-xs text-slate-400">
                    {formatMoney(d * (counts[d] ?? 0))}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setCounts({})} className="mt-3 text-sm font-bold text-slate-400">
              Zählung zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? 'text-slate-500' : 'font-semibold'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Lokale Geld-Eingabe (wie parseMoney, ohne zusätzlichen Import zu erzwingen). */
function parseMoneyLocal(input: string): number {
  const n = Number.parseFloat(input.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${accent}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function PayBar({ icon, label, amount, total, color }: { icon: React.ReactNode; label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">{icon} {label}</span>
        <span>{formatMoney(amount)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function topProducts(orders: Order[]): { name: string; qty: number; revenue: number }[] {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = map.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.unitPrice * item.qty;
      map.set(item.name, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
}

function hourlyRevenue(orders: Order[]): { hour: number; total: number }[] {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0 }));
  for (const o of orders) {
    if (!o.paidAt) continue;
    const h = new Date(o.paidAt).getHours();
    hours[h].total += orderTotal(o);
  }
  // Nur den relevanten Bereich (8–24 Uhr) zeigen
  return hours.slice(8);
}
