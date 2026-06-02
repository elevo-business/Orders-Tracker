import type { Order, OrderItem, Settings } from '@/types';

/** Zwischensumme einer einzelnen Position (Einzelpreis × Menge). */
export function itemTotal(item: OrderItem): number {
  return item.unitPrice * item.qty;
}

/** Bereits bezahlte Menge einer Position (robust gegen fehlendes Feld). */
export function paidQty(item: OrderItem): number {
  return Math.min(item.qty, Math.max(0, item.paidQty ?? 0));
}

/** Noch offene (unbezahlte) Menge einer Position. */
export function remainingQty(item: OrderItem): number {
  return Math.max(0, item.qty - paidQty(item));
}

/** Brutto-Gesamtsumme einer Bestellung (alle Artikel). */
export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + itemTotal(item), 0);
}

/** Noch offener (zu zahlender) Betrag in Cent. */
export function orderRemaining(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.unitPrice * remainingQty(item), 0);
}

/** Bereits bezahlter Warenwert in Cent. */
export function orderPaidAmount(order: Order): number {
  return orderTotal(order) - orderRemaining(order);
}

/** Summe aller Trinkgelder der Bestellung. */
export function orderTips(order: Order): number {
  return order.payments.reduce((sum, p) => sum + p.tip, 0);
}

/** Ist die Bestellung vollständig bezahlt? */
export function isFullyPaid(order: Order): boolean {
  return order.items.length > 0 && order.items.every((i) => remainingQty(i) === 0);
}

/** Anzahl Artikel (Summe der Mengen). */
export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

/** Enthaltene Mehrwertsteuer (aus dem Bruttobetrag herausgerechnet). */
export function orderTax(order: Order, settings: Settings): number {
  const gross = orderTotal(order);
  return Math.round(gross - gross / (1 + settings.taxRate));
}

/** Netto-Betrag (Brutto minus enthaltene MwSt). */
export function orderNet(order: Order, settings: Settings): number {
  return orderTotal(order) - orderTax(order, settings);
}

/** Positionen, die noch nicht an die Küche gesendet wurden. */
export function unsentItems(order: Order): OrderItem[] {
  return order.items.filter((i) => i.status === 'neu');
}
