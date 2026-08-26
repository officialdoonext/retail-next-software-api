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

    const prodId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const mainBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : generateUniqueBarcode();

    const processedVariations = hasVariations && Array.isArray(variations)
      ? variations.map((v, idx) => ({
          id: v.id || ('var_opt_' + Date.now() + '_' + idx),
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
      sku: sku || ('PRD-' + Math.floor(1000 + Math.random() * 9000)),
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
      image: image || '📦',
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

/**
 * Bulk Import Products from Excel / JSON
 * Automatically creates missing categories & variations and writes products in batches
 */
export const bulkCreateProducts = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for bulk upload' });
    }

    // 1. Fetch existing categories and variations for this business
    const [existingCatsSnap, existingVarsSnap] = await Promise.all([
      db.collection('categories').where('businessId', '==', businessId).get(),
      db.collection('variations').where('businessId', '==', businessId).get()
    ]);

    const existingCategoriesMap = new Map();
    existingCatsSnap.forEach(doc => {
      const data = doc.data();
      existingCategoriesMap.set(data.name.toLowerCase().trim(), doc.id);
    });

    const existingVariationsMap = new Map();
    existingVarsSnap.forEach(doc => {
      const data = doc.data();
      existingVariationsMap.set(data.name.toLowerCase().trim(), { id: doc.id, options: data.options || [] });
    });

    let categoriesCreatedCount = 0;
    let variationsCreatedCount = 0;

    // 2. Identify missing categories and create them
    const uniqueIncomingCats = [...new Set(items.map(i => i.category || i.Category || 'General').filter(Boolean))];
    for (const catName of uniqueIncomingCats) {
      const key = catName.toLowerCase().trim();
      if (!existingCategoriesMap.has(key)) {
        const catId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newCat = {
          id: catId,
          businessId,
          code: 'CAT-' + Math.floor(100 + Math.random() * 900),
          name: catName.trim(),
          slug: catName.toLowerCase().trim().replace(/\s+/g, '-'),
          parentCategory: 'General',
          description: 'Auto-created during bulk product import',
          icon: '📁',
          status: 'Active',
          productCount: 0,
          createdAt: new Date().toISOString()
        };
        await db.collection('categories').doc(catId).set(newCat);
        existingCategoriesMap.set(key, catId);
        categoriesCreatedCount++;
      }
    }

    // 3. Identify missing variation types and create them
    const variationGroups = new Map();
    items.forEach(i => {
      const hasVar = String(i.hasVariations || i['Has Variations (TRUE/FALSE)']).toUpperCase() === 'TRUE';
      const varType = (i.variationType || i['Variation Type'] || '').trim();
      const varOpt = (i.variationOption || i['Variation Option'] || '').trim();
      if (hasVar && varType && varOpt) {
        if (!variationGroups.has(varType)) {
          variationGroups.set(varType, new Set());
        }
        variationGroups.get(varType).add(varOpt);
      }
    });

    for (const [varTypeName, optSet] of variationGroups.entries()) {
      const key = varTypeName.toLowerCase().trim();
      if (!existingVariationsMap.has(key)) {
        const varId = 'var_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newVar = {
          id: varId,
          businessId,
          code: 'VAR-' + Math.floor(10 + Math.random() * 90),
          name: varTypeName,
          type: varTypeName,
          options: Array.from(optSet),
          applicableCategories: uniqueIncomingCats,
          description: 'Auto-created during bulk product import',
          status: 'Active',
          productCount: 0,
          createdAt: new Date().toISOString()
        };
        await db.collection('variations').doc(varId).set(newVar);
        existingVariationsMap.set(key, { id: varId, options: Array.from(optSet) });
        variationsCreatedCount++;
      }
    }

    // 4. Batch write products (up to 400 per batch)
    const BATCH_SIZE = 400;
    let insertedCount = 0;
    const addedDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      chunk.forEach((item, index) => {
        const prodId = 'prod_' + Date.now() + '_' + (i + index) + '_' + Math.random().toString(36).substring(2, 5);
        const prodDocRef = db.collection('products').doc(prodId);

        const name = (item.name || item['Product Name'] || 'Unnamed Product').trim();
        const category = (item.category || item['Category'] || 'General').trim();
        const brand = (item.brand || item['Brand'] || 'General').trim();
        const unit = (item.unit || item['Unit'] || 'Piece').trim();
        const sellingPrice = Number(item.sellingPrice ?? item['Selling Price'] ?? 0);
        const costPrice = Number(item.costPrice ?? item['Cost Price'] ?? 0);
        const stock = Number(item.stock ?? item['Stock'] ?? 0);
        const bufferStock = Number(item.bufferStock ?? item['Buffer Stock'] ?? 5);
        const status = (item.status || item['Status'] || (stock > 0 ? 'Active' : 'Out of Stock')).trim();
        const image = (item.image || item['Image URL'] || '').trim() || '📦';
        
        const rawBarcode = item.barcode || item['Barcode (Leave empty to auto-generate)'];
        const barcode = rawBarcode && String(rawBarcode).trim() ? String(rawBarcode).trim() : generateUniqueBarcode();

        const hasVarRaw = item.hasVariations || item['Has Variations (TRUE/FALSE)'];
        const hasVariations = String(hasVarRaw).toUpperCase() === 'TRUE';
        const varType = (item.variationType || item['Variation Type'] || '').trim();
        const varOpt = (item.variationOption || item['Variation Option'] || '').trim();

        let variations = [];
        if (hasVariations && varOpt) {
          variations = [{
            id: 'var_opt_' + Date.now() + '_' + index,
            name: varType || 'Variant',
            optionValue: varOpt,
            sellingPrice,
            costPrice,
            stock,
            bufferStock,
            barcode: generateUniqueBarcode(),
            status: 'Active'
          }];
        }

        const productDoc = {
          id: prodId,
          businessId,
          name,
          sku: item.sku || ('PRD-' + (1000 + i + index)),
          category,
          brand,
          unit,
          sellingPrice,
          costPrice,
          stock,
          bufferStock,
          status,
          image,
          barcode,
          hasVariations,
          variations,
          addedOn: addedDateStr,
          createdAt: new Date().toISOString()
        };

        batch.set(prodDocRef, productDoc);
        insertedCount++;
      });

      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully imported ' + insertedCount + ' products into Firebase Firestore',
      data: {
        totalImported: insertedCount,
        categoriesCreated: categoriesCreatedCount,
        variationsCreated: variationsCreatedCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Bulk upload failed: ' + error.message });
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
