import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'homecare://'],
  config: {
    screens: {
      VerifyEmail: 'verify-email/:token',
      ResetPassword: 'reset-password/:token',
      Login: 'login',
      Register: 'register',
    },
  },
};

export default linking;
