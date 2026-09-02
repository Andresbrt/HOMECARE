import apiClient from './apiClient';

export const aiChat = async (mensaje) => {
  const { data } = await apiClient.post('/ai/asistente', { mensaje });
  return data.respuesta;
};

export const aiSuggestPrice = async (contexto) => {
  const { data } = await apiClient.post('/ai/precio', { contexto });
  return data.respuesta;
};

export const aiSupport = async (mensaje) => {
  const { data } = await apiClient.post('/ai/soporte', { mensaje });
  return data.respuesta;
};
