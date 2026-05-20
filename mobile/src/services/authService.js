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

// Interceptor de respuesta: refresca el token automáticamente ante 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) return Promise.reject(error);
                const res = await axios.post(`${API_URL}/refresh`, { refreshToken });
                const newToken = res.data.token;
                await SecureStore.setItemAsync('token', newToken);
                if (res.data.refreshToken) {
                    await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
                }
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (_refreshError) {
                // Refresh falló — limpiar sesión
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('refreshToken');
                await SecureStore.deleteItemAsync('user');
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email: email.trim().toLowerCase(), password });
        if (response.data.token) {
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data));
            if (response.data.refreshToken) {
                await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            }
        }
        return response.data;
    },

    supabaseLogin: async ({ supabaseToken, nombre, apellido, telefono, rol }) => {
        const response = await api.post('/supabase-login', { supabaseToken, nombre, apellido, telefono, rol });
        if (response.data.token) {
            await SecureStore.setItemAsync('token', response.data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data));
            if (response.data.refreshToken) {
                await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            }
        }
        return response.data;
    },

    /** @deprecated Usar supabaseLogin. Mantenido por compatibilidad. */
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
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
    },
};
