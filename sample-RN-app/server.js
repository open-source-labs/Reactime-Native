const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('🎉 client connected');

  ws.on('message', (msg) => {
    try {
      console.log('📥', JSON.parse(msg));
    } catch {
      console.log('📥 (non-JSON)', msg.toString());
    }
  });

  ws.on('close', () => console.log('👋 client disconnected'));
  ws.on('error', (err) => console.error('WebSocket error:', err));
});

console.log('🛟 listening on ws://localhost:8080');
