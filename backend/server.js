const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config(); // Load environment variables

console.log("🛠️ Loading Firebase Admin SDK...");

// ✅ Load Firebase Credentials
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// ✅ Initialize Firebase Admin (Prevent Multiple Initializations)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully.");
} else {
    console.log("⚠️ Firebase Admin already initialized.");
}

const db = admin.firestore();

const app = express();
app.use(express.json());

// ✅ Import authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ✅ Test Route: Verify Firebase Initialization
app.get('/test', async (req, res) => {
    try {
        await db.collection('test').doc('ping').set({ message: "Hello, Firebase is working!" });
        res.json({ message: "🔥 Firebase initialized successfully!" });
    } catch (error) {
        console.error("❌ Firebase Init Error:", error);
        res.status(500).json({ error: "Firebase failed to initialize." });
    }
});

module.exports = { db, admin, app };

// ✅ Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

