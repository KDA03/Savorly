const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/', (req, res) => {
    res.send("🔥 Auth Route Working!");
});

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

const userRecord = await admin.auth().getUserByEmail(email);

        const userToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(200).json({
            message: "User logged in successfully",
            uid: userRecord.uid,
            token: userToken, // 
 });
    } catch (error) {
        res.status(500).json({ error: "Login failed: " + error.message });
    }
});        


module.exports = router;
