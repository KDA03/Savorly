const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const verifyToken = require('../middleware/authMiddleware');

// ✅ Test route
router.get('/', (req, res) => {
    res.send("🔥 Auth Route Working!");
});

// ✅ Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name || '',
        });

        const userToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(201).json({
            message: "User registered successfully",
            uid: userRecord.uid,
            token: userToken,
        });
    } catch (error) {
        res.status(500).json({ error: "Registration failed: " + error.message });
    }
});

// ✅ Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userRecord = await admin.auth().getUserByEmail(email);
        const userToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(200).json({
            message: "User logged in successfully",
            uid: userRecord.uid,
            token: userToken,
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed: " + error.message });
    }
});

// ✅ Protected route to get user info
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await admin.auth().getUser(req.user.uid);

        res.status(200).json({
            message: 'Authenticated user data',
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

module.exports = router;
