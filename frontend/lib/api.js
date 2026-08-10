import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getToken = () => Cookies.get('sba_token');

const getHeaders = (headers = {}) => {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' ? payload.error || payload.message : payload;
    throw new Error(message || 'Request failed');
  }

  return payload;
};

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, params, headers = {} } = options;

  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const requestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(headers),
    },
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), requestInit);
  return parseResponse(response);
};

export const apiGet = (path, params) => apiRequest(path, { method: 'GET', params });
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body });
export const apiPut = (path, body) => apiRequest(path, { method: 'PUT', body });
export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' });

export const getApiBaseUrl = () => API_BASE_URL;
