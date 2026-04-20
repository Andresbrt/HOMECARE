import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
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
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data));
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

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ─── Recuperación de contraseña con OTP ──────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
    },
};
