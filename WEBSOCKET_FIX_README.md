# Reactime Native - WebSocket Connection Fix

## The Problem

Everyone was getting different WebSocket errors because:
1. The browser debugger UI was hardcoded to `ws://localhost:8080`
2. The React Native app was hardcoded to Will's IP (`10.0.0.157`)

`localhost` means different things in different contexts:
- On your laptop browser → your laptop ✅
- On an iOS simulator → your laptop ✅  
- On an Android emulator → the emulator itself ❌ (use `10.0.2.2` for host)
- On a physical phone → the phone itself ❌

## The Solution

### Quick Start (Same Machine)

If you're running everything on one machine:

```bash
# Terminal 1: Start the WebSocket server
cd server && node server.js

# Terminal 2: Start the React Native app
cd sample-RN-app && npx expo start

# Terminal 3: Start the debugger UI
cd client && npm run dev
```

The debugger will connect to `ws://localhost:8080` automatically.

### Team Setup (Different Machines / Physical Devices)

#### Step 1: Find the server host's IP

On the machine running `server.js`:

```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr /i "IPv4"
```

Look for something like `192.168.1.xxx` or `10.0.0.xxx`.

#### Step 2: Start the server

```bash
cd server && node server.js
# Output: [server] Reactime Native WebSocket server started on port 8080
```

#### Step 3: Connect the React Native app

The app now tries to auto-detect the dev server IP from Expo. If that fails:

```bash
# Option A: Set environment variable
EXPO_PUBLIC_WS_HOST=192.168.1.100 npx expo start

# Option B: Edit the fallback in MobileSample.tsx (line ~45)
return '192.168.1.100';  // Your server's IP
```

#### Step 4: Connect the debugger UI

```bash
# Option A: Environment variable
VITE_WS_URL=ws://192.168.1.100:8080 npm run dev

# Option B: Create .env.local file in client/
echo "VITE_WS_URL=ws://192.168.1.100:8080" > .env.local
npm run dev
```

### Using ngrok (Easiest for Team)

For the smoothest team experience, use ngrok to expose the WebSocket server:

```bash
# Terminal 1: Start server
cd server && node server.js

# Terminal 2: Expose via ngrok
ngrok tcp 8080
# Note the forwarding URL, e.g., tcp://0.tcp.ngrok.io:12345
```

Then everyone uses the ngrok URL:
- RN app: Update `getDevHost()` to return `'0.tcp.ngrok.io'` with port `12345`
- Debugger: `VITE_WS_URL=ws://0.tcp.ngrok.io:12345 npm run dev`

## Verifying Connection

### Server logs should show:
```
[server] Client connected from ::ffff:192.168.1.50
[server] Total clients: 1
[server] Client registered as: agent
[server] Client connected from ::ffff:192.168.1.51
[server] Total clients: 2
[server] Client registered as: debugger
```

### React Native app shows:
- Green dot + "open → 192.168.1.100:8080" in the status bar

### Debugger UI shows:
- "WS: ws://192.168.1.100:8080" in bottom-right corner (dev mode)
- Console: `[ws] OPEN` and `[ws] Server says: Connected to Reactime Native relay server`

## Message Protocol

All messages now follow this structure:

```typescript
{
  type: 'snapshot' | 'metrics' | 'register' | 'connected',
  source: 'agent' | 'debugger' | 'server',
  payload?: any,
  timestamp: string  // ISO 8601
}
```

For backwards compatibility, the server and client still handle raw objects without `type` as snapshots.

## Troubleshooting

### "WebSocket connection failed"
- Is the server running? Check for `[server] Reactime Native WebSocket server started`
- Is the IP correct? The status bar in the RN app shows what it's trying to connect to
- Firewall blocking port 8080? Try `telnet <ip> 8080` from another machine

### "Connected but no data flowing"
- Check server logs for `[server] Message from agent:`
- Verify both clients show as registered in server logs
- Press buttons in the RN app and watch server output

### iOS Simulator works but physical device doesn't
- Physical devices can't use `localhost` - must use actual IP
- Make sure phone is on same WiFi network as server

### Android Emulator issues
- Android emulator uses `10.0.2.2` to reach host machine
- Or use ngrok/actual network IP

## Files Changed

- `client/src/config/wsConfig.ts` - New config module for WS URL
- `client/src/App.tsx` - Uses config instead of hardcoded URL
- `client/src/transport/socket.ts` - Added reconnection, status tracking, message types
- `client/src/transport/wsActions.ts` - Added `wsConnectionStatusChanged` action
- `server/server.js` - Added client registration, cleaner logging, removed echo
- `sample-RN-app/MobileSample.tsx` - Better IP detection, status UI, reconnection
