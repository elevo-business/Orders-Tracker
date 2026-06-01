import { useState } from 'react';
import {
  Building2,
  RotateCcw,
  Wifi,
  Percent,
  Pencil,
  Trash2,
  Users,
  Boxes,
  Route,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/Modal';
import { ROLE_BADGE, ROLE_LABELS } from '@/lib/auth';
import type { Role, Station, User } from '@/types';

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemoData = useStore((s) => s.resetDemoData);

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="px-8 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Verwaltung</h1>
        <p className="text-sm text-slate-500">Betrieb, Stationen, Benutzer und Daten</p>
      </header>

      <div className="scroll-area flex-1 px-8 pb-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <Building2 size={20} className="text-brand-600" /> Betrieb
            </h2>
            <div className="space-y-4">
              <Field label="Name des Betriebs">
                <input
                  value={settings.restaurantName}
                  onChange={(e) => updateSettings({ restaurantName: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Adresse">
                <input
                  value={settings.address}
                  onChange={(e) => updateSettings({ address: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="MwSt-Satz">
                <div className="flex items-center gap-2">
                  <Percent size={18} className="text-slate-400" />
                  <input
                    value={Math.round(settings.taxRate * 100)}
                    onChange={(e) => updateSettings({ taxRate: (Number(e.target.value) || 0) / 100 })}
                    inputMode="numeric"
                    className="input w-28"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </Field>
            </div>
          </section>

          <StationSection />
          <RoutingSection />
          <UserSection />

          <section className="card p-6">
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              <Wifi size={20} className="text-emerald-600" /> Offline & Sync
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Elevo POS läuft vollständig <strong>offline</strong>. Mehrere Fenster auf demselben Gerät –
              etwa Kasse und Küchen-Display – synchronisieren sich in <strong>Echtzeit</strong>. Jedes Gerät
              meldet sich separat an (z. B. ein Tablet als „Küche", eines als „Service").
            </p>
          </section>

          <section className="card p-6">
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              <RotateCcw size={20} className="text-amber-600" /> Daten zurücksetzen
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Setzt Bestellungen, Speisekarte, Stationen und Benutzer auf die Demo-Daten zurück.
            </p>
            <button onClick={() => setConfirmReset(true)} className="btn-danger">
              <RotateCcw size={18} /> Demo-Daten zurücksetzen
            </button>
          </section>

          <p className="pt-2 text-center text-xs text-slate-400">Elevo POS · Version 0.2.0</p>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Wirklich zurücksetzen?"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">
              Abbrechen
            </button>
            <button
              onClick={() => {
                resetDemoData();
                setConfirmReset(false);
              }}
              className="btn-danger flex-1"
            >
              Zurücksetzen
            </button>
          </div>
        }
      >
        <p className="text-slate-600">Alle erfassten Daten gehen verloren und werden auf den Auslieferungszustand gesetzt.</p>
      </Modal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stationen / Küchen                                                          */
/* -------------------------------------------------------------------------- */

function StationSection() {
  const stations = useStore((s) => s.stations);
  const removeStation = useStore((s) => s.removeStation);
  const [editing, setEditing] = useState<Station | 'new' | null>(null);

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Boxes size={20} className="text-rose-600" /> Stationen / Küchen
        </h2>
        <button onClick={() => setEditing('new')} className="text-sm font-bold text-brand-600">
          + Station
        </button>
      </div>
      <div className="space-y-2">
        {stations.map((st) => (
          <div key={st.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: st.color + '22' }}>
              {st.emoji}
            </span>
            <span className="flex-1 font-semibold">{st.name}</span>
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: st.color }} />
            <button onClick={() => setEditing(st)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button
              onClick={() => stations.length > 1 && removeStation(st.id)}
              disabled={stations.length <= 1}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {editing && <StationEditor station={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </section>
  );
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#0ea5e9'];

function StationEditor({ station, onClose }: { station: Station | null; onClose: () => void }) {
  const addStation = useStore((s) => s.addStation);
  const updateStation = useStore((s) => s.updateStation);
  const [name, setName] = useState(station?.name ?? '');
  const [emoji, setEmoji] = useState(station?.emoji ?? '🍽️');
  const [color, setColor] = useState(station?.color ?? COLORS[0]);

  const save = () => {
    const data = { name: name.trim() || 'Station', emoji, color };
    if (station) updateStation(station.id, data);
    else addStation(data);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={station ? 'Station bearbeiten' : 'Neue Station'}
      size="sm"
      footer={
        <button onClick={save} className="btn-primary w-full">
          Speichern
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="input w-20 text-center text-2xl" maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)} className="input flex-1" placeholder="z. B. Grill" autoFocus />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-500">Farbe</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition ${color === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Kategorie → Station Routing                                                 */
/* -------------------------------------------------------------------------- */

function RoutingSection() {
  const categories = useStore((s) => s.categories);
  const stations = useStore((s) => s.stations);
  const updateCategory = useStore((s) => s.updateCategory);
  const sorted = [...categories].sort((a, b) => a.sort - b.sort);

  return (
    <section className="card p-6">
      <h2 className="mb-1 flex items-center gap-2 font-bold">
        <Route size={20} className="text-indigo-600" /> Bestell-Routing
      </h2>
      <p className="mb-4 text-sm text-slate-500">Welche Station bereitet welche Kategorie zu?</p>
      <div className="space-y-2">
        {sorted.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="text-lg">{cat.emoji}</span>
            <span className="flex-1 font-semibold">{cat.name}</span>
            <select
              value={cat.stationId}
              onChange={(e) => updateCategory(cat.id, { stationId: e.target.value })}
              className="input w-44 py-2"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.emoji} {st.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Benutzer                                                                    */
/* -------------------------------------------------------------------------- */

function UserSection() {
  const users = useStore((s) => s.users);
  const removeUser = useStore((s) => s.removeUser);
  const [editing, setEditing] = useState<User | 'new' | null>(null);

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Users size={20} className="text-violet-600" /> Benutzer
        </h2>
        <button onClick={() => setEditing('new')} className="text-sm font-bold text-brand-600">
          + Benutzer
        </button>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <div className="flex-1">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-slate-400">PIN ••••</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE[u.role]}`}>
              {ROLE_LABELS[u.role]}
            </span>
            <button onClick={() => setEditing(u)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button
              onClick={() => users.length > 1 && removeUser(u.id)}
              disabled={users.length <= 1}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {editing && <UserEditor user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </section>
  );
}

function UserEditor({ user, onClose }: { user: User | null; onClose: () => void }) {
  const stations = useStore((s) => s.stations);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name ?? '');
  const [pin, setPin] = useState(user?.pin ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'kellner');
  const [stationIds, setStationIds] = useState<string[]>(user?.stationIds ?? []);

  const toggleStation = (id: string) =>
    setStationIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const save = () => {
    const data = {
      name: name.trim() || 'Benutzer',
      pin: pin.replace(/\D/g, '').slice(0, 4).padEnd(4, '0'),
      role,
      stationIds: role === 'kueche' ? stationIds : [],
    };
    if (user) updateUser(user.id, data);
    else addUser(data);
    onClose();
  };

  const roles: Role[] = ['admin', 'kellner', 'kueche'];

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
      size="sm"
      footer={
        <button onClick={save} className="btn-primary w-full">
          Speichern
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
        </Field>
        <Field label="PIN (4-stellig)">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            className="input w-32 text-center text-lg tracking-widest"
            placeholder="0000"
          />
        </Field>
        <Field label="Rolle">
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </Field>
        {role === 'kueche' && (
          <Field label="Zugeordnete Stationen">
            <div className="flex flex-wrap gap-2">
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => toggleStation(st.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    stationIds.includes(st.id) ? 'text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  style={stationIds.includes(st.id) ? { backgroundColor: st.color } : undefined}
                >
                  <span>{st.emoji}</span>
                  {st.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Dieser Benutzer sieht im Küchen-Display nur Bestellungen der gewählten Stationen.
            </p>
          </Field>
        )}
        {role !== 'kueche' && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {role === 'admin'
              ? 'Administratoren sehen alles inkl. Abrechnungen, Rechnungsverlauf und Verwaltung.'
              : 'Service-Benutzer bedienen Tische und Bestellungen und sehen alle Stationen.'}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
