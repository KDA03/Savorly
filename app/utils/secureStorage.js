import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSecureData = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving secure data:', error);
    return false;
  }
};

export const getSecureData = async (key) => {
  try {
    const data = await SecureStore.getItemAsync(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting secure data:', error);
    return null;
  }
};

export const removeSecureData = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error('Error removing secure data:', error);
    return false;
  }
};

export const clearAllSecureData = async () => {
  try {
    const keys = await SecureStore.getAllKeys();
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
    return true;
  } catch (error) {
    console.error('Error clearing secure data:', error);
    return false;
  }
};

// For non-sensitive data that needs to persist offline
export const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const getData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Utility function to determine if device supports secure storage
export const isSecureStorageAvailable = async () => {
  try {
    await SecureStore.setItemAsync('test', 'test');
    await SecureStore.deleteItemAsync('test');
    return true;
  } catch (error) {
    return false;
  }
}; 