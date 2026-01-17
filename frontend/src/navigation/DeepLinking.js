import { Linking } from 'react-native';

/**
 * Configuración de Deep Linking para Home Care
 */
export const linkingConfig = {
  prefixes: [
    'homecare://',
    'https://homecare.app',
  ],
  config: {
    screens: {
      AuthNavigator: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'reset-password',
        },
      },
      ClientTabNavigator: {
        screens: {
          Home: {
            screens: {
              ClientHome: '',
              ServiceDetails: 'service/:serviceId',
              RequestService: 'request',
            },
          },
          Profile: 'profile',
        },
      },
      ProviderTabNavigator: {
        screens: {
          Home: 'provider',
          Profile: 'provider/profile',
        },
      },
      AdminTabNavigator: {
        screens: {
          Dashboard: 'admin',
          Users: 'admin/users',
          Reports: 'admin/reports',
          Settings: 'admin/settings',
        },
      },
    },
  },
};

/**
 * Utilidades para Deep Linking
 */
export class DeepLinkingUtils {
  static async getInitialURL() {
    try {
      return await Linking.getInitialURL();
    } catch (error) {
      console.warn('Error getting initial URL:', error);
      return null;
    }
  }

  static async openURL(url) {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn('Cannot open URL:', url);
        return false;
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      return false;
    }
  }

  static parseUrl(url) {
    try {
      if (!url) return null;

      let cleanUrl = url;
      if (url.includes('homecare://')) {
        cleanUrl = url.replace('homecare://', '');
      }
      if (url.includes('https://homecare.app/')) {
        cleanUrl = url.replace('https://homecare.app/', '');
      }

      const segments = cleanUrl.split('/').filter(segment => segment.length > 0);
      
      return {
        segments,
        raw: url,
        clean: cleanUrl,
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }
}

export default {
  linkingConfig,
  DeepLinkingUtils,
};