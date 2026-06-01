import { useState } from 'react';
import { Building2, RotateCcw, Wifi, Percent } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/Modal';

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemoData = useStore((s) => s.resetDemoData);

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="px-8 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-slate-500">Betrieb, Steuer und Daten</p>
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

          <section className="card p-6">
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              <Wifi size={20} className="text-emerald-600" /> Offline & Sync
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Elevo POS läuft vollständig <strong>offline</strong>. Alle Daten liegen lokal im Gerät.
              Mehrere Fenster auf demselben Gerät – etwa Kasse und Küchen-Display – synchronisieren sich
              in <strong>Echtzeit</strong>. Tipp: Öffne <code className="rounded bg-slate-100 px-1">/kitchen</code> in
              einem zweiten Browser-Tab und sende eine Bestellung – sie erscheint sofort.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              <RotateCcw size={20} className="text-amber-600" /> Daten zurücksetzen
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Setzt alle Bestellungen und die Speisekarte auf die Demo-Daten zurück.
            </p>
            <button onClick={() => setConfirmReset(true)} className="btn-danger">
              <RotateCcw size={18} /> Demo-Daten zurücksetzen
            </button>
          </section>

          <p className="pt-2 text-center text-xs text-slate-400">Elevo POS · Version 0.1.0</p>
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
        <p className="text-slate-600">
          Alle erfassten Bestellungen gehen verloren und die Speisekarte wird auf den Auslieferungszustand
          zurückgesetzt.
        </p>
      </Modal>
    </div>
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
