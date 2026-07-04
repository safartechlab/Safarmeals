const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let isInitialized = false;

// Attempt 1: Check for firebase-service-account.json in backend root
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    isInitialized = true;
    console.log('Firebase Admin SDK initialized successfully using service account JSON file.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin using JSON file:', error.message);
  }
}

// Attempt 2: Fallback to environment variables
if (!isInitialized) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const hasEnvConfig = 
    projectId && projectId !== 'your_firebase_project_id_here' &&
    clientEmail && clientEmail !== 'your_firebase_client_email_here' &&
    privateKey && privateKey !== 'your_firebase_private_key_here';

  if (hasEnvConfig) {
    try {
      // Handle escaped newlines and strip surrounding quotes if present
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      isInitialized = true;
      console.log('Firebase Admin SDK initialized successfully using environment variables.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin using environment variables:', error.message);
    }
  }
}

if (!isInitialized) {
  console.warn(
    'Firebase Admin SDK is NOT initialized. Real-time Firebase logins will not be functional. ' +
    'Please configure FIREBASE_* variables in your backend .env file or place ' +
    'firebase-service-account.json in the backend root.'
  );
}

module.exports = {
  admin,
  isFirebaseReady: () => isInitialized
};
