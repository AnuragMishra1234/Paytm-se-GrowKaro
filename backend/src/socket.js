const { Server } = require('socket.io');

let ioInstance = null;

/**
 * Initialize Socket.IO with HTTP server
 */
function initSocket(server, allowedOrigins = []) {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.onrender.com') ||
          process.env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join:merchant', (merchantId) => {
      if (!merchantId) return;
      const room = `merchant_${merchantId}`;
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
      socket.emit('joined:merchant', { merchantId, room });
    });

    socket.on('leave:merchant', (merchantId) => {
      if (!merchantId) return;
      const room = `merchant_${merchantId}`;
      socket.leave(room);
      console.log(`[Socket.IO] Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
}

/**
 * Get the active Socket.IO instance
 */
function getIO() {
  return ioInstance;
}

/**
 * Emit event to all sockets subscribed to a specific merchant room
 */
function emitToMerchant(merchantId, event, data) {
  if (!ioInstance) {
    console.warn(`[Socket.IO] Warning: ioInstance not initialized when emitting ${event}`);
    return;
  }
  const mIdStr = merchantId ? merchantId.toString() : null;
  if (!mIdStr) return;

  const room = `merchant_${mIdStr}`;
  ioInstance.to(room).emit(event, data);
  // Also emit globally so demo dashboards listening globally catch it
  ioInstance.emit(`merchant:${mIdStr}:${event}`, data);
  console.log(`[Socket.IO] Emitted '${event}' to ${room}`);
}

module.exports = {
  initSocket,
  getIO,
  emitToMerchant,
};
