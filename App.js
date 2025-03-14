import SignUpScreen from './screens/SignUpScreen';
import React, { 
useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import firebase from 'firebase/app';
import 'firebase/auth';
import { enableScreens } from 'react-native-screens';
import * as Notifications from 'expo-notifications';
import * as Localization from 'expo-localization';
import i18next from 'i18next';

// Import screens
import LoginScreen from './app/screens/auth/LoginScreen';
import SignUpScreen from './app/screens/auth/SignUpScreen';
import ForgotPasswordScreen from './app/screens/auth/ForgotPasswordScreen';
import HomeScreen from './app/screens/HomeScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import MealPlanScreen from './app/screens/MealPlanScreen';
import RecipeDetailScreen from './app/screens/RecipeDetailScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import PaymentScreen from './app/screens/PaymentScreen';
import NotificationsScreen from './app/screens/NotificationsScreen';
import AchievementsScreen from './app/screens/AchievementsScreen';

// Import theme and constants
import { colors } from './app/constants/theme';

enableScreens();

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Stack = createStackNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configure i18n
const supportedLanguages = ['en', 'es', 'fr', 'bn', 'ru', 'zh', 'hi'];
i18next.init({
  lng: Localization.locale.split('-')[0] || 'en',
  resources: Object.fromEntries(
    supportedLanguages.map(lang => [
      lang,
      {
        translation: {
          welcome: "Welcome",
          profile: "Profile",
          settings: "Settings",
          servings: "Servings",
          nutrition: "Nutrition Info",
          restock: "Restock Ingredients",
          language: "Select Language"
        }
      }
    ])
  ),
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    // Request notification permissions
    Notifications.requestPermissionsAsync();

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey="your-publishable-key">
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.green,
              },
              headerTintColor: colors.gold,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            {!isAuthenticated ? (
              // Auth Stack
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SignUp"
                  component={SignUpScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPasswordScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              // Main App Stack
              <>
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="MealPlan" component={MealPlanScreen} />
                <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Achievements" component={AchievementsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </GestureHandlerRootView>
  );
};

export default App;

