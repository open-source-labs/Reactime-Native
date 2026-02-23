const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
  host: '0.0.0.0' // Listen on all network interfaces
});

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
        // Single client debug mode — echo back to sender
        if (wss.clients.size === 1) {
          ws.send(JSON.stringify(parsed));
          console.log('Sent back to sender (single client debug mode)');
        } else {
          // Multiple clients — broadcast to others
          for (const client of wss.clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsed));
              console.log('Forwarded message to client');
            }
          }
        }
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

console.log('WebSocket server started on port 8080 (all interfaces)');
