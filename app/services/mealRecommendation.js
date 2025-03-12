import axios from 'axios';
import { getData, saveData } from '../utils/secureStorage';
import Config from '../config';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const CACHE_KEY = 'meal_recommendations_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const generateMealPrompt = (preferences, restrictions, mealHistory) => {
  return `Generate a personalized meal recommendation based on the following:
    Dietary Preferences: ${preferences.join(', ')}
    Restrictions: ${restrictions.join(', ')}
    Recent Meals: ${mealHistory.slice(-5).join(', ')}
    
    Please suggest a meal that:
    1. Matches the dietary preferences
    2. Avoids any restrictions
    3. Is different from recent meals
    4. Includes nutritional information
    5. Provides cooking difficulty level
    
    Format the response as a JSON object.`;
};

export const getMealRecommendations = async (preferences, restrictions, mealHistory) => {
  try {
    // Check cache first
    const cache = await getData(CACHE_KEY);
    if (cache && cache.timestamp > Date.now() - CACHE_EXPIRY) {
      return cache.recommendations;
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef and nutritionist specializing in personalized meal recommendations.'
          },
          {
            role: 'user',
            content: generateMealPrompt(preferences, restrictions, mealHistory)
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const recommendations = JSON.parse(response.data.choices[0].message.content);

    // Cache the results
    await saveData(CACHE_KEY, {
      timestamp: Date.now(),
      recommendations
    });

    return recommendations;
  } catch (error) {
    console.error('Error getting meal recommendations:', error);
    throw new Error('Failed to get meal recommendations');
  }
};

export const getRecipeDetails = async (meal) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef providing detailed cooking instructions.'
          },
          {
            role: 'user',
            content: `Provide a detailed recipe for ${meal} including:
              1. List of ingredients with measurements
              2. Step-by-step cooking instructions
              3. Cooking time and difficulty level
              4. Nutritional information per serving
              5. Tips for preparation and storage
              
              Format the response as a JSON object.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error getting recipe details:', error);
    throw new Error('Failed to get recipe details');
  }
};

export const generateWeeklyMealPlan = async (preferences, restrictions) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a meal planning expert creating weekly meal plans.'
          },
          {
            role: 'user',
            content: `Create a 7-day meal plan based on:
              Preferences: ${preferences.join(', ')}
              Restrictions: ${restrictions.join(', ')}
              
              For each day, include:
              1. Breakfast
              2. Lunch
              3. Dinner
              4. Snacks
              5. Total daily calories and macronutrients
              
              Format the response as a JSON object with days as keys.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error('Failed to generate meal plan');
  }
};

export const getIngredientSubstitutions = async (ingredient, restrictions) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a culinary expert specializing in ingredient substitutions.'
          },
          {
            role: 'user',
            content: `Suggest substitutions for ${ingredient} that:
              1. Accommodate these restrictions: ${restrictions.join(', ')}
              2. Maintain similar taste/texture
              3. Provide similar nutritional value
              
              Format the response as a JSON array of substitutions with properties:
              - name
              - nutritionalComparison
              - usageInstructions
              - whereToFind`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error getting ingredient substitutions:', error);
    throw new Error('Failed to get ingredient substitutions');
  }
}; 