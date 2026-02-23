/**
 * MobileSample.unit.test.tsx
 *
 * Unit tests for MobileSample.tsx — the React Native component that opens a
 * WebSocket connection and emits state changes (count, letter) to the server.
 *
 * Strategy:
 * - Global WebSocket is replaced with a vi.fn() factory that returns a
 *   controllable mock socket; onopen/onerror/onclose are assignable properties.
 * - './wsConfig' is mocked to return a fixed URL so no env/Expo/Platform
 *   resolution runs during the test.
 * - 'react-native' primitives are shimmed to DOM-compatible elements so the
 *   component renders without a native runtime.
 * - './useFiberTree' is stubbed as no-ops (DevTools traversal is out of scope).
 * - react-test-renderer + act() are used for rendering and interaction.
 *
 * Setup required (add to sample-RN-app/package.json devDependencies):
 *   "vitest": "^3.x"
 *   "react-test-renderer": "<same version as react>"
 *   "@types/react-test-renderer": "<same version as react>"
 * And create sample-RN-app/vitest.config.ts with { test: { environment: 'node' } }.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import renderer from 'react-test-renderer';

// ── Mock './wsConfig' — fixed URL, no env or platform resolution ─────────────
vi.mock('./wsConfig', () => ({ WS_URL: 'ws://localhost:8080' }));

// ── Mock './useFiberTree' — DevTools traversal is out of test scope ──────────
vi.mock('./useFiberTree', () => ({
  logFiber: vi.fn(),
  traverse: vi.fn(),
}));

// ── Mock 'react-native' — shim primitives to DOM-compatible elements ─────────
// This lets react-test-renderer render the component tree in Node without a
// native runtime. The shimmed types match the component's import surface.
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
// Each test gets a fresh mock socket via the factory. Properties are set to
// null so the component can assign its own handlers (onopen, onerror, etc.)
// and the test can trigger them explicitly.

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

const MockWebSocket = vi.fn().mockImplementation(() => {
  mockSocket = {
    send:        vi.fn(),
    close:       vi.fn(),
    readyState:  1,   // WebSocket.OPEN — default so emit() works out of the box
    onopen:      null,
    onerror:     null,
    onclose:     null,
    onmessage:   null,
  };
  return mockSocket;
});

// Static constant the component reads: socket.readyState === WebSocket.OPEN
(MockWebSocket as unknown as Record<string, number>).OPEN = 1;

vi.stubGlobal('WebSocket', MockWebSocket);

// ── Import component AFTER all mocks are registered ─────────────────────────
import App from './MobileSample';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render the App component synchronously inside act(). */
function renderApp(): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(React.createElement(App));
  });
  return tree;
}

/** Trigger socket.onopen and flush React state updates. */
function triggerOpen(): void {
  act(() => { mockSocket.onopen?.(); });
}

/** Parse the JSON payload from the most recent socket.send() call. */
function lastSentPayload(): Record<string, unknown> {
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
    vi.clearAllMocks();
  });

  // 1 ─────────────────────────────────────────────────────────────────────────
  it('opens a WebSocket connection to WS_URL on mount', () => {
    renderApp();

    expect(MockWebSocket).toHaveBeenCalledOnce();
    expect(MockWebSocket).toHaveBeenCalledWith('ws://localhost:8080');
  });

  // 2 ─────────────────────────────────────────────────────────────────────────
  it('sends the initial state payload (count=0, letter=a) when the socket opens', () => {
    renderApp();
    triggerOpen();

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const payload = lastSentPayload();
    expect(payload.count).toBe(0);
    expect(payload.letter).toBe('a');
    expect(typeof payload.timestamp).toBe('string');
  });

  // 3 ─────────────────────────────────────────────────────────────────────────
  it('sends count=1 and letter=a after the +1 button is pressed', () => {
    const tree = renderApp();
    triggerOpen();
    mockSocket.send.mockClear(); // ignore the onopen send

    // Rendered tree (after react-native mocks): div > button(+1), button(next letter)
    const buttons = tree.root.findAll((n) => n.type === 'button');
    act(() => { buttons[0].props.onClick(); }); // +1 Pressable

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const payload = lastSentPayload();
    expect(payload.count).toBe(1);
    expect(payload.letter).toBe('a');
  });

  // 4 ─────────────────────────────────────────────────────────────────────────
  it('sends count=0 and letter=b after the next letter button is pressed', () => {
    const tree = renderApp();
    triggerOpen();
    mockSocket.send.mockClear();

    const buttons = tree.root.findAll((n) => n.type === 'button');
    act(() => { buttons[1].props.onClick(); }); // next letter Pressable

    expect(mockSocket.send).toHaveBeenCalledOnce();
    const payload = lastSentPayload();
    expect(payload.count).toBe(0);
    expect(payload.letter).toBe('b');
  });

  // 5 ─────────────────────────────────────────────────────────────────────────
  it('does NOT call send() via emit() when socket readyState is not OPEN', () => {
    const tree = renderApp();
    // Set readyState to CONNECTING before any button interaction.
    // Do not trigger onopen so no send() happens in that path either.
    mockSocket.readyState = 0; // WebSocket.CONNECTING

    const buttons = tree.root.findAll((n) => n.type === 'button');
    act(() => { buttons[0].props.onClick(); });

    // send() was never called — neither onopen (not triggered) nor emit()
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  // 6 ─────────────────────────────────────────────────────────────────────────
  it('closes the WebSocket when the component unmounts', () => {
    const tree = renderApp();
    act(() => { tree.unmount(); });

    expect(mockSocket.close).toHaveBeenCalledOnce();
  });

  // 7 ─────────────────────────────────────────────────────────────────────────
  it('does not crash when socket.onerror fires', () => {
    renderApp();

    expect(() => {
      act(() => { mockSocket.onerror?.(new Event('error')); });
    }).not.toThrow();
  });
});
