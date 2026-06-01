# Elevo POS – Registrierkasse für Tablets

Eine moderne, touch-optimierte **Registrierkasse (Point of Sale)** für die Gastronomie –
als **Progressive Web App (PWA)**, die auf jedem Tablet (iPad, Android, Windows) im Browser
läuft, installierbar ist und **vollständig offline** funktioniert.

Inspiriert von Lösungen wie OrdersTracker – aber schlanker, schneller und mit
Echtzeit-Synchronisation zwischen Geräten.

## ✨ Funktionen

| Modul | Beschreibung |
| --- | --- |
| 🪑 **Tischplan** | Übersicht aller Tische nach Zonen (Innen, Terrasse, Bar …), Belegung, Laufzeit und Summe auf einen Blick. Plus Mitnahme-Bestellungen. |
| 🛒 **Bestellung** | Touch-optimierte Bestellaufnahme mit Kategorien, Produktraster, Mengensteuerung, **Optionen/Aufpreisen** (z. B. „extra Käse") und Positions-Notizen. |
| 👨‍🍳 **Küchen-Display (KDS)** | Gesendete Bestellungen erscheinen in **Echtzeit** in der Küche. Farbcodierung nach Wartezeit, Positions- und Ticket-Status („fertig"). |
| 💳 **Zahlung** | Bar, Karte und **Split-Zahlung**, Trinkgeld, Schnellbeträge und automatische Rückgeld-Berechnung. |
| 📊 **Berichte** | Tagesumsatz, Ø Bon, Trinkgeld, Zahlarten-Aufteilung, Umsatz nach Stunde und **Top-Produkte**. |
| ⚙️ **Einstellungen** | Betriebsdaten, MwSt-Satz, Daten-Reset. |

## 🚀 Highlights („besser als")

- **Offline-first:** Funktioniert ohne Internet, alle Daten liegen lokal im Gerät (`localStorage`).
- **Echtzeit-Sync zwischen Tabs/Fenstern:** Kasse und Küchen-Display synchronisieren sich live
  über die `BroadcastChannel`-API – ganz ohne Server. Sende eine Bestellung und sie erscheint
  sofort auf dem Küchen-Display.
- **Installierbar:** Als PWA auf dem Home-Bildschirm – startet im Vollbild wie eine native App.
- **Schnell & schlank:** ~70 kB gzip, lädt in Millisekunden.

## 🛠️ Tech-Stack

- **React 18** + **TypeScript**
- **Vite** (Build/Dev) + **vite-plugin-pwa** (Service Worker, Offline)
- **Tailwind CSS** (touch-optimiertes UI)
- **Zustand** (State, persistiert + Cross-Tab-Sync)
- **lucide-react** (Icons)

## ▶️ Loslegen

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal testen
```

### Echtzeit-Sync ausprobieren

1. App im Browser öffnen, einen Tisch wählen und Produkte hinzufügen.
2. **An Küche senden** drücken.
3. In einem **zweiten Tab** `/kitchen` öffnen – die Bestellung erscheint sofort.
4. Position antippen → „fertig". Status aktualisiert sich live in beiden Tabs.

## 📁 Projektstruktur

```
src/
├── components/     # Shell (Navigation), Modal, CheckoutModal
├── pages/          # Floor, Order, Kitchen, Menu, Reports, Settings
├── store/          # Zustand-Store, Demo-Daten, Cross-Tab-Sync
├── lib/            # Geld-/Bestell-Berechnungen, IDs
└── types.ts        # Zentrale Typdefinitionen
```

## 🗺️ Mögliche nächste Schritte

- Geräteübergreifender Sync über einen kleinen Backend-/WebSocket-Server (mehrere Tablets).
- Belegdruck (ESC/POS) und Kassenschublade.
- Artikel-Bilder, Happy-Hour-Preise, Rabatte & Gutscheine.
- Benutzer/Kellner-Login mit PIN und Rechteverwaltung.
- TSE/Fiskalisierung (DSFinV-K) für den deutschen Markt.

---

Demo-Daten (Speisekarte, Tische) sind vorinstalliert – einfach starten und ausprobieren.
