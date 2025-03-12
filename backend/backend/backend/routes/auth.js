const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const db = admin.firestore();

router.get('/', (req, res) => {
  res.send('Auth Route Working');
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, referralCode } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    const userCount = snapshot.size;

 if (userCount >= 100) {
      return res.status(403).json({ error: "Beta access is full. Stay tuned for public launch!" });
    }

	 let premiumUntil = admin.firestore.Timestamp.fromDate(new Date());
    if (userCount < 100) {
      premiumUntil = admin.firestore.Timestamp.fromDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
    } else {
      premiumUntil = admin.firestore.Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() + 7)));
    }

let referrerBonus = false;
    if (referralCode) {
      const referrerRef = usersRef.doc(referralCode);
      const referrerDoc = await referrerRef.get();
      
      if (referrerDoc.exists) {
        const referrerData = referrerDoc.data();
        await referrerRef.update({ referrals: (referrerData.referrals || 0) + 1 });

        if ((referrerData.referrals || 0) + 1 >= 3) {
          referrerBonus = true;
        }
      }
    }

const userData = {
      email,
      name,
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      premiumUntil,
      referredBy: referralCode || null,
      referrals: 0,
      referrerBonus,
    };

    await usersRef.doc(userRecord.uid).set(userData);

res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      premiumUntil: premiumUntil.toDate(),
      referrerBonus,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
