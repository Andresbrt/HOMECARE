/**
 * 🔐 SECURE STORAGE MANAGER
 * 
 * Wrapper for expo-secure-store to safely store sensitive data
 * like JWT tokens, API keys, and user credentials.
 * 
 * Uses:
 * - iOS: Keychain (encrypted, survives app reinstall if configured)
 * - Android: EncryptedSharedPreferences backed by Keystore
 * 
 * @module secureStorage
 * @version 2.0.0 - Updated for Expo SDK 55 (Marzo 2026)
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ============================================
// 🔑 STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'homecare_access_token',
  REFRESH_TOKEN: 'homecare_refresh_token',
  USER_ID: 'homecare_user_id',
  USER_EMAIL: 'homecare_user_email',
  BIOMETRIC_ENABLED: 'homecare_biometric_enabled',
};

// ============================================
// 📱 SECURE STORE OPTIONS
// ============================================
const getSecureStoreOptions = (requireAuth = false) => {
  if (Platform.OS === 'ios') {
    return {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: requireAuth, // true = Face ID/Touch ID required
      authenticationPrompt: 'Autenticarse para acceder',
    };
  }

  if (Platform.OS === 'android') {
    return {
      keychainService: 'com.homecare.app',
      requireAuthentication: requireAuth, // true = Biometric/PIN required
    };
  }

  return {};
};

// ============================================
// 💾 SECURE STORAGE CLASS
// ============================================

class SecureStorageManager {
  /**
   * Save a value securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store (must be string)
   * @param {boolean} requireAuth - Require biometric authentication
   * @returns {Promise<boolean>} Success status
   */
  async setItem(key, value, requireAuth = false) {
    try {
      if (!key || value === undefined || value === null) {
        throw new Error('Key and value are required');
      }

      await SecureStore.setItemAsync(
        key,
        String(value),
        getSecureStoreOptions(requireAuth)
      );

      if (__DEV__) {
        console.log(`✅ [SecureStore] Saved: ${key}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ [SecureStore] Error saving ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Retrieve a value securely
   * @param {string} key - Storage key
   * @param {boolean} requireAuth - Require biometric authentication
   * @returns {Promise<string|null>} Stored value or null
   */
  async getItem(key, requireAuth = false) {
    try {
      const value = await SecureStore.getItemAsync(
        key,
        getSecureStoreOptions(requireAuth)
      );

      if (__DEV__ && value) {
        console.log(`✅ [SecureStore] Retrieved: ${key}`);
      }

      return value;
    } catch (error) {
      console.error(`❌ [SecureStore] Error getting ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Delete a value
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);

      if (__DEV__) {
        console.log(`🗑️ [SecureStore] Deleted: ${key}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ [SecureStore] Error deleting ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Clear all HomeCare data
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));

      if (__DEV__) {
        console.log('🗑️ [SecureStore] Cleared all data');
      }

      return true;
    } catch (error) {
      console.error('❌ [SecureStore] Error clearing all:', error.message);
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   * @returns {Promise<boolean>}
   */
  async isBiometricAvailable() {
    try {
      // Note: expo-local-authentication needed for full biometric support
      // This is a basic check
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch (error) {
      return false;
    }
  }
}

// ============================================
// 🔐 TOKEN MANAGEMENT
// ============================================

export class TokenManager extends SecureStorageManager {
  /**
   * Save access token
   * @param {string} token - JWT access token
   * @returns {Promise<boolean>}
   */
  async setAccessToken(token) {
    return this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, false);
  }

  /**
   * Get access token
   * @returns {Promise<string|null>}
   */
  async getAccessToken() {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN, false);
  }

  /**
   * Save refresh token
   * @param {string} token - JWT refresh token
   * @returns {Promise<boolean>}
   */
  async setRefreshToken(token) {
    return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token, false);
  }

  /**
   * Get refresh token
   * @returns {Promise<string|null>}
   */
  async getRefreshToken() {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN, false);
  }

  /**
   * Save both tokens
   * @param {string} accessToken
   * @param {string} refreshToken
   * @returns {Promise<boolean>}
   */
  async setTokens(accessToken, refreshToken) {
    const results = await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
    return results.every(r => r === true);
  }

  /**
   * Clear all tokens (logout)
   * @returns {Promise<boolean>}
   */
  async clearTokens() {
    const results = await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return results.every(r => r === true);
  }

  /**
   * Check if user has valid token
   * @returns {Promise<boolean>}
   */
  async hasValidToken() {
    const token = await this.getAccessToken();
    return token !== null && token.length > 0;
  }
}

// ============================================
// 👤 USER DATA MANAGEMENT
// ============================================

export class UserDataManager extends SecureStorageManager {
  /**
   * Save user ID
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async setUserId(userId) {
    return this.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  /**
   * Get user ID
   * @returns {Promise<string|null>}
   */
  async getUserId() {
    return this.getItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Save user email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async setUserEmail(email) {
    return this.setItem(STORAGE_KEYS.USER_EMAIL, email);
  }

  /**
   * Get user email
   * @returns {Promise<string|null>}
   */
  async getUserEmail() {
    return this.getItem(STORAGE_KEYS.USER_EMAIL);
  }

  /**
   * Clear all user data
   * @returns {Promise<boolean>}
   */
  async clearUserData() {
    const results = await Promise.all([
      this.removeItem(STORAGE_KEYS.USER_ID),
      this.removeItem(STORAGE_KEYS.USER_EMAIL),
    ]);
    return results.every(r => r === true);
  }
}

// ============================================
// 📤 EXPORTS
// ============================================

// Singleton instances
export const secureStorage = new SecureStorageManager();
export const tokenManager = new TokenManager();
export const userDataManager = new UserDataManager();

// Default export
export default secureStorage;

// ============================================
// 📖 USAGE EXAMPLES
// ============================================

/**
 * EXAMPLE 1: Save and retrieve tokens
 * 
 * import { tokenManager } from './config/secureStorage';
 * 
 * // After login
 * await tokenManager.setTokens(accessToken, refreshToken);
 * 
 * // Check auth status
 * const isLoggedIn = await tokenManager.hasValidToken();
 * 
 * // Logout
 * await tokenManager.clearTokens();
 */

/**
 * EXAMPLE 2: Custom secure data
 * 
 * import { secureStorage } from './config/secureStorage';
 * 
 * // Save
 * await secureStorage.setItem('api_key', myApiKey);
 * 
 * // Retrieve
 * const apiKey = await secureStorage.getItem('api_key');
 * 
 * // With biometric auth required
 * await secureStorage.setItem('api_key', myApiKey, true);
 * const apiKey = await secureStorage.getItem('api_key', true);
 */

/**
 * EXAMPLE 3: User data
 * 
 * import { userDataManager } from './config/secureStorage';
 * 
 * // Save user info after login
 * await userDataManager.setUserId(user.id);
 * await userDataManager.setUserEmail(user.email);
 * 
 * // Retrieve
 * const userId = await userDataManager.getUserId();
 * 
 * // Clear on logout
 * await userDataManager.clearUserData();
 */
