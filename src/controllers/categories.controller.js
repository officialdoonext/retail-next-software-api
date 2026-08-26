import { db } from '../config/firebase.js';

export const getCategories = async (req, res) => {
  try {
    const businessId = req.business.id;
    const snapshot = await db.collection('categories').where('businessId', '==', businessId).get();
    
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    // Also get product count for each category dynamically
    const prodSnapshot = await db.collection('products').where('businessId', '==', businessId).get();
    const countMap = {};
    prodSnapshot.forEach(doc => {
      const p = doc.data();
      if (p.category) {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      }
    });

    const enrichedList = list.map(c => ({
      ...c,
      productCount: countMap[c.name] || countMap[c.slug] || 0
    }));

    return res.status(200).json({
      success: true,
      count: enrichedList.length,
      data: enrichedList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories from database', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { name, code, parentCategory, description, icon = '📁', status = 'Active' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory = {
      id: catId,
      businessId,
      code: code || `CAT-${Math.floor(100 + Math.random() * 900)}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      parentCategory: parentCategory || 'General',
      description: description || '',
      icon,
      status,
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.collection('categories').doc(catId).set(newCategory);

    return res.status(201).json({
      success: true,
      message: 'Category stored in Firebase Firestore successfully',
      data: newCategory
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to store category in database', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('categories').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Category deleted from Firebase successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};
