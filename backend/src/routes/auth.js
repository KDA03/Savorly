const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
dotenv.config();

// Test Route
router.get('/', (req, res) => {
  res.send('Auth Route Working');
});

// Register User
let referrerBonus = false;
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, referralCode } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();
    const userCount = snapshot.size; // Count total users

if (userCount >= 100) {
  return res.status(403).json({ error: "Beta access is full. Stay tuned for public launch!" });
}

const admin = require('firebase-admin');

if (userCount >= 100) {
  return res.status(403).json({ error: "Beta access is full. Stay tuned for public launch!" });
}

let premiumUntil = admin.firestore.Timestamp.fromDate(new Date());
let referrerBonus = false;

if (userCount < 100) {
    premiumUntil = admin.firestore.Timestamp.fromDate(
        new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    );
} else {
    premiumUntil = admin.firestore.Timestamp.fromDate(
        new Date(new Date().setDate(new Date().getDate() + 7))
    );
}

if (referralCode) {
  const referrerRef = usersRef.doc(referralCode);
  const referrerDoc = await referrerRef.get();

  if (referrerDoc.exists) {
    const referrerData = referrerDoc.data();
    const newReferralCount = (referrerData.referrals || 0) + 1;
    
    await referrerRef.update({ referrals: newReferralCount });

    if (newReferralCount >= 3) {
      referrerBonus = true;

      // Extend referrer's premium by 1 extra month as a reward
      let referrerPremiumUntil = new Date(referrerData.premiumUntil.toDate());
      referrerPremiumUntil.setMonth(referrerPremiumUntil.getMonth() + 1);

      await referrerRef.update({ premiumUntil: referrerPremiumUntil });
    }
  }
}

// Store user details in Firestore
const userData = {
  email,
  name,
  createdAt: new Date(),
  premiumUntil,
  referredBy: referralCode || null,
  referrals: 0, // Track how many people they invite
  referrerBonus,
};

await usersRef.doc(userRecord.uid).set(userData);

 res.status(201).json({
   message: 'User registered successfully',
   uid: userRecord.uid,
   premiumUntil,
   referrerBonus
 });

} catch (error) {
  res.status(500).json({ error: error.message });
}
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRecord = await admin.auth().getUserByEmail(email);

    // Verify password (This assumes Firebase Authentication handles password verification)
    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// **VERIFY JWT TOKEN**
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Token is valid', decoded });
  } catch (error) {   
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
