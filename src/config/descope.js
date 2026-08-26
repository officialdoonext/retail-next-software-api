import DescopeClient from '@descope/node-sdk';
import { config } from './index.js';

let descopeClient = null;

try {
  if (config.descope.projectId && config.descope.projectId.trim() !== '') {
    descopeClient = DescopeClient({
      projectId: config.descope.projectId.trim(),
      managementKey: config.descope.managementKey ? config.descope.managementKey.trim() : undefined
    });
    console.log('🛡️ Descope SDK initialized with Project ID:', config.descope.projectId);
  } else {
    console.log('ℹ️ DESCOPE_PROJECT_ID is not configured in .env. Running in developer secure OTP mode.');
  }
} catch (error) {
  console.warn('⚠️ Descope initialization notice:', error.message);
}

export { descopeClient };
export default descopeClient;
