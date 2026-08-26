import { getImageKitAuth, imagekit } from '../config/imagekit.js';

/**
 * Get authentication parameters for ImageKit client-side uploads
 */
export const getUploadAuth = (req, res) => {
  try {
    const authParams = getImageKitAuth();
    res.status(200).json({
      success: true,
      data: authParams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate ImageKit authentication parameters',
      error: error.message
    });
  }
};
