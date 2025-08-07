const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080});

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    console.log('received: ', message);
    ws.send(`Echo: ${message}`); // Send a message back to the client
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', err => {
    console.error('WebSocket error:', err);
  });
});

console.log('WebSocket server started on port 8080');