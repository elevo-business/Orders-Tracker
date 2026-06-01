import type { Order, OrderItem, Settings } from '@/types';

/** Zwischensumme einer einzelnen Position (Einzelpreis × Menge). */
export function itemTotal(item: OrderItem): number {
  return item.unitPrice * item.qty;
}

/** Brutto-Gesamtsumme einer Bestellung. */
export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + itemTotal(item), 0);
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
