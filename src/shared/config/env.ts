const defaultApiUrl = 'http://127.0.0.1:8080/api/v1';

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? defaultApiUrl,
  dgisMapKey: import.meta.env.VITE_2GIS_MAP_KEY ?? '',
};