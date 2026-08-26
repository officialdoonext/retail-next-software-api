import { db } from '../config/firebase.js';

export const requireActiveBusiness = async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || req.query.businessId || req.body.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        code: 'BUSINESS_ID_REQUIRED',
        message: 'Business ID header (x-business-id) is required'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection is not initialized'
      });
    }

    const doc = await db.collection('businesses').doc(businessId).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found in database'
      });
    }

    const business = { id: doc.id, ...doc.data() };

    // Strict validation: Status must be active
    if (business.status !== 'active') {
      return res.status(403).json({
        success: false,
        code: 'INACTIVE_BUSINESS',
        message: 'This business is currently inactive. Please activate the business subscription.',
        business: {
          id: business.id,
          name: business.name,
          status: business.status,
          expiryDate: business.expiryDate
        }
      });
    }

    // Strict validation: Expiry date must exist and not be expired
    if (!business.expiryDate) {
      return res.status(403).json({
        success: false,
        code: 'NO_EXPIRY_DATE',
        message: 'Business subscription has not been assigned an expiry date.',
        business: {
          id: business.id,
          name: business.name,
          status: business.status,
          expiryDate: null
        }
      });
    }

    const now = new Date();
    const expiry = new Date(business.expiryDate);
    if (expiry <= now) {
      return res.status(403).json({
        success: false,
        code: 'EXPIRED_BUSINESS',
        message: `Business subscription expired on ${expiry.toLocaleDateString()}. Please renew to continue.`,
        business: {
          id: business.id,
          name: business.name,
          status: business.status,
          expiryDate: business.expiryDate
        }
      });
    }

    req.business = business;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Business access validation failed',
      error: error.message
    });
  }
};
