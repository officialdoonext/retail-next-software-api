import { db } from '../config/firebase.js';

export const getCustomers = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { search } = req.query;

    const snapshot = await db.collection('customers')
      .where('businessId', '==', businessId)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    let filtered = list;
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('customers').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { name, phone, city = '', email = '' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Mobile Number are required.' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Check if customer already exists for this business
    const existingSnap = await db.collection('customers')
      .where('businessId', '==', businessId)
      .where('phone', '==', cleanPhone)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      return res.status(200).json({
        success: true,
        message: 'Customer already exists',
        data: { id: existingDoc.id, ...existingDoc.data() }
      });
    }

    const customerId = 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newDoc = {
      id: customerId,
      businessId,
      name: name.trim(),
      phone: cleanPhone,
      city: city.trim(),
      email: email.trim(),
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };

    await db.collection('customers').doc(customerId).set(newDoc);

    return res.status(201).json({
      success: true,
      message: 'Customer saved successfully in Firestore',
      data: newDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save customer', error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, city, email } = req.body;

    const ref = db.collection('customers').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.replace(/\D/g, '').slice(-10) }),
      ...(city !== undefined && { city: city.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      updatedAt: new Date().toISOString()
    };

    await ref.update(updateData);
    const updated = await ref.get();

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { id: updated.id, ...updated.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
  }
};
