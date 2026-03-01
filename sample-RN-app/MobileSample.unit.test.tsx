/**
 * MobileSample.unit.test.tsx
 *
 * Unit tests for MobileSample.tsx using React Testing Library.
 *
 * RTL replaces the deprecated react-test-renderer. Since react-native
 * primitives are shimmed to DOM-compatible elements, @testing-library/react
 * renders the component tree against a real jsdom without a Babel transform
 * or native runtime. The per-file directive below sets the Vitest environment
 * to jsdom for this file only — the integration test stays in 'node'.
 *
 * Mocking strategy (unchanged from previous version):
 * - Global WebSocket replaced with a vi.fn() factory (controllable mock socket)
 * - './wsConfig' returns a fixed URL — no env/Expo/Platform resolution
 * - 'react-native' primitives shimmed to DOM-compatible elements
 * - './useFiberTree' stubbed as no-ops
 *
 * Key RTL improvements over react-test-renderer:
 * - render() / screen / fireEvent replace renderer.create() / tree.root.findAll()
 * - Buttons found by accessible role + name, not by internal tree type
 * - unmount() is provided by render() return value — no renderer reference needed
 *
 * Setup required (add to sample-RN-app/package.json devDependencies):
 *   "vitest": "^3.x"
 *   "@testing-library/react": "^16.x"
 *   "jsdom": "^26.x"
 * And create sample-RN-app/vitest.config.ts with { test: { environment: 'node' } }.
 * The environment is set to jsdom via environmentMatchGlobs in vitest.config.ts.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

// ── Mock './wsConfig' — fixed URL, no env or platform resolution ─────────────
vi.mock('./wsConfig', () => ({ WS_URL: 'ws://localhost:8080' }));

// ── Mock './useFiberTree' — DevTools traversal is out of test scope ──────────
vi.mock('./useFiberTree', () => ({
  logFiber: vi.fn(),
  traverse: vi.fn(),
}));

// ── Mock 'react-native' — shim primitives to DOM-compatible elements ─────────
// View → div, Text → span, Pressable → button.
// RTL queries by accessible role/name against this DOM tree.
vi.mock('react-native', () => ({
  View: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', null, children),
  Pressable: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => React.createElement('button', { onClick: onPress }, children),
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) =>
    React.createElement('button', { onClick: onPress }, title),
  StyleSheet: { create: <T extends object>(s: T): T => s },
}));

// ── Mock global WebSocket ────────────────────────────────────────────────────
type MockSocket = {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  onopen: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  onclose: (() => void) | null;
  onmessage: ((e: unknown) => void) | null;
};

let mockSocket: MockSocket;

// Must be a regular function (not arrow) — Vitest v4 calls the implementation
// with `new` when the mock itself is called with `new WebSocket(...)`.
// Arrow functions are not constructable and would throw "is not a constructor".
const MockWebSocket = vi.fn().mockImplementation(function MockWS() {
  mockSocket = {
    send:       vi.fn(),
    close:      vi.fn(),
    readyState: 1,   // WebSocket.OPEN — default so emit() works out of the box
    onopen:     null,
    onerror:    null,
    onclose:    null,
    onmessage:  null,
  };
  return mockSocket;
});

// Static constant the component reads: socket.readyState === WebSocket.OPEN
(MockWebSocket as unknown as Record<string, number>).OPEN = 1;

vi.stubGlobal('WebSocket', MockWebSocket);

// ── Import component AFTER all mocks are registered ─────────────────────────
import App from './MobileSample';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trigger socket.onopen and flush React state updates. */
function triggerOpen(): void {
  act(() => { mockSocket.onopen?.(); });
}

/** Parse the JSON payload from the most recent socket.send() call. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastSentPayload(): any {
  const calls = mockSocket.send.mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
}

// ════════════════════════════════════════════════════════════════════════════
// UNIT TESTS
// ════════════════════════════════════════════════════════════════════════════

describe('MobileSample (unit)', () => {
  beforeEach(() => {
    MockWebSocket.mockClear();
  });

  afterEach(() => {
    // Explicitly unmount all rendered components so the jsdom body is clean
    // between tests. RTL's auto-cleanup doesn't fire reliably in Vitest v4
    // projects mode, so accumulated renders would cause "Found multiple elements"
    // errors on subsequent getByRole queries.
    cleanup();
    vi.clearAllMocks();
  });

  // 1 ─────────────────────────────────────────────────────────────────────────
  it('opens a WebSocket connection to WS_URL on mount', () => {
    render(<App />);

    expect(MockWebSocket).toHaveBeenCalledOnce();
    expect(MockWebSocket).toHaveBeenCalledWith('ws://localhost:8080');
  });

  // 2 ─────────────────────────────────────────────────────────────────────────
  it('sends the initial state payload (count=0, letter=a) when the socket opens', () => {
    render(<App />);
    triggerOpen();

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const msg = lastSentPayload();
    expect(msg.channel).toBe('snapshot');
    expect(msg.type).toBe('add');
    expect(msg.payload.count).toBe(0);
    expect(msg.payload.letter).toBe('a');
    expect(typeof msg.payload.timestamp).toBe('string');
  });

  // 3 ─────────────────────────────────────────────────────────────────────────
  it('sends count=1 and letter=a after the +1 button is pressed', () => {
    render(<App />);
    triggerOpen();
    mockSocket.send.mockClear(); // ignore the onopen send

    fireEvent.click(screen.getByRole('button', { name: '+1' }));

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const msg = lastSentPayload();
    expect(msg.channel).toBe('snapshot');
    expect(msg.type).toBe('add');
    expect(msg.payload.count).toBe(1);
    expect(msg.payload.letter).toBe('a');
  });

  // 4 ─────────────────────────────────────────────────────────────────────────
  it('sends count=0 and letter=b after the next letter button is pressed', () => {
    render(<App />);
    triggerOpen();
    mockSocket.send.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'next letter' }));

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const msg = lastSentPayload();
    expect(msg.channel).toBe('snapshot');
    expect(msg.type).toBe('add');
    expect(msg.payload.count).toBe(0);
    expect(msg.payload.letter).toBe('b');
  });

  // 5 ─────────────────────────────────────────────────────────────────────────
  it('does NOT call send() via emit() when socket readyState is not OPEN', () => {
    render(<App />);
    mockSocket.readyState = 0; // WebSocket.CONNECTING — do not trigger onopen

    fireEvent.click(screen.getByRole('button', { name: '+1' }));

    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  // 6 ─────────────────────────────────────────────────────────────────────────
  it('closes the WebSocket when the component unmounts', () => {
    const { unmount } = render(<App />);
    act(() => { unmount(); });

    expect(mockSocket.close).toHaveBeenCalledOnce();
  });

  // 7 ─────────────────────────────────────────────────────────────────────────
  it('does not crash when socket.onerror fires', () => {
    render(<App />);

    expect(() => {
      act(() => { mockSocket.onerror?.(new Event('error')); });
    }).not.toThrow();
  });
});
