import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Flame, Volume2, VolumeX, Undo2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSession } from '@/store/useSession';
import { useCurrentUser } from '@/store/useCurrentUser';
import { allowedStations } from '@/lib/auth';
import { playChime, primeSound } from '@/lib/sound';
import type { Order, OrderItem, Station } from '@/types';

/** Tickt jede Sekunde, damit die „seit X Min"-Anzeige live mitläuft. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function elapsed(now: number, ts?: number): { mins: number; label: string } {
  if (!ts) return { mins: 0, label: '0:00' };
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return { mins: m, label: `${m}:${s.toString().padStart(2, '0')}` };
}

export function KitchenPage() {
  const now = useNow();
  const orders = useStore((s) => s.orders);
  const stations = useStore((s) => s.stations);
  const bumpStation = useStore((s) => s.bumpStation);
  const recallStation = useStore((s) => s.recallStation);
  const setItemStatus = useStore((s) => s.setItemStatus);

  const user = useCurrentUser();
  const soundEnabled = useSession((s) => s.soundEnabled);
  const toggleSound = useSession((s) => s.toggleSound);
  const selectedStationIds = useSession((s) => s.selectedStationIds);
  const setSelectedStations = useSession((s) => s.setSelectedStations);

  // Stationen, die dieser Benutzer überhaupt sehen darf
  const myStations = useMemo(() => allowedStations(user, stations), [user, stations]);

  // Effektiv ausgewählte Stationen (auf erlaubte begrenzt; leer = alle erlaubten)
  const activeStationIds = useMemo(() => {
    const allowed = new Set(myStations.map((s) => s.id));
    const chosen = selectedStationIds.filter((id) => allowed.has(id));
    return chosen.length > 0 ? chosen : myStations.map((s) => s.id);
  }, [selectedStationIds, myStations]);

  const toggleStation = (id: string) => {
    const set = new Set(activeStationIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSelectedStations([...set]);
  };

  // Bestellungen mit für diese Stationen offenen Positionen, älteste zuerst
  const tickets = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.status === 'gesendet' &&
            o.items.some(
              (i) =>
                activeStationIds.includes(i.stationId) &&
                (i.status === 'zubereitung' || i.status === 'fertig'),
            ),
        )
        .sort((a, b) => (a.sentAt ?? 0) - (b.sentAt ?? 0)),
    [orders, activeStationIds],
  );

  /* --- Sound bei neuen Bestellungen --------------------------------------- */
  const openItemIds = useMemo(() => {
    const ids: string[] = [];
    for (const o of tickets) {
      for (const i of o.items) {
        if (i.status === 'zubereitung' && activeStationIds.includes(i.stationId)) ids.push(i.id);
      }
    }
    return ids;
  }, [tickets, activeStationIds]);

  const seenRef = useRef<Set<string>>(new Set());
  const selectionRef = useRef<string>('');
  const openItemsKey = openItemIds.join(',');
  const selectionKey = [...activeStationIds].sort().join(',');

  useEffect(() => {
    const current = new Set(openItemIds);
    // Bei Stationswechsel oder Erststart: ohne Ton initialisieren
    if (selectionRef.current !== selectionKey) {
      selectionRef.current = selectionKey;
      seenRef.current = current;
      return;
    }
    let hasNew = false;
    for (const id of current) {
      if (!seenRef.current.has(id)) {
        hasNew = true;
        break;
      }
    }
    seenRef.current = current;
    if (hasNew && soundEnabled) playChime();
    // openItemsKey steuert das Auslösen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemsKey, selectionKey, soundEnabled]);

  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);
  const showStationTags = activeStationIds.length > 1;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <Flame className="text-orange-400" /> Küchen-Display
          </h1>
          <p className="text-sm text-slate-400">Live · {tickets.length} offen</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stationsauswahl */}
          <div className="flex flex-wrap gap-2">
            {myStations.map((st) => {
              const on = activeStationIds.includes(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStation(st.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    on ? 'text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                  style={on ? { backgroundColor: st.color } : undefined}
                >
                  <span>{st.emoji}</span>
                  {st.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              primeSound();
              toggleSound();
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              soundEnabled ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Ton an' : 'Ton aus'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <span className="rounded-xl bg-slate-800 px-3 py-2 font-mono text-sm">
            {new Date(now).toLocaleTimeString('de-DE')}
          </span>
        </div>
      </header>

      <div className="scroll-area flex-1 px-6 pb-6">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
            <Check size={56} />
            <p className="text-lg font-semibold">Alles erledigt – keine offenen Bestellungen</p>
          </div>
        ) : (
          <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tickets.map((order) => (
              <KitchenTicket
                key={order.id}
                order={order}
                now={now}
                stationIds={activeStationIds}
                stationById={stationById}
                showStationTags={showStationTags}
                onItem={setItemStatus}
                onBump={() => bumpStation(order.id, activeStationIds)}
                onRecall={() => recallStation(order.id, activeStationIds)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KitchenTicket({
  order,
  now,
  stationIds,
  stationById,
  showStationTags,
  onItem,
  onBump,
  onRecall,
}: {
  order: Order;
  now: number;
  stationIds: string[];
  stationById: Map<string, Station>;
  showStationTags: boolean;
  onItem: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  onBump: () => void;
  onRecall: () => void;
}) {
  const { mins, label } = elapsed(now, order.sentAt);
  // Farbcodierung nach Wartezeit: <5 Min grau, 5–10 gelb, >10 rot
  const urgency = mins >= 10 ? 'border-red-500' : mins >= 5 ? 'border-amber-400' : 'border-slate-700';
  const timeBadge =
    mins >= 10 ? 'bg-red-500 text-white animate-pulse-soft' : mins >= 5 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700';

  const items = order.items.filter(
    (i) => stationIds.includes(i.stationId) && (i.status === 'zubereitung' || i.status === 'fertig'),
  );
  const allReady = items.length > 0 && items.every((i) => i.status === 'fertig');

  return (
    <div className={`flex flex-col rounded-2xl border-t-4 bg-slate-800 ${urgency}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-lg font-extrabold">{order.tableName}</p>
          <p className="text-xs text-slate-400">#{order.number}</p>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-sm font-bold ${timeBadge}`}>
          <Clock size={14} /> {label}
        </span>
      </div>

      <div className="space-y-1 px-3 pb-3">
        {items.map((item) => {
          const done = item.status === 'fertig';
          const isFresh = item.firedAt ? now - item.firedAt < 8000 : false;
          const st = stationById.get(item.stationId);
          return (
            <button
              key={item.id}
              onClick={() => onItem(order.id, item.id, done ? 'serviert' : 'fertig')}
              className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition active:scale-[0.98] ${
                done
                  ? 'bg-green-500/15 text-green-300'
                  : isFresh
                  ? 'bg-slate-700 ring-2 ring-orange-400/70'
                  : 'bg-slate-700/60 hover:bg-slate-700'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                  done ? 'border-green-400 bg-green-400 text-slate-900' : 'border-slate-500'
                }`}
              >
                {done && <Check size={14} />}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 font-bold">
                  {item.qty}× {item.name}
                  {showStationTags && st && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: st.color, color: '#fff' }}
                    >
                      {st.emoji}
                    </span>
                  )}
                </span>
                {item.modifiers.length > 0 && (
                  <span className="block text-sm text-slate-400">{item.modifiers.map((m) => m.name).join(', ')}</span>
                )}
                {item.note && <span className="block text-sm font-semibold text-amber-300">⚠ {item.note}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 p-3 pt-0">
        <button
          onClick={onBump}
          className={`flex-1 rounded-xl py-3 font-bold transition active:scale-[0.98] ${
            allReady ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {allReady ? '✓ Alle fertig' : 'Alle fertig'}
        </button>
        {items.some((i) => i.status === 'fertig') && (
          <button
            onClick={onRecall}
            className="flex items-center justify-center rounded-xl bg-slate-700 px-4 text-slate-300 hover:bg-slate-600"
            title="Zurückholen"
          >
            <Undo2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
