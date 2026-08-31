import { db } from '../config/firebase.js';

export const getVendors = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { search } = req.query;

    const snapshot = await db.collection('vendors')
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
      filtered = filtered.filter(v =>
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.gstin && v.gstin.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch vendors from database', error: error.message });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('vendors').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch vendor', error: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const businessId = req.business.id;
    const {
      name,
      phone,
      city = '',
      address = '',
      email = '',
      gstin = '',
      notes = '',
      status = 'Active'
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Vendor name and phone number are required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const vendorId = req.body.id || ('vend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    const newVendor = {
      id: vendorId,
      businessId,
      name: name.trim(),
      phone: cleanPhone,
      city: city.trim(),
      address: address.trim(),
      email: email ? email.trim() : '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      notes: notes ? notes.trim() : '',
      totalOrders: Number(req.body.totalOrders) || 0,
      totalSpent: Number(req.body.totalSpent) || 0,
      status: status || 'Active',
      createdAt: new Date().toISOString()
    };

    await db.collection('vendors').doc(vendorId).set(newVendor);

    return res.status(201).json({
      success: true,
      message: 'Vendor stored in Firebase Firestore successfully',
      data: newVendor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to store vendor in database', error: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('vendors').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Vendor not found in database' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    if (updateData.phone) {
      updateData.phone = String(updateData.phone).replace(/\D/g, '').slice(-10);
    }

    await ref.update(updateData);
    const updated = await ref.get();

    return res.status(200).json({
      success: true,
      message: 'Vendor updated in Firebase successfully',
      data: { id: updated.id, ...updated.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update vendor', error: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('vendors').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Vendor deleted from Firebase Firestore successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete vendor', error: error.message });
  }
};
