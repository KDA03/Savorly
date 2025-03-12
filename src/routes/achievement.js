const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateToken } = require('../middleware/auth');

// Get user achievements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Get all achievement definitions
    const achievementsSnapshot = await admin.firestore().collection('achievements').get();
    const allAchievements = [];
    achievementsSnapshot.forEach(doc => {
      const achievement = doc.data();
      allAchievements.push({
        id: doc.id,
        ...achievement,
        unlocked: (userData.achievements || []).includes(doc.id),
        unlockedAt: userData.achievementDates?.[doc.id] || null
      });
    });

    res.json(allAchievements);
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Unlock achievement
router.post('/unlock', authenticateToken, async (req, res) => {
  try {
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({
        error: {
          message: 'Achievement ID is required',
          status: 400
        }
      });
    }

    // Check if achievement exists
    const achievementDoc = await admin.firestore().collection('achievements').doc(achievementId).get();
    if (!achievementDoc.exists) {
      return res.status(404).json({
        error: {
          message: 'Achievement not found',
          status: 404
        }
      });
    }

    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Check if already unlocked
    if (userData.achievements?.includes(achievementId)) {
      return res.status(400).json({
        error: {
          message: 'Achievement already unlocked',
          status: 400
        }
      });
    }

    // Unlock achievement
    await userRef.update({
      achievements: admin.firestore.FieldValue.arrayUnion(achievementId),
      [`achievementDates.${achievementId}`]: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Achievement unlocked successfully',
      achievement: {
        id: achievementId,
        ...achievementDoc.data()
      }
    });
  } catch (error) {
    console.error('Achievement unlock error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Get achievement progress
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Calculate progress for different achievement types
    const progress = {
      recipes: {
        saved: userData.savedRecipes?.length || 0,
        cooked: userData.mealHistory?.length || 0
      },
      streaks: {
        current: userData.currentStreak || 0,
        longest: userData.longestStreak || 0
      },
      ratings: userData.ratings?.length || 0,
      preferences: Object.keys(userData.preferences || {}).length
    };

    res.json(progress);
  } catch (error) {
    console.error('Achievement progress fetch error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Check and update achievements
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Get all achievements
    const achievementsSnapshot = await admin.firestore().collection('achievements').get();
    const unlockedAchievements = [];

    // Check each achievement condition
    const batch = admin.firestore().batch();
    achievementsSnapshot.forEach(doc => {
      const achievement = doc.data();
      if (!userData.achievements?.includes(doc.id)) {
        let isUnlocked = false;

        // Check conditions based on achievement type
        switch (achievement.type) {
          case 'recipes_saved':
            isUnlocked = (userData.savedRecipes?.length || 0) >= achievement.requirement;
            break;
          case 'recipes_cooked':
            isUnlocked = (userData.mealHistory?.length || 0) >= achievement.requirement;
            break;
          case 'streak':
            isUnlocked = (userData.longestStreak || 0) >= achievement.requirement;
            break;
          // Add more achievement types as needed
        }

        if (isUnlocked) {
          unlockedAchievements.push({
            id: doc.id,
            ...achievement
          });

          batch.update(userRef, {
            achievements: admin.firestore.FieldValue.arrayUnion(doc.id),
            [`achievementDates.${doc.id}`]: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    });

    if (unlockedAchievements.length > 0) {
      await batch.commit();
    }

    res.json({
      newAchievements: unlockedAchievements
    });
  } catch (error) {
    console.error('Achievement check error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

module.exports = router; 