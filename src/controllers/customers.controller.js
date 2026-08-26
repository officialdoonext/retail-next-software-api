import { customers } from '../data/mockData.js';

let customerStore = [...customers];

export const getCustomers = (req, res) => {
  const { search } = req.query;

  let filtered = [...customerStore];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered
  });
};

export const getCustomerById = (req, res) => {
  const { id } = req.params;
  const customer = customerStore.find(c => c.id === id || c.phone === id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: `Customer with ID or phone '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    data: customer
  });
};

export const createCustomer = (req, res) => {
  const { name, phone, email, creditLimit } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Customer name and phone number are required.'
    });
  }

  const newCustomer = {
    id: `cust-${Date.now()}`,
    name,
    phone,
    email: email || '',
    outstandingCredit: 0.00,
    creditLimit: Number(creditLimit) || 1000.00,
    totalVisits: 0,
    createdAt: new Date().toISOString()
  };

  customerStore.push(newCustomer);

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: newCustomer
  });
};

export const updateCustomer = (req, res) => {
  const { id } = req.params;
  const index = customerStore.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Customer with ID '${id}' not found`
    });
  }

  const updatedCustomer = {
    ...customerStore[index],
    ...req.body,
    id: customerStore[index].id,
    updatedAt: new Date().toISOString()
  };

  customerStore[index] = updatedCustomer;

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: updatedCustomer
  });
};
