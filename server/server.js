//doesn't appear that this file is causing bugs  
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data, isBinary) => {// could remove isBinary and just do data.toString() directly? J 
    const message = isBinary ? data.toString() : String(data); // normalize our message to a String //J question: do we expect binary files?
    try {
      console.log('received:', message);
      console.log('JSON parsed msg:', JSON.parse(message));
    } catch {
      console.log('unable to JSON parse message. Message in string format is:', message.toString());
    }
    ws.send(`Echo: ${message}`); // Send a message back to the client //J Question: Test? do we need this in production with real data?

    // I think we need to send to other clients? the above line only sends the message back to the same client apparently?
    for (const client of wss.clients) {
      // we're just checking that client !== ws, but we ws.send anyways earlier... what does that mean? Also where does ws.send(echo message) go?
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // why were we not getting here before but we are now ...?
        client.send(message); // parse on receive I think
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

console.log('WebSocket server started on port 8080');
