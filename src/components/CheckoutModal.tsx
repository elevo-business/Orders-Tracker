import { useState } from 'react';
import { Banknote, CreditCard, Split, Check } from 'lucide-react';
import type { Order, Payment, PaymentMethod } from '@/types';
import { formatMoney, parseMoney } from '@/lib/money';
import { orderTotal } from '@/lib/order';
import { useStore } from '@/store/useStore';
import { Modal } from './Modal';

export function CheckoutModal({
  order,
  onClose,
  onPaid,
}: {
  order: Order;
  onClose: () => void;
  onPaid: () => void;
}) {
  const payOrder = useStore((s) => s.payOrder);
  const total = orderTotal(order);

  const [mode, setMode] = useState<PaymentMethod | 'split'>('bar');
  const [tendered, setTendered] = useState('');
  const [cardPart, setCardPart] = useState('');
  const [tip, setTip] = useState(0);

  const grandTotal = total + tip;
  const tenderedCents = parseMoney(tendered);
  const cardCents = parseMoney(cardPart);

  const change = mode === 'bar' ? Math.max(0, tenderedCents - grandTotal) : 0;
  const cashNeeded = mode === 'split' ? Math.max(0, grandTotal - cardCents) : 0;

  const quickCash = [grandTotal, 1000, 2000, 5000, 10000];

  const canConfirm =
    mode === 'karte' ||
    (mode === 'bar' && tenderedCents >= grandTotal) ||
    (mode === 'split' && cardCents > 0 && cardCents < grandTotal);

  const confirm = () => {
    let payment: Payment;
    if (mode === 'karte') {
      payment = { parts: [{ method: 'karte', amount: grandTotal }], change: 0, tip };
    } else if (mode === 'bar') {
      payment = {
        parts: [{ method: 'bar', amount: grandTotal }],
        tendered: tenderedCents,
        change,
        tip,
      };
    } else {
      payment = {
        parts: [
          { method: 'karte', amount: cardCents },
          { method: 'bar', amount: cashNeeded },
        ],
        change: 0,
        tip,
      };
    }
    payOrder(order.id, payment);
    onPaid();
  };

  const tipOptions = [0, 0.05, 0.1, 0.15];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Bezahlen · ${order.tableName}`}
      size="md"
      footer={
        <button onClick={confirm} disabled={!canConfirm} className="btn-primary w-full text-lg">
          <Check size={20} /> Zahlung abschließen · {formatMoney(grandTotal)}
        </button>
      }
    >
      <div className="mb-4 flex items-end justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <span className="text-sm opacity-80">Zu zahlen</span>
        <span className="text-3xl font-extrabold">{formatMoney(grandTotal)}</span>
      </div>

      {/* Trinkgeld */}
      <p className="mb-2 text-sm font-semibold text-slate-500">Trinkgeld</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {tipOptions.map((pct) => {
          const amount = Math.round(total * pct);
          const active = tip === amount;
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
      <div className="mb-4 grid grid-cols-3 gap-2">
        <MethodButton active={mode === 'bar'} onClick={() => setMode('bar')} icon={<Banknote size={20} />} label="Bar" />
        <MethodButton active={mode === 'karte'} onClick={() => setMode('karte')} icon={<CreditCard size={20} />} label="Karte" />
        <MethodButton active={mode === 'split'} onClick={() => setMode('split')} icon={<Split size={20} />} label="Split" />
      </div>

      {mode === 'bar' && (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {quickCash.map((c, i) => (
              <button
                key={i}
                onClick={() => setTendered((c / 100).toFixed(2).replace('.', ','))}
                className="rounded-xl bg-slate-100 py-2.5 text-sm font-bold hover:bg-slate-200"
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
      )}

      {mode === 'karte' && (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-slate-500">
          Betrag am Kartenterminal bestätigen.
        </p>
      )}

      {mode === 'split' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-500">Betrag auf Karte</label>
          <input
            value={cardPart}
            onChange={(e) => setCardPart(e.target.value)}
            inputMode="decimal"
            placeholder="Karten-Anteil"
            className="input text-right text-lg font-bold"
          />
          <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 font-bold">
            <span>Rest in bar</span>
            <span>{formatMoney(cashNeeded)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
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
