import { db } from '../config/firebase.js';

export const getSales = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = db.collection('sales').where('businessId', '==', businessId);

    const snapshot = await query.get();
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    // Sort descending by createdAt
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Optional date filter in memory
    let filtered = list;
    if (startDate) {
      filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => new Date(s.createdAt) <= end);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered.slice(0, Number(limit))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales', error: error.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const businessId = req.business.id;
    const {
      invoiceNo,
      customer = { name: 'Walk-in Customer', phone: '', email: '' },
      items = [],
      subtotal = 0,
      discount = 0,
      discountType = 'flat',
      taxableAmount = 0,
      tax = 0,
      cgst = 0,
      sgst = 0,
      roundOff = 0,
      grandTotal = 0,
      paidAmount = 0,
      changeAmount = 0,
      paymentMethod = 'cash',
      splitPayments = null,
      notes = '',
      status = 'settled',
      isDraft = false
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    const saleId = (isDraft ? 'draft_' : 'sale_') + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const finalInvoiceNo = invoiceNo || ('INV-' + Math.floor(10000 + Math.random() * 90000));

    const saleDoc = {
      id: saleId,
      businessId,
      invoiceNo: finalInvoiceNo,
      customer,
      items,
      itemCount: items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0),
      subtotal: Number(subtotal),
      discount: Number(discount),
      discountType,
      taxableAmount: Number(taxableAmount),
      tax: Number(tax),
      cgst: Number(cgst),
      sgst: Number(sgst),
      roundOff: Number(roundOff),
      grandTotal: Number(grandTotal),
      paidAmount: Number(paidAmount),
      changeAmount: Number(changeAmount),
      paymentMethod,
      splitPayments,
      notes,
      status: isDraft ? 'draft' : (status || 'settled'),
      date: dateFormatted,
      time: timeFormatted,
      createdAt: new Date().toISOString()
    };

    const collectionName = isDraft ? 'draft_invoices' : 'sales';
    await db.collection(collectionName).doc(saleId).set(saleDoc);

    // If settled sale, decrease stock in Firestore products AND decrease rack item counts
    if (!isDraft) {
      const batch = db.batch();
      for (const item of items) {
        if (item.id && !item.id.startsWith('custom_')) {
          const prodRef = db.collection('products').doc(item.id);
          const prodDoc = await prodRef.get();
          if (prodDoc.exists) {
            const currentStock = Number(prodDoc.data().stock) || 0;
            const newStock = Math.max(0, currentStock - (Number(item.qty) || 1));
            batch.update(prodRef, {
              stock: newStock,
              status: newStock > 0 ? 'Active' : 'Out of Stock'
            });
          }

          // Decrement from store rack holding this item
          try {
            const rackSnaps = await db.collection('store_racks')
              .where('businessId', '==', businessId)
              .get();

            let remainingToDeduct = Number(item.qty) || 1;
            rackSnaps.forEach(rDoc => {
              if (remainingToDeduct <= 0) return;
              const rData = rDoc.data();
              const rItems = [...(rData.items || [])];
              let modified = false;

              for (let i = 0; i < rItems.length; i++) {
                if (rItems[i].productId === item.id || rItems[i].id === item.id) {
                  const currQty = Number(rItems[i].quantity) || 0;
                  if (currQty > 0) {
                    const deduct = Math.min(currQty, remainingToDeduct);
                    rItems[i].quantity = currQty - deduct;
                    remainingToDeduct -= deduct;
                    modified = true;
                  }
                }
              }

              if (modified) {
                // Filter out 0 qty items or keep updated count
                const cleanedItems = rItems.filter(it => it.quantity > 0);
                batch.update(rDoc.ref, { items: cleanedItems, updatedAt: new Date().toISOString() });
              }
            });
          } catch (rErr) {
            console.warn('Rack stock sync warning:', rErr.message);
          }
        }
      }
      await batch.commit().catch(err => console.warn('Stock update notice:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: isDraft ? 'Invoice saved as draft successfully' : 'Sale invoice generated and settled successfully',
      data: saleDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record sale', error: error.message });
  }
};

export const getDrafts = async (req, res) => {
  try {
    const businessId = req.business.id;
    const snapshot = await db.collection('draft_invoices').where('businessId', '==', businessId).get();
    const list = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch draft invoices', error: error.message });
  }
};

export const deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('draft_invoices').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Draft invoice removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete draft', error: error.message });
  }
};
