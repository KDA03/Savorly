import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../styles/DesignSystem';

// TypeScript interfaces
interface Meal {
  id: string;
  name: string;
  description: string;
  imageURL: string;
  calories: number;
  prepTime: number;
  cookTime: number;
  tags: string[];
  dietaryTags: string[];
  rating: number;
  reviewCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface MealPack {
  id: string;
  name: string;
  description: string;
  imageURL: string;
  mealCount: number;
  isLocked: boolean;
  unlockRequirement?: {
    description: string;
    type: string;
    count: number;
  };
  unlockProgress?: number;
  theme: {
    gradientColors: string[];
    icon: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface Resource {
  id: string;
  title: string;
  description: string;
  imageURL: string;
  url: string;
  type: 'article' | 'video' | 'guide';
}

interface SwipeableCardProps {
  meal: Meal;
  onSwipe: (direction: 'left' | 'right') => void;
}

interface MealPackCardProps {
  pack: MealPack;
  onPress: () => void;
}

interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
}

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    height: height * 0.6,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
  },
  cardImageContainer: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: Colors.text.secondary,
  },
  cardDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: Typography.body.fontSize * 0.85,
    color: Colors.text.secondary,
  },
  mealStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: Typography.body.fontSize * 0.85,
    color: Colors.text.secondary,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 50,
    padding: 10,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  likeIndicator: {
    right: 20,
    borderColor: '#4CAF50',
  },
  nopeIndicator: {
    left: 20,
    borderColor: '#F44336',
  },
  swipeIndicatorText: {
    color: '#fff',
    fontSize: Typography.body.fontSize,
    fontWeight: 'bold',
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
    fontSize: Typography.body.fontSize,
    fontWeight: 'bold',
  },
  packCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  packImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packInfo: {
    flex: 1,
    padding: 16,
  },
  packTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packMealCount: {
    fontSize: Typography.body.fontSize,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  unlockContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  unlockText: {
    fontSize: Typography.body.fontSize,
    color: Colors.text.secondary,
  },
  lockIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  resourceImageContainer: {
    height: 120,
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceTypeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resourceTypeText: {
    color: '#fff',
    fontSize: Typography.body.fontSize,
    marginLeft: 4,
  },
  resourceContent: {
    padding: 16,
  },
  resourceTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.text.secondary,
  },
});

const SwipeableCard: React.FC<SwipeableCardProps> = ({ meal, onSwipe }) => {
  const translateX = new Animated.Value(0);
  const translateY = new Animated.Value(0);
  
  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const cardOpacity = translateX.interpolate({
    inputRange: [-200, -150, 0, 150, 200],
    outputRange: [0.5, 1, 1, 1, 0.5],
    extrapolate: 'clamp',
  });

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;

      if (Math.abs(translationX) > 120) {
        const direction = translationX > 0 ? 'right' : 'left';

        Animated.timing(translateX, {
          toValue: direction === 'right' ? 500 : -500,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onSwipe(direction);
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();

        Animated.spring(translateY, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={{ transform: [{ translateX }, { translateY }, { rotate }], opacity: cardOpacity }}>
        {/* Your component JSX should be here */}
      </Animated.View>
    </PanGestureHandler>
  );
};


const MealPackCard: React.FC<MealPackCardProps> = ({ pack, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10 }}>
      <Text>{pack.name}</Text>
    </TouchableOpacity>
  );
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10 }}>
      <Text>{resource.title}</Text>
    </TouchableOpacity>
  );
};

// ... rest of the file ... 