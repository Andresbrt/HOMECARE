import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8083/api/auth';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },

    getCurrentUser: async () => {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};
