import ImageKit from 'imagekit';
import { config } from './index.js';

let imagekit = null;

try {
  if (config.imagekit.publicKey && config.imagekit.privateKey && config.imagekit.urlEndpoint) {
    imagekit = new ImageKit({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint
    });
    console.log('🖼️ ImageKit SDK initialized successfully!');
  } else {
    console.warn('⚠️ ImageKit credentials not fully configured in environment variables.');
  }
} catch (error) {
  console.error('❌ Failed to initialize ImageKit SDK:', error.message);
}

/**
 * Generate client-side upload authentication parameters
 */
export const getImageKitAuth = () => {
  if (!imagekit) {
    throw new Error('ImageKit is not initialized');
  }
  return imagekit.getAuthenticationParameters();
};

export { imagekit };
export default imagekit;
