import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// TypeScript interfaces
interface MealPack {
  id: string;
  name: string;
  description: string;
  imageURL: string;
  mealCount: number;
  theme: {
    gradientColors: string[];
    icon: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface DailyPackOpeningViewProps {
  pack: MealPack;
  onClose: () => void;
  onComplete: () => void;
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

const DailyPackOpeningView: React.FC<DailyPackOpeningViewProps> = ({
  pack,
  onClose,
  onComplete,
}) => {
  // Animation states
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  
  // Animated values
  const scale = new Animated.Value(0.8);
  const rotation = new Animated.Value(0);
  const opacity = new Animated.Value(1);
  const lockPosition = new Animated.Value(0);
  const lockOpacity = new Animated.Value(1);
  const checkmarkScale = new Animated.Value(0);
  const checkmarkOpacity = new Animated.Value(0);

  // Start animation sequence when component mounts
  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Initial appearance animation
    Animated.spring(scale, {
      toValue: 1.0,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // After 1 second, animate the lock breaking
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(lockPosition, {
          toValue: -100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(lockOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: -10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setAnimationStep(1);
        
        // After lock breaks, show checkmark and confetti
        setTimeout(() => {
          Animated.parallel([
            Animated.spring(checkmarkScale, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(checkmarkOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
          
          setShowConfetti(true);
          setAnimationStep(2);
          
          // Pulse animation for the pack
          const pulseAnimation = Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]);
          
          Animated.loop(pulseAnimation, { iterations: 3 }).start(() => {
            // Show continue button after animations complete
            setTimeout(() => {
              setAnimationStep(3);
            }, 1000);
          });
        }, 800);
      });
    }, 1000);
  };

  // Generate random confetti pieces
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    const confettiPieces = [];
    const colors = ['#FF5252', '#448AFF', '#4CAF50', '#FFC107', '#9C27B0', '#FF9800'];
    
    for (let i = 0; i < 50; i++) {
      const size = Math.random() * 10 + 5;
      const initialX = (Math.random() * width) - (width / 2);
      const initialY = (Math.random() * height / 4) - (height / 8);
      const duration = Math.random() * 2000 + 1000;
      const delay = Math.random() * 500;
      
      const translateY = new Animated.Value(initialY);
      const translateX = new Animated.Value(initialX);
      const rotate = new Animated.Value(0);
      const confettiOpacity = new Animated.Value(1);
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: initialY + (Math.random() * height / 2) + (height / 4),
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: initialX + (Math.random() * width / 2) - (width / 4),
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 360,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(confettiOpacity, {
          toValue: 0,
          duration,
          delay: delay + (duration / 2),
          useNativeDriver: true,
        }),
      ]).start();
      
      confettiPieces.push(
        <Animated.View
          key={`confetti-${i}`}
          style={[
            styles.confettiPiece,
            {
              width: size,
              height: size,
              backgroundColor: colors[i % colors.length],
              transform: [
                { translateX },
                { translateY },
                { rotate: rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })},
              ],
              opacity: confettiOpacity,
            },
          ]}
        />
      );
    }
    
    return confettiPieces;
  };

  const rarityColors = getRarityColors(pack.rarity);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        {/* Confetti animation */}
        <View style={styles.confettiContainer}>
          {renderConfetti()}
        </View>
        
        {/* Pack opening animation */}
        <View style={styles.contentContainer}>
          {/* Pack image with animations */}
          <View style={styles.packImageContainer}>
            <Animated.View
              style={[
                styles.packCircle,
                {
                  transform: [
                    { scale },
                    { rotate: rotation.interpolate({
                      inputRange: [-10, 0, 10],
                      outputRange: ['-10deg', '0deg', '10deg'],
                    })},
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={rarityColors}
                style={styles.packGradient}
              >
                <Ionicons name={pack.theme.icon} size={80} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
              
              {/* Lock that animates away */}
              {animationStep < 1 && (
                <Animated.View
                  style={[
                    styles.lockContainer,
                    {
                      transform: [{ translateY: lockPosition }],
                      opacity: lockOpacity,
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={60} color="#fff" />
                </Animated.View>
              )}
              
              {/* Checkmark that fades in */}
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  {
                    transform: [{ scale: checkmarkScale }],
                    opacity: checkmarkOpacity,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              </Animated.View>
            </Animated.View>
          </View>
          
          {/* Text message */}
          <Text style={styles.messageText}>
            {animationStep < 2 ? "Opening Daily Pack..." : "Pack Opened!"}
          </Text>
          
          {/* Pack name */}
          <Text style={styles.packNameText}>{pack.name}</Text>
          
          {/* Pack details */}
          <Text style={styles.packDetailsText}>{pack.mealCount} new meals available!</Text>
          
          {/* Continue button appears after animation */}
          {animationStep >= 3 && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onComplete}
            >
              <LinearGradient
                colors={rarityColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  packCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  checkmarkContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  packNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  packDetailsText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  continueButton: {
    width: '80%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  continueButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: -60,
    right: 0,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default DailyPackOpeningView;