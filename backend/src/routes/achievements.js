const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

if (!admin.apps.length) {
    admin.initializeApp();
}

router.get('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
	const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.uid; 
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const userAchievementsRef = admin.firestore().collection('achievements').doc(userId);
        const userAchievementsDoc = await userAchievementsRef.get();

        if (!userAchievementsDoc.exists) {
            return res.json({ achievements: {} });
        }

        res.json(userAchievementsDoc.data());
    } catch (error) {
        console.error("Error fetching achievements:", error.message);
        res.status(500).json({ error: error.message });
    }
});

async function checkAndAwardAchievements(userId) {
    console.log("🔍 Checking achievements for user:", userId);

    const userSwipesRef = admin.firestore().collection('user_preferences').doc(userId);
    const userSwipesDoc = await userSwipesRef.get();

    if (!userSwipesDoc.exists) {
        console.log("❌ No swipe data found for user.");
        return;
    }

const { likedMeals = [], dislikedMeals = [] } = userSwipesDoc.data();
    const totalSwipes = likedMeals.length + dislikedMeals.length;
    console.log(`✅ User has made ${totalSwipes} swipes.`);

    const userAchievementsRef = admin.firestore().collection('achievements').doc(userId);
    const userAchievementsDoc = await userAchievementsRef.get();
    let achievements = userAchievementsDoc.exists ? userAchievementsDoc.data() : {};

    if (totalSwipes >= 10 && !achievements['10 Swipes']) {
        console.log("🏆 User unlocked '10 Swipes' achievement!");
        achievements['10 Swipes'] = true;
    }
    if (totalSwipes >= 25 && !achievements['25 Swipes']) {
        console.log("🏆 User unlocked '25 Swipes' achievement!");
        achievements['25 Swipes'] = true;
    }
    if (totalSwipes >= 50 && !achievements['50 Swipes']) {
        console.log("🏆 User unlocked '50 Swipes' achievement!");
        achievements['50 Swipes'] = true;
    }

await userAchievementsRef.set(achievements);
    console.log("✅ Achievements updated successfully.");
}

module.exports = { router, checkAndAwardAchievements };
