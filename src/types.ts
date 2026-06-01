export type ID = string;

/** Eine Speisekarten-Kategorie, z. B. „Vorspeisen", „Getränke". */
export interface Category {
  id: ID;
  name: string;
  color: string;
  emoji: string;
  sort: number;
}

/** Aufpreis-Option für ein Produkt, z. B. „extra Käse" +0,80 €. */
export interface ModifierOption {
  id: ID;
  name: string;
  /** Aufpreis in Cent. */
  price: number;
}

export interface Product {
  id: ID;
  categoryId: ID;
  name: string;
  /** Grundpreis in Cent. */
  price: number;
  description?: string;
  emoji?: string;
  modifiers: ModifierOption[];
  active: boolean;
}

export type ItemStatus = 'neu' | 'zubereitung' | 'fertig' | 'serviert';

/** Eine konkrete Position in einer Bestellung. */
export interface OrderItem {
  id: ID;
  productId: ID;
  name: string;
  /** Einzelpreis inkl. gewählter Optionen, in Cent. */
  unitPrice: number;
  qty: number;
  modifiers: { name: string; price: number }[];
  note?: string;
  status: ItemStatus;
  /** Zeitpunkt, an dem die Position an die Küche ging. */
  firedAt?: number;
}

export type OrderType = 'tisch' | 'mitnahme';
export type OrderStatus = 'offen' | 'gesendet' | 'bezahlt' | 'storniert';

export type PaymentMethod = 'bar' | 'karte';

export interface PaymentPart {
  method: PaymentMethod;
  /** Betrag in Cent. */
  amount: number;
}

export interface Payment {
  parts: PaymentPart[];
  /** Gegebener Betrag (bar) in Cent. */
  tendered?: number;
  /** Rückgeld in Cent. */
  change: number;
  /** Trinkgeld in Cent. */
  tip: number;
}

export interface Order {
  id: ID;
  number: number;
  type: OrderType;
  tableId?: ID;
  tableName?: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: number;
  sentAt?: number;
  paidAt?: number;
  payment?: Payment;
}

export interface Table {
  id: ID;
  name: string;
  seats: number;
  zone: string;
}

export interface Settings {
  restaurantName: string;
  currency: string;
  taxRate: number; // z. B. 0.19
  address: string;
}
