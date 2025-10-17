//access React DevTools global hook and invoke parseFiber

export function getHooksStateAndUpdateMethod(memoizedState: any) {
  const hooksStates = [];
  while (memoizedState) {
    if (memoizedState.queue) {
      // Check if this is a reducer hook by looking at the lastRenderedReducer
      const isReducer = memoizedState.queue.lastRenderedReducer?.name !== 'basicStateReducer';

      if (isReducer) {
        // For useReducer hooks, we want to store:
        // 1. The current state
        // 2. The last action that was dispatched (if available)
        // 3. The reducer function itself
        hooksStates.push({
          component: memoizedState.queue,
          state: memoizedState.memoizedState,
          isReducer: true,
          lastAction: memoizedState.queue.lastRenderedAction || null,
          reducer: memoizedState.queue.lastRenderedReducer || null,
        });
      } else {
        // Regular useState hook
        hooksStates.push({
          component: memoizedState.queue,
          state: memoizedState.memoizedState,
          isReducer: false,
        });
      }
    }
    memoizedState = memoizedState.next;
  }
  return hooksStates;
}

export function safeValue(v: unknown): unknown {
  if (typeof v === 'function') return '[fn]';
  if (
    v &&
    typeof v === 'object' &&
    '_value' in v && // <- Reanimated shared value guard
    'addListener' in v
  )
    return '[sharedValue]';
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return '[unserialisable]';
  }
}

export function logFiber(node: any): void {
  if (!node) return;

  const tag = node.tag; // 0,1,2,10…
  if (tag === 0 || tag === 1 || tag === 2 || tag === 10) {
    const name = node.elementType?.name || node.elementType?._context?.displayName || 'anonymous';

    const hooks = getHooksStateAndUpdateMethod(node.memoizedState).map(({ state }) => safeValue(state));

    if (hooks.length) {
      console.log(name, '→', hooks);
    }
  }

  logFiber(node.child);
  logFiber(node.sibling);
}

// We should also probably future proof this map in case React adds or adjusts any of these components.
// Or maybe we can just import the tag map? Currently located in: react/packages/react-reconciler/src/ReactWorkTags.js
// Although any kind of logic besides just displaying the name of the tag--
// will probably have to be rewritten to accomodate any changes in the work tags.

// Reactime v26 has the types in backendTypes.ts. Maybe we should use a .d.ts file?
const fiberTagMap: Record<number, string> = {
  0: 'FunctionComponent',
  1: 'ClassComponent',
  // recent React code has depreciated/refactored IndeterminateComponent, but it still exists internally in Fiber
  // it indicates React hasn't figured out yet if the component is a function or a class until it's rendered
  // This occurs early in the render phase before the component type is resolved
  // Used during lazy reconciliation for lazy/unkown components (a transitional state)
  2: 'IndeterminateComponent', // from renderer.js, it was removed in 19.0.0
  // (Host refers to native/built-in items)
  3: 'HostRoot', // Root of a host tree. Could be nested inside another node.
  4: 'HostPortal', // A subtree. Could be an entry point to a different renderer.
  5: 'HostComponent',
  6: 'HostText',
  7: 'Fragment',
  8: 'Mode',
  9: 'ContextConsumer',
  10: 'ContextProvider',
  11: 'ForwardRef',
  12: 'Profiler',
  13: 'SuspenseComponent',
  14: 'MemoComponent',
  15: 'SimpleMemoComponent',
  16: 'LazyComponent',
  17: 'IncompleteClassComponent',
  18: 'DehydratedFragment', // from react/.../fiber/renderer.js : Behind a flag. (also it's named Dehydrated Suspense component)
  // not sure where our master list should come from. the WorkTags or from the renderer.js.
  // Maybe there's only a discrepency in the tags that aren't used/don't matter
  19: 'SuspenseListComponent',
  20: 'FundamentalComponent THIS TYPE OF COMPONENT WAS REMOVED IN 2021-2022',
  21: 'ScopeComponent',
  22: 'OffscreenComponent',
  23: 'LegacyHiddenComponent',
  24: 'CacheComponent',
  25: 'TracingMarkerComponent',
  26: 'HostHoistable',
  27: 'HostSingleton',
  28: 'IncompleteFunctionComponent',
  29: 'Throw',
  30: 'ViewTransitionComponent',
  31: 'ActivityComponent',
};

// traverse the Fiber tree recursively. (DFS traversal--also how Fiber does it)
export function traverse(fiber: any) {
  if (!fiber) return;

  const typeName = fiber.type?.name ?? fiber.elementType?.name ?? fiber.type?.displayName ?? 'Unknown';
  const tagName = fiberTagMap[fiber.tag] ?? `UnknownTag(${fiber.tag})`;
  let memoizedStateKeys;
  if (fiber.memoizedState) {
    memoizedStateKeys = Object.keys(fiber.memoizedState);
  } else {
    // memoizedStateKeys = 'is null';
  }

  // okay Reactime 26 takes: FunctionComponent, ClassComponent, IndeterminateComponent, ContextProvider
  // from those tags, they take: memoizedState, elementType.toString()
  // from memoizedState see line 67 in RT26/../controllers/statePropExtractors
  // checks memoizedState.queue and loops (I think line 71 and 72 can just be combined)
  // if it's useReducer, handle differently. (for RT Native let's focus on the regular useState hook at first)
  // else it's useState:
  //    hooksStates.push({
  //      component: memoizedState.queue,
  //      state: memoizedState.memoizedState,   <- why is it memoizedState.memoizedState?
  //      isReducer: false,
  //    });
  if (
    tagName === 'FunctionComponent' ||
    tagName === 'ClassComponent' ||
    tagName === 'IndeterminateComponent' ||
    tagName === 'ContextProvider'
  ) {
    console.log(`[${typeName}] tag=${tagName} key=${fiber.key} memoizedState keys: ${memoizedStateKeys}`);
    if (fiber.memoizedState) {
      // print info for queue
      console.log('🦆 memoizedState.queue: ' + fiber.memoizedState?.queue);
      if (fiber.memoizedState?.queue && typeof fiber.memoizedState?.queue === 'object') {
        console.log('🦆🔑 queue object keys: ' + Object.keys(fiber.memoizedState?.queue));
      }
      // print info for nested memoizedState
      console.log('📜 memoizedState.memoizedState: ' + fiber.memoizedState?.memoizedState);
      if (fiber.memoizedState?.memoizedState && typeof fiber.memoizedState?.memoizedState === 'object') {
        console.log('📜🔑 nested memoizedStateKeys: ' + Object.keys(fiber.memoizedState?.memoizedState));
      }
      // if (fiber.memoizedState?.memoizedState?._value) {
      //   console.log('💙 fiber.memoizedState?.memoizedState._value');
      // }
    }
  } else {
    //console.log(`[${typeName}] tag=${tagName} key=${fiber.key}`);
  }

  traverse(fiber.child);
  traverse(fiber.sibling);
}
