import { useState } from 'react';
import { ClipboardList, Delete, LogIn } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSession } from '@/store/useSession';
import { ROLE_BADGE, ROLE_LABELS, allowedStations } from '@/lib/auth';
import { primeSound } from '@/lib/sound';
import type { User } from '@/types';

export function LoginScreen() {
  const users = useStore((s) => s.users);
  const stations = useStore((s) => s.stations);
  const login = useSession((s) => s.login);

  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = (user: User, enteredPin: string) => {
    if (user.pin === enteredPin) {
      primeSound(); // Audio-Freigabe per Nutzergeste
      login(user.id, allowedStations(user, stations).map((s) => s.id));
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 600);
    }
  };

  const press = (digit: string) => {
    if (!selected) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) submit(selected, next);
  };

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto bg-slate-900 p-4 sm:items-center sm:p-6">
      <div className="grid w-full max-w-4xl gap-6 py-6 md:grid-cols-2 md:py-0">
        {/* Konten */}
        <div className="text-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-pop">
              <ClipboardList size={26} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight">Elevo POS</h1>
              <p className="text-sm text-slate-400">Konto wählen & anmelden</p>
            </div>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelected(user);
                  setPin('');
                }}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
                  selected?.id === user.id ? 'border-brand-500 bg-slate-800' : 'border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <span className="font-bold">{user.name}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PIN-Pad */}
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-pop">
          {selected ? (
            <>
              <p className="mb-1 text-sm text-slate-500">PIN für</p>
              <p className="mb-4 text-lg font-extrabold">{selected.name}</p>
              <div className={`mb-6 flex gap-3 ${error ? 'animate-pulse-soft' : ''}`}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-4 w-4 rounded-full transition ${
                      error ? 'bg-red-500' : pin.length > i ? 'bg-brand-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <PadButton key={d} onClick={() => press(d)}>
                    {d}
                  </PadButton>
                ))}
                <PadButton onClick={() => setPin('')}>C</PadButton>
                <PadButton onClick={() => press('0')}>0</PadButton>
                <PadButton onClick={() => setPin((p) => p.slice(0, -1))}>
                  <Delete size={22} />
                </PadButton>
              </div>
              <p className="mt-4 text-xs text-slate-400">Demo-PINs: Admin 1234 · Service 1111 · Küche 2222 · Bar 3333</p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <LogIn size={40} />
              <p className="text-center font-semibold">Bitte links ein Konto auswählen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PadButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-800 transition hover:bg-slate-200 active:scale-95"
    >
      {children}
    </button>
  );
}
