import { db } from '../config/firebase.js';

const memoryGodownSlots = new Map();

export const getGodownSlots = async (req, res) => {
  try {
    const businessId = req.business.id;
    let list = [];

    try {
      if (db) {
        const snapshot = await db.collection('godown_slots')
          .where('businessId', '==', businessId)
          .get();
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      }
    } catch (dbErr) {
      console.warn('[GODOWN SLOTS DB FALLBACK] Firestore note:', dbErr.message);
    }

    if (list.length === 0 && memoryGodownSlots.has(businessId)) {
      list = memoryGodownSlots.get(businessId);
    }

    list.sort((a, b) => {
      const nameA = a.serialNumber || '';
      const nameB = b.serialNumber || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch godown slots', error: error.message });
  }
};

export const createGodownSlot = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { serialNumber, notes = '' } = req.body;
    if (!serialNumber || !serialNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Serial number is required.' });
    }

    const cleanName = serialNumber.trim().toUpperCase();
    const slotId = 'godown_' + cleanName.replace(/[^A-Z0-9_-]/gi, '_') + '_' + businessId.slice(-4);

    const newSlot = {
      id: slotId,
      businessId,
      serialNumber: cleanName,
      notes: notes.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (db) await db.collection('godown_slots').doc(slotId).set(newSlot);
    } catch (dbErr) {
      console.warn('[CREATE GODOWN DB FALLBACK] Firestore note:', dbErr.message);
    }

    const currentList = memoryGodownSlots.get(businessId) || [];
    memoryGodownSlots.set(businessId, [newSlot, ...currentList.filter(s => s.id !== slotId)]);

    return res.status(201).json({ success: true, message: 'Godown slot created successfully', data: newSlot });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create godown slot', error: error.message });
  }
};

export const bulkCreateGodownSlots = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { prefix = 'S', startNumber = 1, endNumber = 10 } = req.body;
    const start = parseInt(startNumber, 10);
    const end = parseInt(endNumber, 10);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ success: false, message: 'Invalid start and end numbers.' });
    }

    const cleanPrefix = (prefix || 'S').trim().toUpperCase();
    const createdSlots = [];

    for (let i = start; i <= end; i++) {
      const serialNumber = `${cleanPrefix}${i}`;
      const slotId = 'godown_' + serialNumber + '_' + businessId.slice(-4);
      const newSlot = {
        id: slotId,
        businessId,
        serialNumber,
        notes: 'Bulk generated godown serial',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      createdSlots.push(newSlot);
    }

    try {
      if (db) {
        const batch = db.batch();
        createdSlots.forEach(s => batch.set(db.collection('godown_slots').doc(s.id), s, { merge: true }));
        await batch.commit();
      }
    } catch (dbErr) {
      console.warn('[BULK GODOWN DB FALLBACK] Firestore note:', dbErr.message);
    }

    const currentList = memoryGodownSlots.get(businessId) || [];
    const newMap = new Map(currentList.map(s => [s.id, s]));
    createdSlots.forEach(s => newMap.set(s.id, s));
    memoryGodownSlots.set(businessId, Array.from(newMap.values()));

    return res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} godown serials from ${cleanPrefix}${start} to ${cleanPrefix}${end} successfully`,
      data: createdSlots
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to bulk create godown slots', error: error.message });
  }
};

export const updateGodownSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };

    try {
      if (db) await db.collection('godown_slots').doc(id).update(updateData);
    } catch (dbErr) {
      console.warn('[UPDATE GODOWN DB FALLBACK] Firestore note:', dbErr.message);
    }

    for (const [bizId, list] of memoryGodownSlots.entries()) {
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updateData };
        memoryGodownSlots.set(bizId, [...list]);
      }
    }

    return res.status(200).json({ success: true, message: 'Godown slot updated', data: { id, ...updateData } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update godown slot', error: error.message });
  }
};

export const deleteGodownSlot = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      if (db) await db.collection('godown_slots').doc(id).delete();
    } catch {}

    for (const [bizId, list] of memoryGodownSlots.entries()) {
      memoryGodownSlots.set(bizId, list.filter(s => s.id !== id));
    }

    return res.status(200).json({ success: true, message: 'Godown slot deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete godown slot', error: error.message });
  }
};

export const moveGodownItem = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { fromSlotId, toSlotId, itemId, quantity } = req.body;
    const moveQty = parseInt(quantity, 10);

    if (!fromSlotId || !toSlotId || !itemId || isNaN(moveQty) || moveQty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters for item movement.' });
    }

    const currentList = memoryGodownSlots.get(businessId) || [];
    const fromSlot = currentList.find(s => s.id === fromSlotId);
    const toSlot = currentList.find(s => s.id === toSlotId);

    if (fromSlot && toSlot) {
      const fromItems = [...(fromSlot.items || [])];
      const itemIdx = fromItems.findIndex(i => i.id === itemId || i.productId === itemId);
      if (itemIdx >= 0) {
        const item = fromItems[itemIdx];
        const currQty = Number(item.quantity) || 0;
        if (currQty >= moveQty) {
          if (currQty === moveQty) fromItems.splice(itemIdx, 1);
          else fromItems[itemIdx] = { ...item, quantity: currQty - moveQty };

          const toItems = [...(toSlot.items || [])];
          const toIdx = toItems.findIndex(i => (i.productId && i.productId === item.productId) || i.id === item.id);
          if (toIdx >= 0) toItems[toIdx] = { ...toItems[toIdx], quantity: (Number(toItems[toIdx].quantity) || 0) + moveQty };
          else toItems.push({ ...item, quantity: moveQty });

          fromSlot.items = fromItems;
          toSlot.items = toItems;
          memoryGodownSlots.set(businessId, [...currentList]);

          try {
            if (db) {
              const batch = db.batch();
              batch.update(db.collection('godown_slots').doc(fromSlotId), { items: fromItems });
              batch.update(db.collection('godown_slots').doc(toSlotId), { items: toItems });
              await batch.commit();
            }
          } catch {}

          return res.status(200).json({ success: true, message: `Moved ${moveQty} units to ${toSlot.serialNumber} successfully` });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Item movement processed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to move godown item', error: error.message });
  }
};
