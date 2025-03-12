const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Swipe Meal Route
router.post('/', async (req, res) => {
    try {
        const { mealId, swipeDirection } = req.body;
        
        // Debugging log to see what user is making the request
        console.log("User making the swipe:", req.user);

        // Ensure user is authenticated
        const userId = req.user ? req.user.uid : null;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized - User ID missing" });
        }

        // Ensure required fields are provided
        if (!mealId || !swipeDirection) {
            return res.status(400).json({ error: 'Meal ID and swipe direction are required.' });
        }

        const userPrefRef = admin.firestore().collection('user_preferences').doc(userId);
        const userPrefDoc = await userPrefRef.get();

        let preferences = { likedMeals: [], dislikedMeals: [] };
        if (userPrefDoc.exists) {
            preferences = userPrefDoc.data();
        }

        if (swipeDirection === 'right') {
            if (!preferences.likedMeals.includes(mealId)) {
                preferences.likedMeals.push(mealId);
            }
        } else if (swipeDirection === 'left') {
            if (!preferences.dislikedMeals.includes(mealId)) {
                preferences.dislikedMeals.push(mealId);
            }
        } else {
            return res.status(400).json({ error: 'Invalid swipe direction. Use "right" or "left".' });
        }

        await userPrefRef.set(preferences);

        res.json({ message: '✅ Swipe recorded successfully', preferences });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Recommended Meals
router.get('/recommendations', async (req, res) => {
    try {
        const userId = req.user.uid;
        const userPrefRef = admin.firestore().collection('user_preferences').doc(userId);
        const userPrefDoc = await userPrefRef.get();

        if (!userPrefDoc.exists) {
            return res.json({ recommendations: [] });
        }

        const { likedMeals } = userPrefDoc.data();

        if (likedMeals.length === 0) {
            return res.json({ recommendations: [] });
        }

        // Fetch meals from Firestore
        const mealsRef = admin.firestore().collection('meals');
        const snapshot = await mealsRef.get();
        let allMeals = [];
        snapshot.forEach(doc => allMeals.push({ id: doc.id, ...doc.data() }));

        // Find recommended meals (same category as liked ones)
        const likedCategories = new Set();
        const likedMealDocs = allMeals.filter(meal => likedMeals.includes(meal.id));
        likedMealDocs.forEach(meal => likedCategories.add(meal.category));

        const recommendations = allMeals.filter(meal =>
            likedCategories.has(meal.category) && !likedMeals.includes(meal.id)
        );

        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

