import admin from 'firebase-admin';
import { config } from './index.js';

let firebaseApp = null;
let db = null;
let auth = null;

try {
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey
        })
      });
      console.log('🔥 Firebase Admin SDK initialized successfully!');
    } else {
      firebaseApp = admin.app();
    }

    db = admin.firestore();
    auth = admin.auth();
  } else {
    console.warn('⚠️ Firebase credentials not fully configured in environment variables.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

export { admin, firebaseApp, db, auth };
export default admin;
