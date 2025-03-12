const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth');

// Get recipe recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    // Get user's swiped recipes
    const swipedRecipes = userData.swipes ? Object.keys(userData.swipes) : [];
    
    // Query recipes not yet swiped, considering user preferences
    const recipesSnapshot = await admin.firestore().collection('recipes')
      .where('id', 'not-in', swipedRecipes)
      .where('tags', 'array-contains-any', userData.preferences?.cuisineTypes || [])
      .limit(10)
      .get();

    const recipes = [];
    recipesSnapshot.forEach(doc => {
      recipes.push({ id: doc.id, ...doc.data() });
    });

    res.json(recipes);
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Record a swipe
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const { recipeId, direction } = req.body;

    if (!recipeId || !direction) {
      return res.status(400).json({
        error: {
          message: 'Recipe ID and swipe direction are required',
          status: 400
        }
      });
    }

    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const batch = admin.firestore().batch();

    // Record the swipe
    batch.update(userRef, {
      [`swipes.${recipeId}`]: direction,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If swiped right, add to saved recipes
    if (direction === 'right') {
      batch.update(userRef, {
        savedRecipes: admin.firestore.FieldValue.arrayUnion(recipeId)
      });
    }

    await batch.commit();
    res.json({ message: 'Swipe recorded successfully' });
  } catch (error) {
    console.error('Swipe record error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Get saved recipes
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    const savedRecipeIds = userData.savedRecipes || [];

    if (savedRecipeIds.length === 0) {
      return res.json([]);
    }

    // Get all saved recipes
    const recipesSnapshot = await admin.firestore().collection('recipes')
      .where('id', 'in', savedRecipeIds)
      .get();

    const recipes = [];
    recipesSnapshot.forEach(doc => {
      recipes.push({ id: doc.id, ...doc.data() });
    });

    res.json(recipes);
  } catch (error) {
    console.error('Saved recipes fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Remove saved recipe
router.delete('/saved/:recipeId', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;

    await admin.firestore().collection('users').doc(req.user.uid).update({
      savedRecipes: admin.firestore.FieldValue.arrayRemove(recipeId)
    });

    res.json({ message: 'Recipe removed from saved successfully' });
  } catch (error) {
    console.error('Remove saved recipe error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

module.exports = router; 