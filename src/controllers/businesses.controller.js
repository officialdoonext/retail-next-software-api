import { db } from '../config/firebase.js';

export const getBusinesses = async (req, res) => {
  try {
    const userId = req.user.id;
    const snapshot = await db.collection('businesses').where('ownerId', '==', userId).get();
    
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch businesses', error: error.message });
  }
};

export const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('businesses').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    return res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch business', error: error.message });
  }
};

export const createBusiness = async (req, res) => {
  try {
    const { name, city, address } = req.body;
    const userId = req.user.id;

    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'Business name and city are required' });
    }

    const businessId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    // Stored in Firebase Firestore: Inactive & null expiry date by default
    const newBusiness = {
      id: businessId,
      name,
      city,
      address: address || '',
      ownerId: userId,
      ownerName: req.user.fullName || 'Store Owner',
      status: 'inactive',
      expiryDate: null,
      plan: 'Pending Activation',
      phone: req.user.phone || '',
      email: '',
      category: 'Retail & Supermarket',
      currency: 'INR (₹)',
      isGstEnabled: false,
      gstNumber: '',
      tradeName: '',
      gstRate: 18,
      taxType: 'inclusive',
      createdAt: new Date().toISOString()
    };

    await db.collection('businesses').doc(businessId).set(newBusiness);

    return res.status(201).json({
      success: true,
      message: 'Business created successfully in Firestore (Inactive until manual activation)',
      data: newBusiness
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create business in database', error: error.message });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('businesses').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Filter allowed update fields (prevent tampering with status or expiryDate from standard profile update)
    const {
      name,
      city,
      address,
      phone,
      email,
      category,
      currency,
      logoUrl,
      isGstEnabled,
      gstNumber,
      tradeName,
      gstRate,
      taxType,
      printerConfig
    } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (city !== undefined) updates.city = city;
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (category !== undefined) updates.category = category;
    if (currency !== undefined) updates.currency = currency;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (isGstEnabled !== undefined) updates.isGstEnabled = Boolean(isGstEnabled);
    if (gstNumber !== undefined) updates.gstNumber = gstNumber;
    if (tradeName !== undefined) updates.tradeName = tradeName;
    if (gstRate !== undefined) updates.gstRate = Number(gstRate);
    if (taxType !== undefined) updates.taxType = taxType;
    if (printerConfig !== undefined) updates.printerConfig = printerConfig;

    await docRef.update(updates);

    const updatedDoc = await docRef.get();
    return res.status(200).json({
      success: true,
      message: 'Business details updated successfully in Firebase Firestore',
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update business', error: error.message });
  }
};

export const activateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationDays = 365, plan = 'Retail Next Enterprise POS' } = req.body;

    const expiryDate = new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString();
    const docRef = db.collection('businesses').doc(id);
    
    await docRef.update({
      status: 'active',
      expiryDate,
      plan,
      activatedAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Business not found in database' });
    }

    return res.status(200).json({
      success: true,
      message: 'Business activated successfully in Firebase Firestore',
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to activate business', error: error.message });
  }
};

export const verifyBusinessAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('businesses').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Business not found' });
    }

    const business = { id: doc.id, ...doc.data() };
    const isExpired = !business.expiryDate || new Date(business.expiryDate) <= new Date();
    const isActive = business.status === 'active' && !isExpired;

    return res.status(200).json({
      success: true,
      data: {
        id: business.id,
        name: business.name,
        status: business.status,
        expiryDate: business.expiryDate,
        isActive,
        isExpired
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify business', error: error.message });
  }
};
