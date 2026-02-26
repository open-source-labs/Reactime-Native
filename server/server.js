const WebSocket = require('ws');

/**
 * Broadcast a parsed message to the appropriate recipient(s).
 *
 * Routing rules:
 *   - Single client connected → echo back to sender (local debug mode)
 *   - Multiple clients connected → forward to every OPEN client except the sender
 *
 * @param {import('ws').WebSocketServer} wss  - The server instance (used for clients set)
 * @param {import('ws').WebSocket}       senderWs - The originating client
 * @param {unknown}                      parsed   - Already-parsed message object
 */
function broadcast(wss, senderWs, parsed) {
  if (wss.clients.size === 1) {
    senderWs.send(JSON.stringify(parsed));
    console.log('Sent back to sender (single client debug mode)');
  } else {
    for (const client of wss.clients) {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsed));
        console.log('Forwarded message to client');
      }
    }
  }
}

/**
 * Creates and returns a configured WebSocket server without blocking import.
 * Separating construction from the module-level side-effect lets tests spin up
 * the server on an isolated port without touching port 8080.
 *
 * @param {number} [port=8080]
 * @param {string} [host='0.0.0.0']
 * @returns {import('ws').WebSocketServer}
 */
function createServer(port = 8080, host = '0.0.0.0') {
  const wss = new WebSocket.Server({ port, host });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data, isBinary) => {
      const message = isBinary ? data.toString() : String(data);
      try {
        console.log('received:', message);
        const parsed = JSON.parse(message);
        console.log('JSON parsed msg:', parsed);

        // Handle control channel ping/pong
        if (parsed.channel === 'control' && parsed.type === 'ping') {
          ws.send(JSON.stringify({ channel: 'control', type: 'pong' }));
          console.log('Sent pong response');
        } else {
          broadcast(wss, ws, parsed);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
        ws.send(JSON.stringify({
          channel: 'control',
          type: 'error',
          payload: { message: 'Failed to parse JSON', raw: message }
        }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  return wss;
}

// Auto-start only when this file is executed directly (not required/imported)
if (require.main === module) {
  createServer(8080, '0.0.0.0');
  console.log('WebSocket server started on port 8080 (all interfaces)');
}

module.exports = { broadcast, createServer };
