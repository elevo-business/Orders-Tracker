import { useState } from 'react';
import { Banknote, CreditCard, Check, Minus, Plus, Receipt, SplitSquareHorizontal } from 'lucide-react';
import type { Order, Payment, PaymentMethod } from '@/types';
import { formatMoney, parseMoney } from '@/lib/money';
import { orderRemaining, remainingQty } from '@/lib/order';
import { useStore } from '@/store/useStore';
import { Modal } from './Modal';

type SplitMode = 'komplett' | 'artikel';

export function CheckoutModal({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  /** Wird nach erfolgreicher Zahlung aufgerufen. `fullyPaid` = Bestellung komplett beglichen. */
  onDone: (fullyPaid: boolean) => void;
}) {
  const payOrder = useStore((s) => s.payOrder);

  // Nur Positionen mit offener Menge sind zahlbar.
  const payableItems = order.items.filter((i) => remainingQty(i) > 0);
  const fullRemaining = orderRemaining(order);

  const [mode, setMode] = useState<SplitMode>('komplett');
  // Ausgewählte Menge je Position (für Artikel-Split)
  const [sel, setSel] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>('bar');
  const [tendered, setTendered] = useState('');
  const [tip, setTip] = useState(0);

  const setItemQty = (itemId: string, qty: number, max: number) =>
    setSel((s) => ({ ...s, [itemId]: Math.max(0, Math.min(max, qty)) }));

  const selectAll = () =>
    setSel(Object.fromEntries(payableItems.map((i) => [i.id, remainingQty(i)])));
  const clearSel = () => setSel({});

  // Zu zahlender Warenwert
  const baseAmount =
    mode === 'komplett'
      ? fullRemaining
      : payableItems.reduce((sum, i) => sum + (sel[i.id] ?? 0) * i.unitPrice, 0);

  const grandTotal = baseAmount + tip;
  const tenderedCents = parseMoney(tendered);
  const change = method === 'bar' ? Math.max(0, tenderedCents - grandTotal) : 0;

  // Wird die Bestellung mit dieser Zahlung vollständig beglichen?
  const fullyPaidAfter =
    mode === 'komplett'
      ? true
      : order.items.every((i) => remainingQty(i) - (sel[i.id] ?? 0) <= 0);

  const canConfirm =
    baseAmount > 0 &&
    (method === 'karte' || (method === 'bar' && tenderedCents >= grandTotal));

  const confirm = () => {
    if (!canConfirm) return;
    const payment: Payment = {
      parts: [{ method, amount: grandTotal }],
      tendered: method === 'bar' ? tenderedCents : undefined,
      change,
      tip,
      at: Date.now(),
      amount: baseAmount,
    };
    const selection =
      mode === 'komplett'
        ? undefined
        : payableItems
            .filter((i) => (sel[i.id] ?? 0) > 0)
            .map((i) => ({ itemId: i.id, qty: sel[i.id] }));
    payOrder(order.id, payment, selection);
    onDone(fullyPaidAfter);
  };

  const quickCash = [grandTotal, 1000, 2000, 5000, 10000];
  const tipOptions = [0, 0.05, 0.1, 0.15];
  const alreadyPaid = order.payments.length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Bezahlen · ${order.tableName}`}
      size="md"
      footer={
        <button onClick={confirm} disabled={!canConfirm} className="btn-primary w-full text-lg">
          <Check size={20} /> {fullyPaidAfter ? 'Zahlung abschließen' : 'Teil bezahlen'} · {formatMoney(grandTotal)}
        </button>
      }
    >
      {alreadyPaid && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          <span>Bereits teilbezahlt</span>
          <span>Offen: {formatMoney(fullRemaining)}</span>
        </div>
      )}

      {/* Modus-Auswahl */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ModeButton active={mode === 'komplett'} onClick={() => setMode('komplett')} icon={<Receipt size={18} />} label="Ganze Rechnung" />
        <ModeButton active={mode === 'artikel'} onClick={() => setMode('artikel')} icon={<SplitSquareHorizontal size={18} />} label="Nach Artikeln" />
      </div>

      {/* Artikel-Auswahl */}
      {mode === 'artikel' && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Artikel für diese Zahlung wählen</p>
            <div className="flex gap-2 text-xs font-bold">
              <button onClick={selectAll} className="text-brand-600">Alle</button>
              <button onClick={clearSel} className="text-slate-400">Keine</button>
            </div>
          </div>
          <div className="space-y-2">
            {payableItems.map((item) => {
              const max = remainingQty(item);
              const chosen = sel[item.id] ?? 0;
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      {formatMoney(item.unitPrice)}{max > 1 ? ` · ${max} offen` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setItemQty(item.id, chosen - 1, max)}
                      disabled={chosen <= 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 disabled:opacity-30"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center font-bold">{chosen}</span>
                    <button
                      onClick={() => setItemQty(item.id, chosen + 1, max)}
                      disabled={chosen >= max}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 disabled:opacity-30"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zu zahlender Betrag */}
      <div className="mb-4 flex items-end justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <span className="text-sm opacity-80">{mode === 'komplett' ? 'Zu zahlen' : 'Auswahl'}</span>
        <span className="text-3xl font-extrabold">{formatMoney(grandTotal)}</span>
      </div>

      {/* Trinkgeld */}
      <p className="mb-2 text-sm font-semibold text-slate-500">Trinkgeld</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {tipOptions.map((pct) => {
          const amount = Math.round(baseAmount * pct);
          const active = tip === amount && (pct > 0 || tip === 0);
          return (
            <button
              key={pct}
              onClick={() => setTip(amount)}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pct === 0 ? 'Kein' : `${pct * 100}%`}
            </button>
          );
        })}
      </div>

      {/* Zahlart */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <MethodButton active={method === 'bar'} onClick={() => setMethod('bar')} icon={<Banknote size={20} />} label="Bar" />
        <MethodButton active={method === 'karte'} onClick={() => setMethod('karte')} icon={<CreditCard size={20} />} label="Karte" />
      </div>

      {method === 'bar' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {quickCash.map((c, i) => (
              <button
                key={i}
                onClick={() => setTendered((c / 100).toFixed(2).replace('.', ','))}
                disabled={c <= 0}
                className="rounded-xl bg-slate-100 py-2.5 text-sm font-bold hover:bg-slate-200 disabled:opacity-30"
              >
                {i === 0 ? 'Passend' : formatMoney(c)}
              </button>
            ))}
          </div>
          <input
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
            inputMode="decimal"
            placeholder="Gegeben"
            className="input text-right text-lg font-bold"
          />
          {tenderedCents > 0 && (
            <div className="flex justify-between rounded-xl bg-green-50 px-4 py-3 text-lg font-extrabold text-green-700">
              <span>Rückgeld</span>
              <span>{formatMoney(change)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-slate-500">Betrag am Kartenterminal bestätigen.</p>
      )}
    </Modal>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-bold transition ${
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MethodButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 font-bold transition ${
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
