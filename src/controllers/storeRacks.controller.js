import { db } from '../config/firebase.js';

const memoryStoreRacks = new Map();

export const getStoreRacks = async (req, res) => {
  try {
    const businessId = req.business.id;
    let list = [];

    try {
      if (db) {
        const snapshot = await db.collection('store_racks')
          .where('businessId', '==', businessId)
          .get();
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      }
    } catch (dbErr) {
      console.warn('[STORE RACKS DB FALLBACK] Firestore note:', dbErr.message);
    }

    if (list.length === 0 && memoryStoreRacks.has(businessId)) {
      list = memoryStoreRacks.get(businessId);
    }

    list.sort((a, b) => {
      const nameA = a.rackName || '';
      const nameB = b.rackName || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch store racks', error: error.message });
  }
};

export const createStoreRack = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { rackName, capacity = 0, notes = '' } = req.body;
    if (!rackName || !rackName.trim()) {
      return res.status(400).json({ success: false, message: 'Rack name is required.' });
    }

    const cleanName = rackName.trim().toUpperCase();
    const rackId = 'rack_' + cleanName.replace(/[^A-Z0-9_-]/gi, '_') + '_' + businessId.slice(-4);

    const newRack = {
      id: rackId,
      businessId,
      rackName: cleanName,
      capacity: Number(capacity) || 0,
      notes: notes.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (db) await db.collection('store_racks').doc(rackId).set(newRack);
    } catch (dbErr) {
      console.warn('[CREATE RACK DB FALLBACK] Firestore note:', dbErr.message);
    }

    const currentList = memoryStoreRacks.get(businessId) || [];
    memoryStoreRacks.set(businessId, [newRack, ...currentList.filter(r => r.id !== rackId)]);

    return res.status(201).json({ success: true, message: 'Rack created successfully', data: newRack });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create rack', error: error.message });
  }
};

export const bulkCreateStoreRacks = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { prefix = 'R', startNumber = 1, endNumber = 10 } = req.body;
    const start = parseInt(startNumber, 10);
    const end = parseInt(endNumber, 10);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ success: false, message: 'Invalid start and end numbers.' });
    }

    const cleanPrefix = (prefix || 'R').trim().toUpperCase();
    const createdRacks = [];

    for (let i = start; i <= end; i++) {
      const rackName = `${cleanPrefix}${i}`;
      const rackId = 'rack_' + rackName + '_' + businessId.slice(-4);
      const newRack = {
        id: rackId,
        businessId,
        rackName,
        capacity: 0,
        notes: 'Bulk generated rack',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      createdRacks.push(newRack);
    }

    try {
      if (db) {
        const batch = db.batch();
        createdRacks.forEach(r => batch.set(db.collection('store_racks').doc(r.id), r, { merge: true }));
        await batch.commit();
      }
    } catch (dbErr) {
      console.warn('[BULK RACKS DB FALLBACK] Firestore note:', dbErr.message);
    }

    const currentList = memoryStoreRacks.get(businessId) || [];
    const newMap = new Map(currentList.map(r => [r.id, r]));
    createdRacks.forEach(r => newMap.set(r.id, r));
    memoryStoreRacks.set(businessId, Array.from(newMap.values()));

    return res.status(201).json({
      success: true,
      message: `Created ${createdRacks.length} racks from ${cleanPrefix}${start} to ${cleanPrefix}${end} successfully`,
      data: createdRacks
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to bulk create racks', error: error.message });
  }
};

export const updateStoreRack = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };

    try {
      if (db) await db.collection('store_racks').doc(id).update(updateData);
    } catch (dbErr) {
      console.warn('[UPDATE RACK DB FALLBACK] Firestore note:', dbErr.message);
    }

    for (const [bizId, list] of memoryStoreRacks.entries()) {
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updateData };
        memoryStoreRacks.set(bizId, [...list]);
      }
    }

    return res.status(200).json({ success: true, message: 'Rack updated', data: { id, ...updateData } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update rack', error: error.message });
  }
};

export const deleteStoreRack = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      if (db) await db.collection('store_racks').doc(id).delete();
    } catch {}

    for (const [bizId, list] of memoryStoreRacks.entries()) {
      memoryStoreRacks.set(bizId, list.filter(r => r.id !== id));
    }

    return res.status(200).json({ success: true, message: 'Rack deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete rack', error: error.message });
  }
};

export const moveRackItem = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { fromRackId, toRackId, itemId, quantity } = req.body;
    const moveQty = parseInt(quantity, 10);

    if (!fromRackId || !toRackId || !itemId || isNaN(moveQty) || moveQty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters for item movement.' });
    }

    const currentList = memoryStoreRacks.get(businessId) || [];
    const fromRack = currentList.find(r => r.id === fromRackId);
    const toRack = currentList.find(r => r.id === toRackId);

    if (fromRack && toRack) {
      const fromItems = [...(fromRack.items || [])];
      const itemIdx = fromItems.findIndex(i => i.id === itemId || i.productId === itemId);
      if (itemIdx >= 0) {
        const item = fromItems[itemIdx];
        const currQty = Number(item.quantity) || 0;
        if (currQty >= moveQty) {
          if (currQty === moveQty) fromItems.splice(itemIdx, 1);
          else fromItems[itemIdx] = { ...item, quantity: currQty - moveQty };

          const toItems = [...(toRack.items || [])];
          const toIdx = toItems.findIndex(i => (i.productId && i.productId === item.productId) || i.id === item.id);
          if (toIdx >= 0) toItems[toIdx] = { ...toItems[toIdx], quantity: (Number(toItems[toIdx].quantity) || 0) + moveQty };
          else toItems.push({ ...item, quantity: moveQty });

          fromRack.items = fromItems;
          toRack.items = toItems;
          memoryStoreRacks.set(businessId, [...currentList]);

          try {
            if (db) {
              const batch = db.batch();
              batch.update(db.collection('store_racks').doc(fromRackId), { items: fromItems });
              batch.update(db.collection('store_racks').doc(toRackId), { items: toItems });
              await batch.commit();
            }
          } catch {}

          return res.status(200).json({ success: true, message: `Moved ${moveQty} units to ${toRack.rackName} successfully` });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Item movement processed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to move rack item', error: error.message });
  }
};
