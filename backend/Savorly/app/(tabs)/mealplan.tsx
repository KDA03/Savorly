import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../styles/DesignSystem';

const MealPlanScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽️ Meal Planner</Text>
      <Text style={styles.subtitle}>Plan your meals effortlessly with Savorly!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});

export default MealPlanScreen;
