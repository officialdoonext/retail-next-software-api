import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { config } from './index.js';

let firebaseApp = null;
let db = null;
let auth = null;

try {
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    const apps = getApps();
    if (!apps.length) {
      let cleanedKey = config.firebase.privateKey;
      if (typeof cleanedKey === 'string') {
        cleanedKey = cleanedKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');
      }

      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: cleanedKey
        })
      });
      console.log('🔥 Firebase Admin SDK initialized successfully!');
    } else {
      firebaseApp = apps[0];
    }

    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  } else {
    console.warn('⚠️ Firebase credentials not fully configured in environment variables.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

export { firebaseApp, db, auth };
export default db;
