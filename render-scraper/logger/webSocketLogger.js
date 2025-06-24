// File: logger/webSocketLogger.js

import WebSocket, { WebSocketServer } from 'ws';

let clients = new Set();

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established' }));

    ws.on('close', () => clients.delete(ws));
  });
}

export function logToClients(data) {
  const message = JSON.stringify({ type: 'log', ...data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Usage:
// logToClients({ source: 'genius', message: 'Scrape started', level: 'info' });