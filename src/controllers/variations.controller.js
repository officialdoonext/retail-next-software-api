import { db } from '../config/firebase.js';

export const getVariations = async (req, res) => {
  try {
    const businessId = req.business.id;
    const snapshot = await db.collection('variations').where('businessId', '==', businessId).get();
    
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
    return res.status(500).json({ success: false, message: 'Failed to fetch variations from database', error: error.message });
  }
};

export const createVariation = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { name, code, type = 'Weight', options = [], applicableCategories = [], description = '', status = 'Active' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Variation name is required' });
    }

    const varId = `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVariation = {
      id: varId,
      businessId,
      code: code || `VAR-${Math.floor(10 + Math.random() * 90)}`,
      name,
      type,
      options: Array.isArray(options) ? options : [options],
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [applicableCategories],
      description,
      status,
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.collection('variations').doc(varId).set(newVariation);

    return res.status(201).json({
      success: true,
      message: 'Variation stored in Firebase Firestore successfully',
      data: newVariation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to store variation in database', error: error.message });
  }
};

export const deleteVariation = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('variations').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Variation deleted from Firebase successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete variation', error: error.message });
  }
};
