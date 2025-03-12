const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/', (req, res) => {
    res.send("🔥 Auth Route Working!");
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        res.status(201).json({
            message: "User registered successfully",
            uid: userRecord.uid,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
