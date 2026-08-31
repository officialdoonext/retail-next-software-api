import { db } from '../config/firebase.js';

export const getPurchases = async (req, res) => {
  try {
    const businessId = req.business.id;
    const snapshot = await db.collection('purchases')
      .where('businessId', '==', businessId)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch purchase orders', error: error.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const businessId = req.business.id;
    const purchaseData = req.body;
    const poId = purchaseData.id || ('po_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    const newPO = {
      ...purchaseData,
      id: poId,
      businessId,
      createdAt: purchaseData.createdAt || new Date().toISOString()
    };

    await db.collection('purchases').doc(poId).set(newPO);

    return res.status(201).json({
      success: true,
      message: 'Purchase order saved in Firebase successfully',
      data: newPO
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save purchase order', error: error.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('purchases').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    await ref.update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });

    const updated = await ref.get();
    return res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: { id: updated.id, ...updated.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update purchase order', error: error.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('purchases').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete purchase order', error: error.message });
  }
};
