/** Erzeugt einen kurzen Benachrichtigungston ohne Audiodatei (Web Audio API). */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Muss nach einer Nutzerinteraktion aufgerufen werden, um Autoplay-Sperren aufzuheben. */
export function primeSound(): void {
  getCtx();
}

/** Heller Zwei-Ton-Gong für eingehende Bestellungen. */
export function playChime(): void {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const notes = [880, 1318.5]; // A5 → E6
  notes.forEach((freq, i) => {
    const t = now + i * 0.16;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}
