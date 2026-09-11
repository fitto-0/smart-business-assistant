/**
 * WebSocket Server for Real-time Notifications
 * Uses Socket.io for real-time communication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize WebSocket server
 */
const initWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.organizationId = decoded.organizationId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.email})`);
    
    // Join organization room
    if (socket.organizationId) {
      socket.join(`org_${socket.organizationId}`);
      console.log(`User ${socket.user.id} joined org_${socket.organizationId}`);
    }

    // Join user-specific room
    socket.join(`user_${socket.user.id}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });

    // Handle typing indicators (for chat/collaboration)
    socket.on('typing:start', (data) => {
      socket.to(`org_${socket.organizationId}`).emit('typing:start', {
        userId: socket.user.id,
        userName: socket.user.name,
        ...data,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`org_${socket.organizationId}`).emit('typing:stop', {
        userId: socket.user.id,
        ...data,
      });
    });
  });

  return io;
};

/**
 * Get WebSocket instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

/**
 * Send notification to specific user
 */
const sendToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Send notification to organization
 */
const sendToOrganization = (organizationId, event, data) => {
  if (!io) return;
  io.to(`org_${organizationId}`).emit(event, data);
};

/**
 * Send notification to all connected clients
 */
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Send real-time notification
 */
const sendNotification = (userId, notification) => {
  sendToUser(userId, 'notification:new', notification);
};

/**
 * Send real-time alert
 */
const sendAlert = (organizationId, alert) => {
  sendToOrganization(organizationId, 'alert:new', alert);
};

/**
 * Send data update event
 */
const sendDataUpdate = (organizationId, type, data) => {
  sendToOrganization(organizationId, `data:update:${type}`, data);
};

/**
 * Send activity event
 */
const sendActivity = (organizationId, activity) => {
  sendToOrganization(organizationId, 'activity:new', activity);
};

module.exports = {
  initWebSocket,
  getIO,
  sendToUser,
  sendToOrganization,
  broadcast,
  sendNotification,
  sendAlert,
  sendDataUpdate,
  sendActivity,
};
