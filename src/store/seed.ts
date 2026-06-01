import type { Category, Product, Table, Settings } from '@/types';

export const seedSettings: Settings = {
  restaurantName: 'Elevo Bistro',
  currency: 'EUR',
  taxRate: 0.19,
  address: 'Musterstraße 1, 10115 Berlin',
};

export const seedCategories: Category[] = [
  { id: 'cat-starter', name: 'Vorspeisen', color: '#f97316', emoji: '🥗', sort: 1 },
  { id: 'cat-main', name: 'Hauptgerichte', color: '#ef4444', emoji: '🍝', sort: 2 },
  { id: 'cat-pizza', name: 'Pizza', color: '#eab308', emoji: '🍕', sort: 3 },
  { id: 'cat-dessert', name: 'Desserts', color: '#ec4899', emoji: '🍰', sort: 4 },
  { id: 'cat-drink', name: 'Getränke', color: '#3b82f6', emoji: '🥤', sort: 5 },
  { id: 'cat-coffee', name: 'Heißgetränke', color: '#92400e', emoji: '☕', sort: 6 },
];

export const seedProducts: Product[] = [
  // Vorspeisen
  { id: 'p-bruschetta', categoryId: 'cat-starter', name: 'Bruschetta', price: 690, emoji: '🍞', active: true, description: 'Geröstetes Brot, Tomaten, Basilikum', modifiers: [] },
  { id: 'p-suppe', categoryId: 'cat-starter', name: 'Tomatensuppe', price: 590, emoji: '🍅', active: true, modifiers: [{ id: 'm-sahne', name: 'Extra Sahne', price: 50 }] },
  { id: 'p-salat', categoryId: 'cat-starter', name: 'Caesar Salat', price: 890, emoji: '🥗', active: true, modifiers: [
    { id: 'm-chicken', name: 'Mit Hähnchen', price: 300 },
    { id: 'm-shrimp', name: 'Mit Garnelen', price: 450 },
  ] },
  // Hauptgerichte
  { id: 'p-pasta', categoryId: 'cat-main', name: 'Spaghetti Bolognese', price: 1290, emoji: '🍝', active: true, modifiers: [{ id: 'm-parm', name: 'Extra Parmesan', price: 80 }] },
  { id: 'p-carbonara', categoryId: 'cat-main', name: 'Carbonara', price: 1350, emoji: '🍝', active: true, modifiers: [] },
  { id: 'p-schnitzel', categoryId: 'cat-main', name: 'Wiener Schnitzel', price: 1690, emoji: '🍖', active: true, modifiers: [
    { id: 'm-pommes', name: 'Mit Pommes', price: 0 },
    { id: 'm-kartoffel', name: 'Mit Kartoffelsalat', price: 0 },
  ] },
  { id: 'p-burger', categoryId: 'cat-main', name: 'Cheeseburger', price: 1450, emoji: '🍔', active: true, modifiers: [
    { id: 'm-bacon', name: 'Extra Bacon', price: 150 },
    { id: 'm-cheese', name: 'Extra Käse', price: 80 },
  ] },
  // Pizza
  { id: 'p-margherita', categoryId: 'cat-pizza', name: 'Margherita', price: 990, emoji: '🍕', active: true, modifiers: [] },
  { id: 'p-salami', categoryId: 'cat-pizza', name: 'Salami', price: 1150, emoji: '🍕', active: true, modifiers: [{ id: 'm-extra-salami', name: 'Extra Salami', price: 200 }] },
  { id: 'p-funghi', categoryId: 'cat-pizza', name: 'Funghi', price: 1190, emoji: '🍕', active: true, modifiers: [] },
  { id: 'p-hawaii', categoryId: 'cat-pizza', name: 'Hawaii', price: 1250, emoji: '🍍', active: true, modifiers: [] },
  // Desserts
  { id: 'p-tiramisu', categoryId: 'cat-dessert', name: 'Tiramisu', price: 690, emoji: '🍰', active: true, modifiers: [] },
  { id: 'p-pannacotta', categoryId: 'cat-dessert', name: 'Panna Cotta', price: 650, emoji: '🍮', active: true, modifiers: [] },
  { id: 'p-eis', categoryId: 'cat-dessert', name: 'Eisbecher', price: 590, emoji: '🍨', active: true, modifiers: [] },
  // Getränke
  { id: 'p-wasser', categoryId: 'cat-drink', name: 'Wasser 0,5l', price: 350, emoji: '💧', active: true, modifiers: [] },
  { id: 'p-cola', categoryId: 'cat-drink', name: 'Cola 0,33l', price: 390, emoji: '🥤', active: true, modifiers: [] },
  { id: 'p-bier', categoryId: 'cat-drink', name: 'Bier 0,5l', price: 490, emoji: '🍺', active: true, modifiers: [] },
  { id: 'p-wein', categoryId: 'cat-drink', name: 'Hauswein 0,2l', price: 590, emoji: '🍷', active: true, modifiers: [
    { id: 'm-rot', name: 'Rotwein', price: 0 },
    { id: 'm-weiss', name: 'Weißwein', price: 0 },
  ] },
  // Heißgetränke
  { id: 'p-espresso', categoryId: 'cat-coffee', name: 'Espresso', price: 290, emoji: '☕', active: true, modifiers: [] },
  { id: 'p-cappuccino', categoryId: 'cat-coffee', name: 'Cappuccino', price: 350, emoji: '☕', active: true, modifiers: [{ id: 'm-hafer', name: 'Hafermilch', price: 50 }] },
  { id: 'p-latte', categoryId: 'cat-coffee', name: 'Latte Macchiato', price: 390, emoji: '☕', active: true, modifiers: [] },
];

export const seedTables: Table[] = [
  { id: 't-1', name: 'Tisch 1', seats: 2, zone: 'Innen' },
  { id: 't-2', name: 'Tisch 2', seats: 2, zone: 'Innen' },
  { id: 't-3', name: 'Tisch 3', seats: 4, zone: 'Innen' },
  { id: 't-4', name: 'Tisch 4', seats: 4, zone: 'Innen' },
  { id: 't-5', name: 'Tisch 5', seats: 6, zone: 'Innen' },
  { id: 't-6', name: 'Tisch 6', seats: 4, zone: 'Innen' },
  { id: 't-7', name: 'Terrasse 1', seats: 2, zone: 'Terrasse' },
  { id: 't-8', name: 'Terrasse 2', seats: 4, zone: 'Terrasse' },
  { id: 't-9', name: 'Terrasse 3', seats: 4, zone: 'Terrasse' },
  { id: 't-10', name: 'Bar 1', seats: 1, zone: 'Bar' },
  { id: 't-11', name: 'Bar 2', seats: 1, zone: 'Bar' },
  { id: 't-12', name: 'Lounge', seats: 8, zone: 'Lounge' },
];
