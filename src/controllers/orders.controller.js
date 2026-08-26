import { orders, products } from '../data/mockData.js';

let orderStore = [...orders];

export const getOrders = (req, res) => {
  const { paymentStatus, paymentMethod, customerId } = req.query;

  let filtered = [...orderStore];

  if (paymentStatus) {
    filtered = filtered.filter(o => o.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
  }

  if (paymentMethod) {
    filtered = filtered.filter(o => o.paymentMethod.toLowerCase() === paymentMethod.toLowerCase());
  }

  if (customerId) {
    filtered = filtered.filter(o => o.customerId === customerId);
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered
  });
};

export const getOrderById = (req, res) => {
  const { id } = req.params;
  const order = orderStore.find(o => o.id === id || o.orderNumber === id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: `Order with ID or Order Number '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
};

export const createOrder = (req, res) => {
  const { customerId, customerName, items, paymentMethod, discount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order items array cannot be empty.'
    });
  }

  const calculatedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    return {
      productId: item.productId || '',
      name: item.name || 'Custom Item',
      quantity: qty,
      price,
      total: qty * price
    };
  });

  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
  const discountAmount = Number(discount) || 0;
  const tax = Number((subtotal * 0.05).toFixed(2)); // Default 5% illustrative GST
  const grandTotal = Number((subtotal + tax - discountAmount).toFixed(2));

  const newOrder = {
    id: `ORD-${Date.now()}`,
    orderNumber: `INV-${new Date().getFullYear()}-${String(orderStore.length + 1).padStart(4, '0')}`,
    customerId: customerId || null,
    customerName: customerName || 'Walk-in Customer',
    items: calculatedItems,
    subtotal,
    tax,
    discount: discountAmount,
    grandTotal,
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
    createdAt: new Date().toISOString()
  };

  orderStore.unshift(newOrder);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: newOrder
  });
};
