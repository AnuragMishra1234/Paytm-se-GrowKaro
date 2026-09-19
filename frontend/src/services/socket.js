import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
    this.currentMerchantId = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(merchantId = null) {
    if (merchantId) {
      this.currentMerchantId = merchantId;
    }

    if (this.socket && this.socket.connected) {
      if (merchantId) {
        this.joinMerchant(merchantId);
      }
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log(`[Socket.IO Frontend] Connected: ${this.socket.id}`);
      if (this.currentMerchantId) {
        this.joinMerchant(this.currentMerchantId);
      }
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log(`[Socket.IO Frontend] Disconnected: ${reason}`);
    });

    this.socket.on("connect_error", (err) => {
      console.warn(`[Socket.IO Frontend] Connection Error: ${err.message}`);
    });

    // Re-bind registered listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket.on(event, cb);
      });
    });

    return this.socket;
  }

  joinMerchant(merchantId) {
    if (!merchantId) return;
    this.currentMerchantId = merchantId;
    if (this.socket && this.socket.connected) {
      this.socket.emit("join:merchant", merchantId);
      console.log(`[Socket.IO Frontend] Emitted join:merchant for ${merchantId}`);
    }
  }

  leaveMerchant(merchantId) {
    if (this.socket && this.socket.connected && merchantId) {
      this.socket.emit("leave:merchant", merchantId);
    }
    if (this.currentMerchantId === merchantId) {
      this.currentMerchantId = null;
    }
  }

  disconnect() {
    if (this.currentMerchantId && this.socket?.connected) {
      this.leaveMerchant(this.currentMerchantId);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return un-subscriber
    return () => {
      this.off(event, callback);
    };
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
