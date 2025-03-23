const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
dotenv.config();

// Load Firebase Service Account Key for Debugging
const serviceAccount = require(path.join(__dirname, 'config/firebase-service-account.json'));

// Debugging: Check if private key is being loaded
console.log("🔥 Firebase Private Key (First 50 characters):", serviceAccount.private_key.slice(0, 50));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Initialize Firestore
const db = admin.firestore();

const express = require("express");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

console.log(listEndpoints(app));

app.get("/", (req, res) => {
    res.send("Savorly Backend is Running!");
});

// Import Routes
const authRoutes = require('./routes/auth');

// Use Routes
app.use('/api/auth', authRoutes);


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
