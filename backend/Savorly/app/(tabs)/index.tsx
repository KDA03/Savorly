import { Colors, Typography, Spacing } from '../styles/DesignSystem';

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IndexScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Savorly is LIVE and Working! 🚀</Text>
      <Text style={styles.subtitle}>Your personal food intelligence app!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red' // Make text RED for easy confirmation
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});

export default IndexScreen;
