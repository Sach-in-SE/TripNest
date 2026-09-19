import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@stomp/stompjs';
import { websocketService } from './websocketService';

// Mock @stomp/stompjs Client
vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation(function (config) {
      this.config = config;
      this.active = false;
      this.connected = false;
      this.activate = vi.fn().mockImplementation(() => {
        this.active = true;
        this.connected = true;
        if (config.onConnect) config.onConnect();
      });
      this.deactivate = vi.fn().mockImplementation(() => {
        this.active = false;
        this.connected = false;
        if (config.onDisconnect) config.onDisconnect();
      });
      this.subscribe = vi.fn((destination, callback) => ({
        id: 'sub-test-id',
        destination,
        callback,
        unsubscribe: vi.fn(),
      }));
      this.publish = vi.fn();
    }),
  };
});

describe('websocketService', () => {
  beforeEach(() => {
    localStorage.clear();
    websocketService.disconnect();
    vi.clearAllMocks();
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  it('rejects connection if no token is available in localStorage', async () => {
    await expect(websocketService.connect()).rejects.toThrow('No authentication token available');
  });

  it('creates STOMP client with Bearer token and activates connection', async () => {
    localStorage.setItem('token', 'valid-ws-token-123');

    const client = await websocketService.connect();
    expect(client).toBeDefined();
    expect(websocketService.isConnected()).toBe(true);
    expect(Client).toHaveBeenCalled();
  });

  it('subscribes to group topic and dispatches incoming messages to callback', async () => {
    localStorage.setItem('token', 'valid-ws-token-123');
    const messageHandler = vi.fn();

    const unsubscribe = websocketService.subscribeToGroup(42, messageHandler);
    await websocketService.connect();

    expect(websocketService.client.subscribe).toHaveBeenCalledWith(
      '/topic/groups/42',
      expect.any(Function)
    );

    // Simulate incoming STOMP frame
    const subscribeCall = websocketService.client.subscribe.mock.calls.find(
      (call) => call[0] === '/topic/groups/42'
    );
    expect(subscribeCall).toBeDefined();

    const frameCallback = subscribeCall[1];
    frameCallback({
      body: JSON.stringify({ id: 1, content: 'Hello Alps!', senderUsername: 'alice' }),
    });

    expect(messageHandler).toHaveBeenCalledWith({
      id: 1,
      content: 'Hello Alps!',
      senderUsername: 'alice',
    });

    // Unsubscribe cleans up
    unsubscribe();
  });

  it('publishes messages to destination /app/groups/{id}/send when connected', async () => {
    localStorage.setItem('token', 'valid-ws-token-123');
    await websocketService.connect();

    const published = websocketService.sendMessage(42, 'Trail map ready');
    expect(published).toBe(true);
    expect(websocketService.client.publish).toHaveBeenCalledWith({
      destination: '/app/groups/42/send',
      body: JSON.stringify({ content: 'Trail map ready' }),
    });
  });

  it('returns false when trying to publish while disconnected', () => {
    const published = websocketService.sendMessage(42, 'Lost in offline');
    expect(published).toBe(false);
  });

  it('cleans up subscriptions and deactivates client on disconnect', async () => {
    localStorage.setItem('token', 'valid-ws-token-123');
    await websocketService.connect();

    const client = websocketService.client;
    websocketService.disconnect();

    expect(client.deactivate).toHaveBeenCalled();
    expect(websocketService.isConnected()).toBe(false);
    expect(websocketService.client).toBeNull();
  });
});
