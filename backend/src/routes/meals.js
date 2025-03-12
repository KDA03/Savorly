const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get all meals
router.get('/', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('meals').get();
    if (snapshot.empty) {
      return res.status(404).json({ error: { message: 'No meals found', status: 404 } });
    }

    let meals = [];
    snapshot.forEach(doc => meals.push({ id: doc.id, ...doc.data() }));
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

