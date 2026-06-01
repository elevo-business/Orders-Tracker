import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, EyeOff, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney, parseMoney } from '@/lib/money';
import type { ModifierOption, Product } from '@/types';
import { Modal } from '@/components/Modal';
import { uid } from '@/lib/id';

export function MenuPage() {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);

  const sortedCats = useMemo(() => [...categories].sort((a, b) => a.sort - b.sort), [categories]);
  const [activeCat, setActiveCat] = useState(sortedCats[0]?.id ?? '');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  const visible = products.filter((p) => p.categoryId === activeCat);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Speisekarte</h1>
          <p className="text-sm text-slate-500">{products.length} Produkte in {categories.length} Kategorien</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary">
          <Plus size={20} /> Produkt
        </button>
      </header>

      <div className="scroll-area flex gap-2 px-8 pb-3">
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

      <div className="scroll-area flex-1 px-8 pb-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => (
            <div key={product.id} className="card flex items-center gap-3 p-4">
              <span className="text-3xl">{product.emoji ?? '🍽️'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{product.name}</p>
                <p className="text-sm text-slate-500">
                  {formatMoney(product.price)}
                  {product.modifiers.length > 0 && ` · ${product.modifiers.length} Optionen`}
                </p>
              </div>
              <button
                onClick={() => updateProduct(product.id, { active: !product.active })}
                className={`rounded-lg p-2 ${product.active ? 'text-green-600' : 'text-slate-400'}`}
                title={product.active ? 'Aktiv' : 'Versteckt'}
              >
                {product.active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button onClick={() => setEditing(product)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <Pencil size={18} />
              </button>
              <button
                onClick={() => removeProduct(product.id)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full py-12 text-center text-slate-400">Keine Produkte in dieser Kategorie.</p>
          )}
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          defaultCategoryId={activeCat}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  defaultCategoryId,
  onClose,
}: {
  product: Product | null;
  defaultCategoryId: string;
  onClose: () => void;
}) {
  const categories = useStore((s) => s.categories);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);

  const [name, setName] = useState(product?.name ?? '');
  const [emoji, setEmoji] = useState(product?.emoji ?? '🍽️');
  const [price, setPrice] = useState(product ? (product.price / 100).toFixed(2).replace('.', ',') : '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? defaultCategoryId);
  const [description, setDescription] = useState(product?.description ?? '');
  const [modifiers, setModifiers] = useState<ModifierOption[]>(product?.modifiers ?? []);

  const addMod = () => setModifiers((m) => [...m, { id: uid('m-'), name: '', price: 0 }]);
  const setMod = (id: string, patch: Partial<ModifierOption>) =>
    setModifiers((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const delMod = (id: string) => setModifiers((m) => m.filter((x) => x.id !== id));

  const save = () => {
    const data = {
      name: name.trim() || 'Neues Produkt',
      emoji,
      price: parseMoney(price),
      categoryId,
      description: description.trim() || undefined,
      modifiers: modifiers.filter((m) => m.name.trim()),
      active: product?.active ?? true,
    };
    if (product) updateProduct(product.id, data);
    else addProduct(data);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? 'Produkt bearbeiten' : 'Neues Produkt'}
      footer={
        <button onClick={save} className="btn-primary w-full">
          Speichern
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="input w-20 text-center text-2xl" maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)} className="input flex-1" placeholder="Produktname" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-500">Preis (€)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="input" placeholder="0,00" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-500">Kategorie</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-500">Beschreibung (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-500">Optionen / Aufpreise</label>
            <button onClick={addMod} className="text-sm font-bold text-brand-600">
              + Option
            </button>
          </div>
          <div className="space-y-2">
            {modifiers.map((m) => (
              <div key={m.id} className="flex gap-2">
                <input
                  value={m.name}
                  onChange={(e) => setMod(m.id, { name: e.target.value })}
                  className="input flex-1"
                  placeholder="z. B. Extra Käse"
                />
                <input
                  value={m.price ? (m.price / 100).toFixed(2).replace('.', ',') : ''}
                  onChange={(e) => setMod(m.id, { price: parseMoney(e.target.value) })}
                  inputMode="decimal"
                  className="input w-24 text-right"
                  placeholder="0,00"
                />
                <button onClick={() => delMod(m.id)} className="rounded-lg px-3 text-red-500 hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
