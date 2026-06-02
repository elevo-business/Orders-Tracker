import { useMemo, useState } from 'react';
import { TrendingUp, Receipt, ShoppingBag, Package, Banknote, Trophy, ArrowDownWideNarrow, CalendarDays } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { orderTotal, orderItemCount, orderTips } from '@/lib/order';

type Range = 'heute' | '7' | '30' | 'alle';

const RANGE_LABEL: Record<Range, string> = { heute: 'Heute', '7': '7 Tage', '30': '30 Tage', alle: 'Gesamt' };

function startOfRange(range: Range): number {
  if (range === 'alle') return 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === '7') d.setDate(d.getDate() - 6);
  if (range === '30') d.setDate(d.getDate() - 29);
  return d.getTime();
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function StatsPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const stations = useStore((s) => s.stations);
  const [range, setRange] = useState<Range>('7');

  const from = startOfRange(range);
  const paid = useMemo(
    () => orders.filter((o) => o.status === 'bezahlt' && o.paidAt && o.paidAt >= from),
    [orders, from],
  );

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  const stats = useMemo(() => {
    const revenue = paid.reduce((s, o) => s + orderTotal(o), 0);
    const tips = paid.reduce((s, o) => s + orderTips(o), 0);
    const itemsSold = paid.reduce((s, o) => s + orderItemCount(o), 0);
    const avg = paid.length ? Math.round(revenue / paid.length) : 0;

    const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
    const byCategory = new Map<string, { name: string; emoji: string; revenue: number }>();
    const byStation = new Map<string, { name: string; emoji: string; revenue: number }>();
    const byWeekday = Array.from({ length: 7 }, () => 0);
    const byHour = Array.from({ length: 24 }, () => 0);
    let cash = 0;
    let card = 0;
    let tische = 0;
    let mitnahme = 0;
    let tischeRev = 0;
    let mitnahmeRev = 0;

    for (const o of paid) {
      const oTotal = orderTotal(o);
      if (o.type === 'mitnahme') {
        mitnahme++;
        mitnahmeRev += oTotal;
      } else {
        tische++;
        tischeRev += oTotal;
      }
      if (o.paidAt) {
        const d = new Date(o.paidAt);
        byWeekday[(d.getDay() + 6) % 7] += oTotal; // Mo=0
        byHour[d.getHours()] += oTotal;
      }
      for (const p of o.payments) {
        for (const part of p.parts) {
          if (part.method === 'bar') cash += part.amount;
          else card += part.amount;
        }
      }
      for (const item of o.items) {
        const rev = item.unitPrice * item.qty;
        const prod = productById.get(item.productId);
        const pe = byProduct.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
        pe.qty += item.qty;
        pe.revenue += rev;
        byProduct.set(item.name, pe);

        const cat = prod ? categoryById.get(prod.categoryId) : undefined;
        const cKey = cat?.id ?? 'andere';
        const ce = byCategory.get(cKey) ?? { name: cat?.name ?? 'Sonstiges', emoji: cat?.emoji ?? '🍽️', revenue: 0 };
        ce.revenue += rev;
        byCategory.set(cKey, ce);

        const st = stationById.get(item.stationId);
        const sKey = item.stationId || 'andere';
        const se = byStation.get(sKey) ?? { name: st?.name ?? 'Sonstige', emoji: st?.emoji ?? '🍳', revenue: 0 };
        se.revenue += rev;
        byStation.set(sKey, se);
      }
    }

    const productList = [...byProduct.values()];
    const topProducts = [...productList].sort((a, b) => b.qty - a.qty);
    const soldNames = new Set(productList.map((p) => p.name));
    const neverSold = products.filter((p) => !soldNames.has(p.name)).map((p) => p.name);

    return {
      revenue, tips, itemsSold, avg, cash, card,
      tische, mitnahme, tischeRev, mitnahmeRev,
      topProducts,
      weakProducts: [...productList].sort((a, b) => a.qty - b.qty).slice(0, 6),
      neverSold,
      byCategory: [...byCategory.values()].sort((a, b) => b.revenue - a.revenue),
      byStation: [...byStation.values()].sort((a, b) => b.revenue - a.revenue),
      byWeekday,
      byHour,
    };
  }, [paid, products, productById, categoryById, stationById]);

  const hours = stats.byHour
    .map((total, hour) => ({ hour, total }))
    .filter((h) => h.hour >= 7 && h.hour <= 23);
  const maxHour = Math.max(1, ...hours.map((h) => h.total));
  const maxWeekday = Math.max(1, ...stats.byWeekday);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Statistik</h1>
          <p className="text-sm text-slate-500">Was läuft gut – und was nicht</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-card">
          {(['heute', '7', '30', 'alle'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                range === r ? 'bg-slate-900 text-white' : 'text-slate-500'
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </header>

      <div className="scroll-area flex-1 px-6 pb-8 sm:px-8">
        {paid.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <TrendingUp size={48} />
            <p className="font-semibold">Keine Verkäufe im Zeitraum „{RANGE_LABEL[range]}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={<TrendingUp />} label="Umsatz" value={formatMoney(stats.revenue)} accent="bg-brand-600" />
              <Kpi icon={<Receipt />} label="Bestellungen" value={String(paid.length)} accent="bg-slate-800" />
              <Kpi icon={<ShoppingBag />} label="Ø Bon" value={formatMoney(stats.avg)} accent="bg-violet-600" />
              <Kpi icon={<Package />} label="Artikel verkauft" value={String(stats.itemsSold)} accent="bg-emerald-600" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Renner */}
              <Card title="Renner – meistverkauft" icon={<Trophy size={18} className="text-amber-500" />}>
                <BarList
                  rows={stats.topProducts.slice(0, 8).map((p) => ({
                    label: p.name,
                    sub: `${p.qty}×`,
                    value: p.revenue,
                  }))}
                  max={Math.max(1, ...stats.topProducts.map((p) => p.revenue))}
                  color="bg-emerald-500"
                />
              </Card>

              {/* Penner */}
              <Card title="Penner – schwacher Absatz" icon={<ArrowDownWideNarrow size={18} className="text-slate-400" />}>
                <BarList
                  rows={stats.weakProducts.map((p) => ({ label: p.name, sub: `${p.qty}×`, value: p.revenue }))}
                  max={Math.max(1, ...stats.weakProducts.map((p) => p.revenue))}
                  color="bg-slate-400"
                />
                {stats.neverSold.length > 0 && (
                  <p className="mt-3 text-xs text-slate-400">
                    <span className="font-bold">Nie verkauft:</span> {stats.neverSold.slice(0, 12).join(', ')}
                    {stats.neverSold.length > 12 ? ` +${stats.neverSold.length - 12}` : ''}
                  </p>
                )}
              </Card>

              {/* Kategorien */}
              <Card title="Umsatz nach Kategorie" icon={<Package size={18} className="text-brand-500" />}>
                <BarList
                  rows={stats.byCategory.map((c) => ({ label: `${c.emoji} ${c.name}`, value: c.revenue }))}
                  max={Math.max(1, ...stats.byCategory.map((c) => c.revenue))}
                  color="bg-brand-500"
                />
              </Card>

              {/* Stationen */}
              <Card title="Umsatz nach Station" icon={<Package size={18} className="text-rose-500" />}>
                <BarList
                  rows={stats.byStation.map((c) => ({ label: `${c.emoji} ${c.name}`, value: c.revenue }))}
                  max={Math.max(1, ...stats.byStation.map((c) => c.revenue))}
                  color="bg-rose-500"
                />
              </Card>
            </div>

            {/* Zahlarten & Bestelltyp */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card title="Zahlarten" icon={<Banknote size={18} className="text-emerald-600" />}>
                <BarList
                  rows={[
                    { label: 'Bar', value: stats.cash },
                    { label: 'Karte', value: stats.card },
                  ]}
                  max={Math.max(1, stats.cash, stats.card)}
                  color="bg-emerald-500"
                />
                <Line label="Trinkgeld gesamt" value={formatMoney(stats.tips)} />
              </Card>

              <Card title="Bestelltyp" icon={<ShoppingBag size={18} className="text-violet-600" />}>
                <Line label={`🪑 Tisch (${stats.tische})`} value={formatMoney(stats.tischeRev)} />
                <Line label={`🛍️ Mitnahme (${stats.mitnahme})`} value={formatMoney(stats.mitnahmeRev)} />
              </Card>

              {/* Wochentag */}
              <Card title="Umsatz nach Wochentag" icon={<CalendarDays size={18} className="text-indigo-600" />}>
                <div className="flex h-28 items-end gap-1.5">
                  {stats.byWeekday.map((total, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-indigo-500"
                        style={{ height: `${(total / maxWeekday) * 100}%`, minHeight: total > 0 ? '4px' : '0' }}
                        title={formatMoney(total)}
                      />
                      <span className="text-[10px] text-slate-400">{WEEKDAYS[i]}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Stunden */}
            <Card title="Umsatz nach Stunde" icon={<TrendingUp size={18} className="text-brand-500" />}>
              <div className="flex h-32 items-end gap-1">
                {hours.map((h) => (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-brand-500"
                      style={{ height: `${(h.total / maxHour) * 100}%`, minHeight: h.total > 0 ? '4px' : '0' }}
                      title={formatMoney(h.total)}
                    />
                    <span className="text-[9px] text-slate-400">{h.hour}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-bold">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function BarList({
  rows,
  max,
  color,
}: {
  rows: { label: string; sub?: string; value: number }[];
  max: number;
  color: string;
}) {
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-slate-400">Keine Daten.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold">{r.label}</span>
              {r.sub && <span className="shrink-0 rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-500">{r.sub}</span>}
            </span>
            <span className="shrink-0 font-bold">{formatMoney(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-slate-100 py-2 text-sm first:border-t-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
