const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'uyir-kavalan.appspot.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Initialize Firestore
const db = getFirestore();

// Initialize Storage
const storage = getStorage();
const bucket = storage.bucket();

// Initialize Auth
const auth = admin.auth();

module.exports = {
  admin,
  db,
  storage,
  bucket,
  auth
}; 