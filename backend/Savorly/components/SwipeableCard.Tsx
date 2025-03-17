import { Colors, Typography, Spacing } from '../styles/DesignSystem';
import { View, Text, StyleSheet } from 'react-native';

const SwipeableCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Swipe Me!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary, // Uses our defined primary color
    padding: Spacing.medium, // Uses our spacing system
    borderRadius: 10,
  },
  title: {
    ...Typography.title, // Uses our typography system
  },
});

export default SwipeableCard;
