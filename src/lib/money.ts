/** Hilfsfunktionen für Geldbeträge. Intern rechnen wir immer in Cent (Ganzzahlen),
 *  um Rundungsfehler zu vermeiden. */

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

/** Formatiert Cent als „€ 12,34". */
export function formatMoney(cents: number): string {
  return formatter.format((cents ?? 0) / 100);
}

/** Wandelt eine Eingabe wie „12,50" oder „12.5" in Cent um. */
export function parseMoney(input: string): number {
  const normalized = input.replace(/[^\d,.-]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}
