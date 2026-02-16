const WebSocket = require('ws');

const wss = new WebSocket.Server({ 
  port: 8080,
  host: '0.0.0.0' // Listen on all network interfaces
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data, isBinary) => {
    const message = isBinary ? data.toString() : String(data); // normalize our message to a String
    try {
      const parsedMessage = JSON.parse(message);
      console.log('received:', parsedMessage);

      //Broadcast the message to all other clients
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message); // send the parsed message to other clients
        }
      }

    } catch (err) {
      console.error('Error parsing message:', err);
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
