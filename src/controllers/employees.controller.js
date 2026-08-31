import { db } from '../config/firebase.js';

export const getEmployees = async (req, res) => {
  try {
    const businessId = req.business.id;
    const { search, wageType, status } = req.query;

    const snapshot = await db.collection('employees')
      .where('businessId', '==', businessId)
      .get();

    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    let filtered = list;
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.phone && e.phone.includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.address && e.address.toLowerCase().includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q))
      );
    }

    if (wageType && wageType !== 'all') {
      filtered = filtered.filter(e => e.wageType === wageType);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(e => e.status === status);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employees from database', error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('employees').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employee', error: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const businessId = req.business.id;
    const {
      name,
      phone,
      email = '',
      city,
      address,
      wageType = 'Monthly',
      salary = 0,
      role = 'Staff',
      status = 'Active',
      joiningDate
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Employee name and phone number are required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    
    // Generate unique 7-digit numeric ID (1000000 to 9999999)
    let empId = req.body.id;
    if (!empId || !/^\d{7}$/.test(String(empId))) {
      let isUnique = false;
      while (!isUnique) {
        const rand7 = Math.floor(1000000 + Math.random() * 9000000).toString();
        const existingDoc = await db.collection('employees').doc(rand7).get();
        if (!existingDoc.exists) {
          empId = rand7;
          isUnique = true;
        }
      }
    } else {
      empId = String(empId);
    }

    const newEmployee = {
      id: empId,
      businessId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      city: city ? city.trim() : '',
      address: address ? address.trim() : '',
      wageType: wageType === 'Daily' ? 'Daily' : 'Monthly',
      salary: Number(salary) || 0,
      role: role ? role.trim() : 'Staff',
      status: status || 'Active',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    await db.collection('employees').doc(empId).set(newEmployee);

    return res.status(201).json({
      success: true,
      message: 'Employee saved to Firebase Firestore successfully',
      data: newEmployee
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create employee in database', error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('employees').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Employee not found in database' });
    }

    const updateData = {
      ...req.body,
      salary: req.body.salary !== undefined ? Number(req.body.salary) : undefined,
      updatedAt: new Date().toISOString()
    };

    if (updateData.phone) {
      updateData.phone = String(updateData.phone).replace(/\D/g, '').slice(-10);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await ref.update(updateData);
    const updated = await ref.get();

    return res.status(200).json({
      success: true,
      message: 'Employee details updated successfully in Firebase',
      data: { id: updated.id, ...updated.data() }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update employee details', error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('employees').doc(id).delete();
    return res.status(200).json({ success: true, message: 'Employee removed from Firebase Firestore successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete employee', error: error.message });
  }
};
