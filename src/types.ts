export type ID = string;

/** Rollen bestimmen, was ein angemeldeter Benutzer sehen und tun darf. */
export type Role = 'admin' | 'kellner' | 'kueche';

/** Eine Zubereitungs-Station bzw. „Küche", z. B. Küche, Bar, Pizza.
 *  Bestellpositionen werden über ihre Kategorie an eine Station geroutet. */
export interface Station {
  id: ID;
  name: string;
  emoji: string;
  color: string;
}

/** Benutzerkonto mit PIN-Anmeldung. */
export interface User {
  id: ID;
  name: string;
  /** 4-stellige PIN für die Schnellanmeldung. */
  pin: string;
  role: Role;
  /** Stationen, die diesem Konto zugeordnet sind (relevant für Rolle „kueche"). */
  stationIds: ID[];
}

/** Eine Speisekarten-Kategorie, z. B. „Vorspeisen", „Getränke". */
export interface Category {
  id: ID;
  name: string;
  color: string;
  emoji: string;
  sort: number;
  /** Station/Küche, die Produkte dieser Kategorie zubereitet. */
  stationId: ID;
}

/** Aufpreis-Option für ein Produkt, z. B. „extra Käse" +0,80 €. */
export interface ModifierOption {
  id: ID;
  name: string;
  /** Aufpreis in Cent. */
  price: number;
}

/** Eine Variante eines Produkts, z. B. Größe „Klein/Mittel/Groß".
 *  Genau eine Variante wird gewählt und legt den Grundpreis fest. */
export interface Variant {
  id: ID;
  name: string;
  /** Absoluter Preis dieser Variante in Cent. */
  price: number;
}

export interface Product {
  id: ID;
  categoryId: ID;
  name: string;
  /** Grundpreis in Cent (gilt, wenn keine Varianten definiert sind). */
  price: number;
  description?: string;
  emoji?: string;
  /** Auswählbare Varianten (z. B. Größen). Leer = keine Auswahl nötig. */
  variants?: Variant[];
  modifiers: ModifierOption[];
  active: boolean;
}

export type ItemStatus = 'neu' | 'zubereitung' | 'fertig' | 'serviert';

/** Eine konkrete Position in einer Bestellung. */
export interface OrderItem {
  id: ID;
  productId: ID;
  name: string;
  /** Station/Küche, an die diese Position geroutet wird (Snapshot beim Erfassen). */
  stationId: ID;
  /** Gewählte Variante (z. B. „Groß"), falls das Produkt Varianten hat. */
  variantName?: string;
  /** Einzelpreis inkl. Variante und gewählter Optionen, in Cent. */
  unitPrice: number;
  qty: number;
  /** Bereits bezahlte Menge (für Teilzahlungen / Splitten nach Artikeln). */
  paidQty?: number;
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
  /** Zeitpunkt der Zahlung. */
  at: number;
  /** Bezahlter Warenwert (ohne Trinkgeld) in Cent. */
  amount: number;
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
  /** Alle (auch Teil-) Zahlungen dieser Bestellung. */
  payments: Payment[];
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
