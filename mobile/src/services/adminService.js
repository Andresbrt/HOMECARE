import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    /** Verificar PIN de administrador */
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },

    /** Estadísticas generales del panel */
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },

    /** Lista de usuarios paginada */
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },

    /** Lista de profesionales */
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },

    /** Solicitudes recientes */
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },

    /** Bloquear / desbloquear usuario */
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },

    /** Aprobar / rechazar profesional */
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
