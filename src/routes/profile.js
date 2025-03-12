const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Decrypt sensitive data
    const decryptedData = {
      ...userData,
      email: decrypt(userData.email),
      name: decrypt(userData.name)
    };

    res.json(decryptedData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { name, preferences, dietaryRestrictions } = req.body;

    const updates = {
      ...(name && { name: encrypt(name) }),
      ...(preferences && { preferences }),
      ...(dietaryRestrictions && { dietaryRestrictions }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('users').doc(req.user.uid).update(updates);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Get user meal history
router.get('/meal-history', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    res.json(userData.mealHistory || []);
  } catch (error) {
    console.error('Meal history fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Add meal to history
router.post('/meal-history', authenticateToken, async (req, res) => {
  try {
    const { mealId, rating, notes } = req.body;

    const mealEntry = {
      mealId,
      rating,
      notes,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('users').doc(req.user.uid).update({
      mealHistory: admin.firestore.FieldValue.arrayUnion(mealEntry)
    });

    res.json({ message: 'Meal added to history successfully' });
  } catch (error) {
    console.error('Add meal history error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

module.exports = router; 