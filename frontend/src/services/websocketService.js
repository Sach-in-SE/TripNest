import { Client } from '@stomp/stompjs';

/**
 * Service managing STOMP over WebSocket for real-time collaboration.
 * Uses native WebSocket in @stomp/stompjs with dynamic JWT authentication,
 * automatic reconnect, topic subscription management, and clean teardown.
 */

const getBrokerUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    const url = import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws');
    return `${url.replace(/\/+$/, '')}/ws`;
  }
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  return 'ws://localhost:8080/ws';
};

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map(); // groupId -> Set of callback handlers
    this.activeStompSubs = new Map(); // groupId -> StompSubscription
    this.connectionPromise = null;
    this.connected = false;
  }

  /**
   * Initializes and connects the STOMP client.
   * Returns a promise that resolves once CONNECTED.
   */
  connect() {
    if (this.connected && this.client && this.client.active) {
      return Promise.resolve(this.client);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      if (!token) {
        this.connectionPromise = null;
        return reject(new Error('No authentication token available for WebSocket connection.'));
      }

      this.client = new Client({
        brokerURL: getBrokerUrl(),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        beforeConnect: () => {
          // Always read latest token from localStorage upon initial connect or auto-reconnect
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            this.client.connectHeaders = {
              Authorization: `Bearer ${currentToken}`,
            };
          }
        },
        onConnect: () => {
          this.connected = true;
          this.connectionPromise = null;

          // Re-subscribe all active group topics upon connection / re-connection
          this.resubscribeAll();
          resolve(this.client);
        },
        onStompError: (frame) => {
          console.error('STOMP Protocol Error:', frame.headers['message'], frame.body);
          this.connected = false;
        },
        onWebSocketClose: () => {
          this.connected = false;
        },
        onDisconnect: () => {
          this.connected = false;
          this.activeStompSubs.clear();
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  /**
   * Subscribes to /topic/groups/{groupId}.
   * Automatically connects the STOMP client if not already active.
   *
   * @param {number|string} groupId
   * @param {function(object): void} onMessageReceived
   * @returns {function(): void} Unsubscribe function
   */
  subscribeToGroup(groupId, onMessageReceived) {
    const key = String(groupId);

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key).add(onMessageReceived);

    // If client is already connected, register subscription immediately
    if (this.connected && this.client && this.client.connected) {
      this.ensureStompSubscription(key);
    } else {
      // Trigger connection and let onConnect handle subscription
      this.connect().catch((err) => {
        console.warn('WebSocket connect deferred:', err.message);
      });
    }

    // Return cleanup / unsubscribe handle
    return () => {
      const handlers = this.subscriptions.get(key);
      if (handlers) {
        handlers.delete(onMessageReceived);
        if (handlers.size === 0) {
          this.subscriptions.delete(key);
          const sub = this.activeStompSubs.get(key);
          if (sub) {
            try {
              sub.unsubscribe();
            } catch (err) {
              console.warn('Error unsubscribing from group topic:', err);
            }
            this.activeStompSubs.delete(key);
          }
        }
      }
    };
  }

  /**
   * Subscribes to /topic/trips/{tripId}.
   * Automatically connects the STOMP client if not already active.
   *
   * @param {number|string} tripId
   * @param {function(object): void} onMessageReceived
   * @returns {function(): void} Unsubscribe function
   */
  subscribeToTrip(tripId, onMessageReceived) {
    const key = `trip_${tripId}`;

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key).add(onMessageReceived);

    if (this.connected && this.client && this.client.connected) {
      this.ensureStompSubscription(key);
    } else {
      this.connect().catch((err) => {
        console.warn('WebSocket connect deferred:', err.message);
      });
    }

    return () => {
      const handlers = this.subscriptions.get(key);
      if (handlers) {
        handlers.delete(onMessageReceived);
        if (handlers.size === 0) {
          this.subscriptions.delete(key);
          const sub = this.activeStompSubs.get(key);
          if (sub) {
            try {
              sub.unsubscribe();
            } catch (err) {
              console.warn('Error unsubscribing from trip topic:', err);
            }
            this.activeStompSubs.delete(key);
          }
        }
      }
    };
  }

  ensureStompSubscription(groupIdKey) {
    if (this.activeStompSubs.has(groupIdKey)) {
      return;
    }

    if (!this.client || !this.client.connected) {
      return;
    }

    const destination = groupIdKey.startsWith('trip_')
      ? `/topic/trips/${groupIdKey.replace('trip_', '')}`
      : `/topic/groups/${groupIdKey}`;
    try {
      const stompSub = this.client.subscribe(destination, (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          const handlers = this.subscriptions.get(groupIdKey);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(payload);
              } catch (e) {
                console.error('Error in group message handler:', e);
              }
            });
          }
        } catch (parseErr) {
          console.error('Failed to parse STOMP message body:', parseErr, frame.body);
        }
      });

      this.activeStompSubs.set(groupIdKey, stompSub);
    } catch (subErr) {
      console.error(`Failed to subscribe to ${destination}:`, subErr);
    }
  }

  resubscribeAll() {
    this.activeStompSubs.clear();
    for (const groupIdKey of this.subscriptions.keys()) {
      this.ensureStompSubscription(groupIdKey);
    }
  }

  /**
   * Publishes a message to /app/groups/{groupId}/send.
   *
   * @param {number|string} groupId
   * @param {string} content
   * @returns {boolean} True if published via STOMP, false if not connected
   */
  sendMessage(groupId, content) {
    if (!this.client || !this.client.connected) {
      return false;
    }

    try {
      this.client.publish({
        destination: `/app/groups/${groupId}/send`,
        body: JSON.stringify({ content }),
      });
      return true;
    } catch (err) {
      console.error('Failed to publish STOMP message:', err);
      return false;
    }
  }

  /**
   * Disconnects the STOMP client and clears all subscriptions.
   */
  disconnect() {
    this.subscriptions.clear();
    this.activeStompSubs.clear();
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (err) {
        console.warn('Error deactivating STOMP client:', err);
      }
      this.client = null;
    }
    this.connected = false;
    this.connectionPromise = null;
  }

  isConnected() {
    return this.connected && this.client && this.client.connected;
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export { websocketService };
export default websocketService;
