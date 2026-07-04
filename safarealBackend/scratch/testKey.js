const dotenv = require('dotenv');
dotenv.config();

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  console.log('Original key length:', privateKey.length);
  // Strip quotes
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  // Replace escaped newlines
  const parsedKey = privateKey.replace(/\\n/g, '\n');
  console.log('Parsed key starts with:', parsedKey.substring(0, 40));
  console.log('Parsed key ends with:', parsedKey.substring(parsedKey.length - 40));
  
  const admin = require('firebase-admin');
  try {
    admin.initializeApp({
      credential: admin.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: parsedKey
      })
    });
    console.log('Success initializing!');
  } catch (err) {
    console.log('Error:', err.message);
  }
} else {
  console.log('No key found in env');
}
