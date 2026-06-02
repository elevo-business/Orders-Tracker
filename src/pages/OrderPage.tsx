import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Send, Trash2, CreditCard, StickyNote, ShoppingCart, UtensilsCrossed, Search, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { itemTotal, orderTotal, orderTax, unsentItems, orderItemCount, orderRemaining, orderPaidAmount, paidQty } from '@/lib/order';
import type { ModifierOption, Product, Variant } from '@/types';

/** Anzuzeigender Kartenpreis: bei Varianten der günstigste mit „ab". */
function priceLabel(product: Product): string {
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    const min = Math.min(...variants.map((v) => v.price));
    return `ab ${formatMoney(min)}`;
  }
  return formatMoney(product.price);
}
import { Modal } from '@/components/Modal';
import { CheckoutModal } from '@/components/CheckoutModal';

export function OrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const order = useStore((s) => s.orders.find((o) => o.id === orderId));
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const addItem = useStore((s) => s.addItem);
  const changeQty = useStore((s) => s.changeQty);
  const removeItem = useStore((s) => s.removeItem);
  const setItemNote = useStore((s) => s.setItemNote);
  const sendOrder = useStore((s) => s.sendOrder);

  const sortedCats = useMemo(() => [...categories].sort((a, b) => a.sort - b.sort), [categories]);
  const [activeCat, setActiveCat] = useState(sortedCats[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [optionsProduct, setOptionsProduct] = useState<Product | null>(null);
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Mobile: zwischen Produktauswahl und Warenkorb umschalten
  const [mobileTab, setMobileTab] = useState<'produkte' | 'warenkorb'>('produkte');

  if (!order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-500">
        <p>Bestellung nicht gefunden.</p>
        <button className="btn-primary" onClick={() => navigate('/pos')}>
          Zur Tischübersicht
        </button>
      </div>
    );
  }

  const trimmedQuery = query.trim().toLowerCase();
  const visibleProducts = trimmedQuery
    ? products.filter((p) => p.active && p.name.toLowerCase().includes(trimmedQuery))
    : products.filter((p) => p.categoryId === activeCat && p.active);
  const total = orderTotal(order);
  const remaining = orderRemaining(order);
  const paidAmount = orderPaidAmount(order);
  const tax = orderTax(order, settings);
  const newCount = unsentItems(order).length;
  const itemCount = orderItemCount(order);
  const isPaid = order.status === 'bezahlt';

  const onProductTap = (product: Product) => {
    if (isPaid) return;
    const hasVariants = (product.variants ?? []).length > 0;
    if (hasVariants || product.modifiers.length > 0) setOptionsProduct(product);
    else addItem(order.id, product, []);
  };

  const noteItem = order.items.find((i) => i.id === noteItemId);

  return (
    <div className="flex h-full flex-col">
      {/* Kopfzeile */}
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <button onClick={() => navigate('/pos')} className="btn-ghost px-3 py-3">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold sm:text-xl">{order.tableName}</h1>
          <p className="text-xs text-slate-500">
            Bestellung #{order.number} · {order.status}
          </p>
        </div>
      </header>

      {/* Mobile-Umschalter */}
      <div className="flex gap-2 px-4 pb-2 lg:hidden">
        <button
          onClick={() => setMobileTab('produkte')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            mobileTab === 'produkte' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 shadow-card'
          }`}
        >
          <UtensilsCrossed size={18} /> Produkte
        </button>
        <button
          onClick={() => setMobileTab('warenkorb')}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            mobileTab === 'warenkorb' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 shadow-card'
          }`}
        >
          <ShoppingCart size={18} /> Warenkorb
          {itemCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Produktbereich */}
        <div className={`min-h-0 flex-1 flex-col ${mobileTab === 'produkte' ? 'flex' : 'hidden'} lg:flex`}>
          {/* Suche */}
          <div className="px-4 pb-3 sm:px-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Produkt suchen …"
                className="input pl-10 pr-10"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Kategorien (ausgeblendet während der Suche) */}
          {!trimmedQuery && (
            <div className="scroll-area flex gap-2 px-4 pb-3 sm:px-6">
              {sortedCats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition ${
                    activeCat === cat.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 shadow-card'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Produkte */}
          <div className="scroll-area min-h-0 flex-1 px-4 pb-6 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onProductTap(product)}
                  disabled={isPaid}
                  className="card flex aspect-[4/3] flex-col items-center justify-center gap-1 p-3 text-center active:scale-[0.97] disabled:opacity-50"
                >
                  <span className="text-3xl">{product.emoji ?? '🍽️'}</span>
                  <span className="line-clamp-2 text-sm font-bold leading-tight">{product.name}</span>
                  <span className="text-sm font-semibold text-brand-600">{priceLabel(product)}</span>
                </button>
              ))}
              {visibleProducts.length === 0 && (
                <p className="col-span-full py-12 text-center text-slate-400">
                  {trimmedQuery ? `Keine Treffer für „${query.trim()}".` : 'Keine Produkte in dieser Kategorie.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warenkorb / Rechnung */}
        <aside
          className={`min-h-0 w-full flex-col border-slate-200 bg-white lg:flex lg:w-[380px] lg:border-l ${
            mobileTab === 'warenkorb' ? 'flex' : 'hidden'
          }`}
        >
          <div className="hidden px-5 py-4 lg:block">
            <h2 className="text-lg font-extrabold">Bestellung</h2>
          </div>

          <div className="scroll-area min-h-0 flex-1 px-3 pt-2 lg:pt-0">
            {order.items.length === 0 && (
              <p className="px-2 py-12 text-center text-slate-400">Noch keine Artikel.</p>
            )}
            {order.items.map((item) => (
              <div
                key={item.id}
                className={`mb-2 rounded-xl border p-3 ${
                  item.status === 'neu' ? 'border-brand-200 bg-brand-50' : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{item.name}</p>
                    {item.variantName && (
                      <p className="truncate text-xs font-semibold text-slate-600">{item.variantName}</p>
                    )}
                    {item.modifiers.length > 0 && (
                      <p className="truncate text-xs text-slate-500">{item.modifiers.map((m) => m.name).join(', ')}</p>
                    )}
                    {item.note && <p className="truncate text-xs italic text-amber-600">„{item.note}"</p>}
                    {item.status !== 'neu' && (
                      <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {item.status}
                      </span>
                    )}
                    {paidQty(item) > 0 && (
                      <span className="mt-1 ml-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                        {paidQty(item)}/{item.qty} bezahlt
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-bold">{formatMoney(itemTotal(item))}</span>
                </div>
                {!isPaid && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => changeQty(order.id, item.id, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-card active:scale-95"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.qty}</span>
                    <button
                      onClick={() => changeQty(order.id, item.id, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-card active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => setNoteItemId(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-card active:scale-95"
                      >
                        <StickyNote size={16} />
                      </button>
                      {item.status === 'neu' && paidQty(item) === 0 && (
                        <button
                          onClick={() => removeItem(order.id, item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-red-500 shadow-card active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summen + Aktionen */}
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>inkl. {(settings.taxRate * 100).toFixed(0)}% MwSt</span>
              <span>{formatMoney(tax)}</span>
            </div>
            {paidAmount > 0 && !isPaid && (
              <div className="mb-1 flex justify-between text-sm font-semibold text-green-600">
                <span>Bereits bezahlt</span>
                <span>− {formatMoney(paidAmount)}</span>
              </div>
            )}
            <div className="mb-4 flex justify-between text-2xl font-extrabold">
              <span>{paidAmount > 0 && !isPaid ? 'Offen' : 'Gesamt'}</span>
              <span>{formatMoney(isPaid ? total : remaining)}</span>
            </div>

            {!isPaid ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => sendOrder(order.id)} disabled={newCount === 0} className="btn-ghost">
                  <Send size={18} /> An Küche{newCount > 0 ? ` (${newCount})` : ''}
                </button>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={remaining === 0}
                  className="btn-primary"
                >
                  <CreditCard size={18} /> Bezahlen
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-center font-bold text-green-700">
                ✓ Bezahlt – {formatMoney(total)}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Varianten- & Optionen-Auswahl */}
      {optionsProduct && (
        <ProductOptions
          product={optionsProduct}
          onClose={() => setOptionsProduct(null)}
          onConfirm={(variant, mods) => {
            addItem(order.id, optionsProduct, mods, variant);
            setOptionsProduct(null);
          }}
        />
      )}

      {/* Notiz */}
      <Modal open={!!noteItem} onClose={() => setNoteItemId(null)} title="Notiz hinzufügen" size="sm">
        {noteItem && (
          <NoteEditor
            initial={noteItem.note ?? ''}
            onSave={(note) => {
              setItemNote(order.id, noteItem.id, note);
              setNoteItemId(null);
            }}
          />
        )}
      </Modal>

      {/* Bezahlung */}
      {checkoutOpen && (
        <CheckoutModal
          order={order}
          onClose={() => setCheckoutOpen(false)}
          onDone={(fullyPaid) => {
            setCheckoutOpen(false);
            if (fullyPaid) navigate('/pos');
          }}
        />
      )}
    </div>
  );
}

function ProductOptions({
  product,
  onClose,
  onConfirm,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (variant: Variant | undefined, mods: ModifierOption[]) => void;
}) {
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const variant = variants.find((v) => v.id === variantId);
  const chosen = product.modifiers.filter((m) => selected[m.id]);
  const extra = chosen.reduce((sum, m) => sum + m.price, 0);
  const base = variant?.price ?? product.price;

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      footer={
        <button onClick={() => onConfirm(variant, chosen)} className="btn-primary w-full">
          Hinzufügen · {formatMoney(base + extra)}
        </button>
      }
    >
      {variants.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-slate-500">Variante wählen:</p>
          <div className="space-y-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${
                  variantId === v.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      variantId === v.id ? 'border-brand-500' : 'border-slate-300'
                    }`}
                  >
                    {variantId === v.id && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
                  </span>
                  {v.name}
                </span>
                <span className="text-slate-500">{formatMoney(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {product.modifiers.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">Optionen (Mehrfachauswahl):</p>
          <div className="space-y-2">
            {product.modifiers.map((m) => (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${
                  selected[m.id] ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-slate-500">{m.price > 0 ? `+ ${formatMoney(m.price)}` : 'inkl.'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(initial);
  const quick = ['Ohne Zwiebeln', 'Scharf', 'Glutenfrei', 'Gut durch', 'Zum Schluss'];
  return (
    <div className="space-y-3">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input min-h-24 resize-none"
        placeholder="z. B. ohne Zwiebeln"
      />
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => setValue((v) => (v ? `${v}, ${q}` : q))}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200"
          >
            {q}
          </button>
        ))}
      </div>
      <button onClick={() => onSave(value.trim())} className="btn-primary w-full">
        Speichern
      </button>
    </div>
  );
}
