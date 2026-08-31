import { db } from '../config/firebase.js';

export const getExpenses = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { search, category, startDate, endDate } = req.query;

    const snapshot = await db.collection('expenses')
      .where('businessId', '==', businessId)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    list.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());

    let filtered = list;
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.paymentMode && e.paymentMode.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(e => e.category === category);
    }

    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses from database', error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('expenses').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch expense', error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const businessId = req.business.id;
    const {
      name,
      amount,
      date,
      category = 'General',
      paymentMode = 'Cash',
      notes = ''
    } = req.body;

    if (!name || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Expense name and amount are required.' });
    }

    const expenseId = req.body.id || ('exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const todayStr = new Date().toISOString().split('T')[0];

    const newExpense = {
      id: expenseId,
      businessId,
      name: name.trim(),
      amount: Number(amount) || 0,
      date: date || todayStr,
      category: category.trim() || 'General',
      paymentMode: paymentMode || 'Cash',
      notes: notes ? notes.trim() : '',
      createdAt: new Date().toISOString()
    };

    await db.collection('expenses').doc(expenseId).set(newExpense);

    return res.status(201).json({
      success: true,
      message: 'Expense stored in Firebase Firestore successfully',
      data: newExpense
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to store expense in database', error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('expenses').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Expense not found in database' });
    }

    const updateData = {
      ...req.body,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
      updatedAt: new Date().toISOString()
    };

    // Remove undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await ref.update(updateData);
    const updated = await ref.get();

    return res.status(200).json({
      success: true,
      message: 'Expense updated in Firebase successfully',
      data: { id: updated.id, ...updated.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update expense', error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('expenses').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Expense deleted from Firebase Firestore successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete expense', error: error.message });
  }
};
