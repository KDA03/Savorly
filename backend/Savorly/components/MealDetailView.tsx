import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// TypeScript interfaces
interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  imageURL: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionFacts: NutritionFacts;
  tags: string[];
  dietaryTags: string[];
  rating: number;
  reviewCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  isFavorite?: boolean;
}

interface MealDetailViewProps {
  meal: Meal;
  onClose: () => void;
  onAddToFavorites?: () => void;
  onAddToPlan?: () => void;
}

// Helper function to get rarity colors
const getRarityColors = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return ['#FFD700', '#FFA500']; // Gold gradient
    case 'rare':
      return ['#B24BF3', '#7B1FA2']; // Purple gradient
    case 'uncommon':
      return ['#33CCFF', '#3366FF']; // Blue gradient
    case 'common':
    default:
      return ['#4CAF50', '#2E7D32']; // Green gradient
  }
};

const MealDetailView: React.FC<MealDetailViewProps> = ({
  meal,
  onClose,
  onAddToFavorites,
  onAddToPlan,
}) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const rarityColors = getRarityColors(meal.rarity);

  const TabButton = ({ title, isSelected, onPress }: { title: string; isSelected: boolean; onPress: () => void }) => (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextSelected]}>{title}</Text>
      <View style={[styles.tabIndicator, isSelected && { backgroundColor: rarityColors[0] }]} />
    </TouchableOpacity>
  );

  const NutritionRow = ({ name, value }: { name: string; value: string }) => (
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionName}>{name}</Text>
      <Text style={styles.nutritionValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false}>
        <View style={styles.header}>
          {/* Header image with gradient overlay */}
          <LinearGradient
            colors={rarityColors}
            style={styles.headerImage}
          >
            <Ionicons name="restaurant-outline" size={80} color="rgba(255,255,255,0.3)" />
          </LinearGradient>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Rarity badge */}
          <View style={styles.rarityBadgeContainer}>
            <LinearGradient
              colors={rarityColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rarityBadge}
            >
              <Text style={styles.rarityText}>{meal.rarity.toUpperCase()}</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title and rating */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{meal.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{meal.rating}</Text>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.reviewCount}>({meal.reviewCount})</Text>
            </View>
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScrollView}>
            <View style={styles.tagsContainer}>
              {meal.tags.map((tag, index) => (
                <View key={`tag-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {meal.dietaryTags.map((tag, index) => (
                <View key={`dietary-${index}`} style={styles.dietaryTag}>
                  <Text style={styles.dietaryTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Description */}
          <Text style={styles.description}>{meal.description}</Text>

          {/* Meal stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.statValue}>{meal.prepTime + meal.cookTime} min</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#666" />
              <Text style={styles.statValue}>{meal.calories} cal</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color="#666" />
              <Text style={styles.statValue}>{meal.difficulty}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={styles.statValue}>{meal.servings}</Text>
              <Text style={styles.statLabel}>Servings</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tab selector */}
          <View style={styles.tabContainer}>
            <TabButton
              title="Ingredients"
              isSelected={selectedTab === 0}
              onPress={() => setSelectedTab(0)}
            />
            <TabButton
              title="Instructions"
              isSelected={selectedTab === 1}
              onPress={() => setSelectedTab(1)}
            />
            <TabButton
              title="Nutrition"
              isSelected={selectedTab === 2}
              onPress={() => setSelectedTab(2)}
            />
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {selectedTab === 0 && (
              // Ingredients
              <View>
                {meal.ingredients.map((ingredient, index) => (
                  <View key={ingredient.id} style={styles.ingredientRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.ingredientText}>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 1 && (
              // Instructions
              <View>
                {meal.instructions.map((step, index) => (
                  <View key={`step-${index}`} style={styles.instructionRow}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 2 && (
              // Nutrition facts
              <View style={styles.nutritionContainer}>
                <NutritionRow name="Calories" value={`${meal.calories} cal`} />
                <NutritionRow name="Protein" value={`${Math.round(meal.nutritionFacts.protein)}g`} />
                <NutritionRow name="Carbs" value={`${Math.round(meal.nutritionFacts.carbs)}g`} />
                <NutritionRow name="Fat" value={`${Math.round(meal.nutritionFacts.fat)}g`} />
                <NutritionRow name="Sugar" value={`${Math.round(meal.nutritionFacts.sugar)}g`} />
                <NutritionRow name="Fiber" value={`${Math.round(meal.nutritionFacts.fiber)}g`} />
                <NutritionRow name="Sodium" value={`${Math.round(meal.nutritionFacts.sodium)}mg`} />
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, meal.isFavorite ? styles.actionButtonDisabled : styles.actionButtonPrimary]}
              onPress={onAddToFavorites}
            >
              <Ionicons name={meal.isFavorite ? "heart" : "heart-outline"} size={20} color={meal.isFavorite ? "#666" : "#fff"} />
              <Text style={[styles.actionButtonText, meal.isFavorite ? styles.actionButtonTextDisabled : styles.actionButtonTextPrimary]}>
                {meal.isFavorite ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={onAddToPlan}
            >
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonTextSecondary}>Add to Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'relative',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  tagsScrollView: {
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  dietaryTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dietaryTagText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tabButtonTextSelected: {
    fontWeight: 'bold',
    color: '#000',
  },
  tabIndicator: {
    height: 3,
    width: '50%',
    backgroundColor: 'transparent',
    borderRadius: 1.5,
  },
  tabContent: {
    minHeight: 200,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  nutritionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutritionName: {
    fontSize: 14,
    color: '#333',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  actionButtonSecondary: {
    backgroundColor: '#2196F3',
  },
  actionButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextPrimary: {
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#fff',
  },
  actionButtonTextDisabled: {
    color: '#666',
  }