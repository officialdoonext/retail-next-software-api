// In-memory data store for Retail Next API (easily replaceable with MongoDB / PostgreSQL / MySQL)

export const categories = [
  { id: 'cat-1', name: 'Snacks & Sweets', code: 'SNK', description: 'Traditional and packed sweets & snacks', itemCount: 12 },
  { id: 'cat-2', name: 'Beverages', code: 'BEV', description: 'Cold drinks, juices and dairy drinks', itemCount: 8 },
  { id: 'cat-3', name: 'Groceries', code: 'GRO', description: 'Daily staple items and cooking supplies', itemCount: 25 },
  { id: 'cat-4', name: 'Personal Care', code: 'PC', description: 'Soaps, shampoos and hygiene items', itemCount: 14 }
];

export const products = [
  {
    id: 'prod-1',
    barcode: '8901030383748',
    name: 'Peanut Chikki 200g',
    categoryId: 'cat-1',
    categoryName: 'Snacks & Sweets',
    mrp: 60.00,
    sellingPrice: 55.00,
    costPrice: 42.00,
    stock: 45,
    unit: 'pkt',
    taxRate: 5,
    status: 'ACTIVE'
  },
  {
    id: 'prod-2',
    barcode: '8901030383755',
    name: 'Sesame (Til) Chikki 200g',
    categoryId: 'cat-1',
    categoryName: 'Snacks & Sweets',
    mrp: 70.00,
    sellingPrice: 65.00,
    costPrice: 50.00,
    stock: 28,
    unit: 'pkt',
    taxRate: 5,
    status: 'ACTIVE'
  },
  {
    id: 'prod-3',
    barcode: '8901725181222',
    name: 'Basmati Rice 5kg',
    categoryId: 'cat-3',
    categoryName: 'Groceries',
    mrp: 450.00,
    sellingPrice: 420.00,
    costPrice: 380.00,
    stock: 15,
    unit: 'bag',
    taxRate: 0,
    status: 'ACTIVE'
  },
  {
    id: 'prod-4',
    barcode: '8901233024881',
    name: 'Mango Juice 1L',
    categoryId: 'cat-2',
    categoryName: 'Beverages',
    mrp: 95.00,
    sellingPrice: 90.00,
    costPrice: 75.00,
    stock: 32,
    unit: 'bottle',
    taxRate: 12,
    status: 'ACTIVE'
  }
];

export const customers = [
  {
    id: 'cust-1',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'ramesh@example.com',
    outstandingCredit: 450.00,
    creditLimit: 2000.00,
    totalVisits: 14
  },
  {
    id: 'cust-2',
    name: 'Suresh Reddy',
    phone: '9848022338',
    email: 'suresh.r@example.com',
    outstandingCredit: 0.00,
    creditLimit: 5000.00,
    totalVisits: 8
  }
];

export const orders = [
  {
    id: 'ORD-1001',
    orderNumber: 'INV-2026-001',
    customerId: 'cust-1',
    customerName: 'Ramesh Kumar',
    items: [
      { productId: 'prod-1', name: 'Peanut Chikki 200g', quantity: 2, price: 55.00, total: 110.00 },
      { productId: 'prod-4', name: 'Mango Juice 1L', quantity: 1, price: 90.00, total: 90.00 }
    ],
    subtotal: 200.00,
    tax: 16.30,
    discount: 10.00,
    grandTotal: 206.30,
    paymentMethod: 'CASH', // CASH, UPI, CARD, CREDIT
    paymentStatus: 'PAID',
    createdAt: '2026-08-25T10:15:30.000Z'
  }
];
