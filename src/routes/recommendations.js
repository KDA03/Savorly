const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

// OpenAI configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const openaiConfig = {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

// Helper function to analyze user preferences from swipe history
const analyzeUserPreferences = async (swipeHistory, mealHistory) => {
  try {
    const prompt = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist and meal recommendation expert. Analyze the user's meal preferences based on their swipe history and meal history."
        },
        {
          role: "user",
          content: `
            Analyze these meal preferences:
            Liked Meals (Swiped Right): ${JSON.stringify(swipeHistory.right || [])}
            Disliked Meals (Swiped Left): ${JSON.stringify(swipeHistory.left || [])}
            Recently Eaten: ${JSON.stringify(mealHistory.slice(-5))}
            
            Return a JSON object with:
            1. Preferred cuisines
            2. Avoided ingredients
            3. Dietary patterns
            4. Meal complexity preferences
            5. Portion size preferences
            6. Nutritional focus areas
          `
        }
      ]
    };

    const response = await axios.post(OPENAI_API_URL, prompt, openaiConfig);
    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Preference analysis error:', error);
    return null;
  }
};

// Get personalized meal recommendations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Get user's swipe history and meal history
    const swipeHistory = {
      right: [],
      left: []
    };

    // Organize swipes by direction
    Object.entries(userData.swipes || {}).forEach(([mealId, direction]) => {
      if (direction === 'right') swipeHistory.right.push(mealId);
      if (direction === 'left') swipeHistory.left.push(mealId);
    });

    // Get user preferences through AI analysis
    const preferences = await analyzeUserPreferences(swipeHistory, userData.mealHistory || []);

    // Query recipes based on AI-generated preferences
    let recipesQuery = admin.firestore().collection('recipes')
      .where('active', '==', true)
      .limit(10);

    // Exclude previously swiped meals
    const allSwipedMeals = [...swipeHistory.right, ...swipeHistory.left];
    if (allSwipedMeals.length > 0) {
      recipesQuery = recipesQuery.where('id', 'not-in', allSwipedMeals);
    }

    // Apply preference-based filters if available
    if (preferences) {
      if (preferences.preferredCuisines?.length > 0) {
        recipesQuery = recipesQuery.where('cuisine', 'in', preferences.preferredCuisines);
      }

      if (preferences.nutritionalFocus) {
        recipesQuery = recipesQuery.where('nutritionalTags', 'array-contains-any', preferences.nutritionalFocus);
      }
    }

    const recipesSnapshot = await recipesQuery.get();
    const recipes = [];

    // Get recipe details and calculate match scores
    for (const doc of recipesSnapshot.docs) {
      const recipe = { id: doc.id, ...doc.data() };
      
      // Calculate match score based on preferences
      let matchScore = 0;
      if (preferences) {
        if (preferences.preferredCuisines?.includes(recipe.cuisine)) matchScore += 2;
        if (preferences.nutritionalFocus?.some(tag => recipe.nutritionalTags?.includes(tag))) matchScore += 2;
        if (recipe.complexity === preferences.preferredComplexity) matchScore += 1;
        if (recipe.portionSize === preferences.preferredPortionSize) matchScore += 1;
        
        // Decrease score for avoided ingredients
        if (preferences.avoidedIngredients?.some(ingredient => 
          recipe.ingredients?.some(ri => ri.toLowerCase().includes(ingredient.toLowerCase()))
        )) {
          matchScore -= 3;
        }
      }

      recipes.push({
        ...recipe,
        matchScore
      });
    }

    // Sort by match score and randomize similar scores
    recipes.sort((a, b) => {
      if (Math.abs(b.matchScore - a.matchScore) <= 1) {
        return Math.random() - 0.5;
      }
      return b.matchScore - a.matchScore;
    });

    res.json({
      recommendations: recipes,
      preferences: preferences || null
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Record a swipe
router.post('/swipe', authenticateToken, async (req, res) => {
  try {
    const { recipeId, direction } = req.body;

    if (!recipeId || !['left', 'right'].includes(direction)) {
      return res.status(400).json({
        error: {
          message: 'Valid recipe ID and swipe direction (left/right) are required',
          status: 400
        }
      });
    }

    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const batch = admin.firestore().batch();

    // Record swipe
    batch.update(userRef, {
      [`swipes.${recipeId}`]: direction,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If swiped right, add to saved recipes
    if (direction === 'right') {
      batch.update(userRef, {
        savedRecipes: admin.firestore.FieldValue.arrayUnion(recipeId)
      });

      // Update recipe popularity
      const recipeRef = admin.firestore().collection('recipes').doc(recipeId);
      batch.update(recipeRef, {
        likes: admin.firestore.FieldValue.increment(1),
        popularity: admin.firestore.FieldValue.increment(1)
      });
    }

    await batch.commit();

    // Get next recommendations immediately
    const nextRecommendations = await getNextRecommendations(req.user.uid);

    res.json({
      message: 'Swipe recorded successfully',
      nextRecommendations
    });
  } catch (error) {
    console.error('Swipe recording error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Helper function to get next recommendations
async function getNextRecommendations(userId, limit = 5) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  const swipedMeals = Object.keys(userData.swipes || {});

  const recipesSnapshot = await admin.firestore()
    .collection('recipes')
    .where('active', '==', true)
    .where('id', 'not-in', swipedMeals)
    .orderBy('popularity', 'desc')
    .limit(limit)
    .get();

  return recipesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get recipe details
router.get('/recipe/:id', authenticateToken, async (req, res) => {
  try {
    const recipeDoc = await admin.firestore()
      .collection('recipes')
      .doc(req.params.id)
      .get();

    if (!recipeDoc.exists) {
      return res.status(404).json({
        error: {
          message: 'Recipe not found',
          status: 404
        }
      });
    }

    const recipe = {
      id: recipeDoc.id,
      ...recipeDoc.data()
    };

    // Get similar recipes
    const similarRecipes = await admin.firestore()
      .collection('recipes')
      .where('cuisine', '==', recipe.cuisine)
      .where('id', '!=', recipe.id)
      .orderBy('popularity', 'desc')
      .limit(3)
      .get();

    res.json({
      recipe,
      similarRecipes: similarRecipes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    });
  } catch (error) {
    console.error('Recipe details error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

module.exports = router; 