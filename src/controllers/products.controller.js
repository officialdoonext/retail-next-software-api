import { db } from '../config/firebase.js';
import { generateUniqueBarcode } from '../utils/security.js';

export const getProducts = async (req, res) => {
  try {
    const businessId = req.business.id;
    const snapshot = await db.collection('products').where('businessId', '==', businessId).get();
    
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
    return res.status(500).json({ success: false, message: 'Failed to fetch products from database', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const businessId = req.business.id;
    const {
      name,
      sku,
      category,
      brand,
      unit = 'Kg',
      sellingPrice = 0,
      costPrice = 0,
      stock = 0,
      bufferStock = 5,
      status = 'Active',
      image = '',
      barcode,
      hasVariations = false,
      variations = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const mainBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : generateUniqueBarcode();

    const processedVariations = hasVariations && Array.isArray(variations)
      ? variations.map((v, idx) => ({
          id: v.id || `var_opt_${Date.now()}_${idx}`,
          name: v.name || 'Option',
          optionValue: v.optionValue || '',
          sellingPrice: Number(v.sellingPrice) || Number(sellingPrice),
          costPrice: Number(v.costPrice) || Number(costPrice),
          stock: Number(v.stock) || 0,
          bufferStock: Number(v.bufferStock) || Number(bufferStock),
          barcode: v.barcode && String(v.barcode).trim() ? String(v.barcode).trim() : generateUniqueBarcode(),
          status: v.status || 'Active'
        }))
      : [];

    const newProduct = {
      id: prodId,
      businessId,
      name,
      sku: sku || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category || 'General',
      brand: brand || 'General',
      unit,
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      stock: hasVariations && processedVariations.length > 0
        ? processedVariations.reduce((s, v) => s + v.stock, 0)
        : Number(stock),
      bufferStock: Number(bufferStock),
      status: Number(stock) > 0 || (hasVariations && processedVariations.some(v => v.stock > 0)) ? status : 'Out of Stock',
      image,
      barcode: mainBarcode,
      hasVariations: Boolean(hasVariations),
      variations: processedVariations,
      addedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString()
    };

    await db.collection('products').doc(prodId).set(newProduct);

    return res.status(201).json({
      success: true,
      message: 'Product stored in Firebase Firestore successfully',
      data: newProduct
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create product in database', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('products').doc(id);
    
    await docRef.update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    return res.status(200).json({
      success: true,
      message: 'Product updated in Firebase successfully',
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product in database', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Product deleted from Firebase Firestore successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product from database', error: error.message });
  }
};
