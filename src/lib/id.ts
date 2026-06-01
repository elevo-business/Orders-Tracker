/** Erzeugt eine kurze, eindeutige ID (ohne externe Abhängigkeit). */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}${time}${rand}`;
}
