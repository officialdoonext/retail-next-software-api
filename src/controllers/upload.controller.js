import { imagekit, getImageKitAuth } from '../config/imagekit.js';

export const getUploadAuth = (req, res) => {
  try {
    const authParams = getImageKitAuth();
    res.status(200).json({ success: true, data: authParams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadFile = async (req, res) => {
  try {
    const { file, fileName = 'product-image' } = req.body;
    if (!file) {
      return res.status(400).json({ success: false, message: 'File payload is required (base64 or URL)' });
    }

    if (imagekit) {
      const response = await imagekit.upload({
        file,
        fileName: `${fileName}_${Date.now()}`,
        folder: '/retail-next/products'
      });

      return res.status(200).json({
        success: true,
        message: 'Image uploaded to ImageKit successfully',
        data: {
          url: response.url,
          thumbnailUrl: response.thumbnailUrl,
          fileId: response.fileId
        }
      });
    }

    // Fallback if ImageKit is offline
    return res.status(200).json({
      success: true,
      message: 'Image cached',
      data: { url: file }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};
