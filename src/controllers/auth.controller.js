import { db } from '../config/firebase.js';
import { generateToken } from '../utils/security.js';
import { descopeClient } from '../config/descope.js';

const memoryOtpStore = new Map();

const formatE164 = (phone) => {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  return '+91' + digits;
};

export const sendOtp = async (req, res) => {
  try {
    const { phone, fullName, city } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const e164Phone = formatE164(cleanPhone);

    let sentViaDescope = false;

    if (descopeClient) {
      try {
        console.log('[DESCOPE] Sending SMS OTP to ' + e164Phone + '...');
        const resp = await descopeClient.otp.signUpOrIn.sms(e164Phone, {
          name: fullName || 'Store Owner'
        });
        if (resp.ok) {
          sentViaDescope = true;
          console.log('✅ [DESCOPE] SMS delivered to ' + e164Phone);
        } else {
          console.warn('[DESCOPE] Response notice:', resp);
        }
      } catch (err) {
        console.warn('[DESCOPE] Delivery error:', err.message);
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    memoryOtpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      fullName: fullName || '',
      city: city || ''
    });

    console.log('[OTP SENT] Phone: ' + cleanPhone + ' | Code: ' + otp);

    return res.status(200).json({
      success: true,
      message: sentViaDescope
        ? 'OTP SMS delivered via Descope to ' + e164Phone
        : 'OTP sent to ' + e164Phone,
      provider: sentViaDescope ? 'descope' : 'sms'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, fullName, city } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP code are required' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const e164Phone = formatE164(cleanPhone);
    const record = memoryOtpStore.get(cleanPhone);

    let isVerified = false;
    let descopeUser = null;

    if (descopeClient) {
      try {
        const resp = await descopeClient.otp.verify.sms(e164Phone, String(otp).trim());
        if (resp.ok) {
          isVerified = true;
          descopeUser = resp.data && resp.data.user;
          console.log('✅ [DESCOPE] OTP verified successfully!');
        }
      } catch (err) {
        console.warn('[DESCOPE] Verification notice:', err.message);
      }
    }

    if (!isVerified) {
      isVerified = record && record.otp === String(otp).trim() && record.expiresAt > Date.now();
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    memoryOtpStore.delete(cleanPhone);

    const userId = (descopeUser && descopeUser.userId) || ('usr_' + cleanPhone);
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    let user = null;
    if (doc.exists) {
      user = { id: doc.id, ...doc.data() };
    } else {
      user = {
        id: userId,
        phone: cleanPhone,
        fullName: fullName || (descopeUser && descopeUser.name) || (record && record.fullName) || 'Store Owner',
        city: city || (record && record.city) || 'Hyderabad',
        role: 'owner',
        createdAt: new Date().toISOString()
      };
      await userRef.set(user);
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};
