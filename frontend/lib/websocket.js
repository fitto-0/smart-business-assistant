import { io } from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const connectWebSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    reconnectAttempts++;
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onNotification = (callback) => {
  if (socket) {
    socket.on('notification', callback);
  }
};

export const offNotification = (callback) => {
  if (socket) {
    socket.off('notification', callback);
  }
};

export const onAlert = (callback) => {
  if (socket) {
    socket.on('alert', callback);
  }
};

export const offAlert = (callback) => {
  if (socket) {
    socket.off('alert', callback);
  }
};

export const onDataUpdate = (callback) => {
  if (socket) {
    socket.on('data-update', callback);
  }
};

export const offDataUpdate = (callback) => {
  if (socket) {
    socket.off('data-update', callback);
  }
};

export const joinOrganization = (organizationId) => {
  if (socket) {
    socket.emit('join-organization', { organizationId });
  }
};

export const leaveOrganization = (organizationId) => {
  if (socket) {
    socket.emit('leave-organization', { organizationId });
  }
};
