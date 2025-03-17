import { Colors, Typography, Spacing } from '../styles/DesignSystem';
import { View, Text, StyleSheet } from 'react-native';

const MealCardView = ({ meal }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{meal.name}</Text>
      <Text style={styles.subtitle}>{meal.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondary, // Uses our defined secondary color
    padding: Spacing.large, // Uses our spacing system
    borderRadius: 12,
  },
  title: {
    ...Typography.title, // Uses our typography system
  },
  subtitle: {
    ...Typography.body, // Uses body typography style
  },
});

export default MealCardView;
