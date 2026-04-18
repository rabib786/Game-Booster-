## 2024-04-06 - Implement Profile & Config Logic

- Created a persistent JSON config file to manage boost profiles (Aggressive, Conservative, Custom).
- Added backend tracking for killed processes using `subprocess.Popen` arguments to enable restart via undo boost functionality.
- Converted repetitive array loops for `liveProcesses` cross-referencing into O(1) set operations when checking whitelist inclusion before kills.
- Stored full executable paths when killing processes to reliably support reversing targeted kills.
\n## 2024-04-06 - Anti-Pattern: Inline IIFEs for Optimizations\n**Learning:** When trying to prevent O(N²) bottlenecks in React lists, directly embedding `new Set()` and `.filter()` lookups inside the JSX using an inline IIFE is an unidiomatic anti-pattern that actually creates a new bottleneck because it causes the Set to be recreated multiple times per render cycle.\n**Action:** Always extract heavy derivations (like mapping selected IDs to a Set or filtering arrays) into top-level `useMemo` blocks to ensure they are computed exactly once per relevant state change, preserving both performance and code readability.

## 2024-04-07 - Caching NVML Device Handles
**Learning:** When retrieving telemetry via `pynvml` at high frequency (e.g., 1000ms polling), repeatedly calling C-level driver binding functions like `pynvml.nvmlDeviceGetHandleByIndex(0)` introduces measurable CPU overhead on the hot path, despite retrieving a static value.
**Action:** Cache static device handles or invariant driver resources at the global module level to eliminate redundant system or C-level calls from active polling loops.
## 2024-04-08 - O(N) System Call Bottleneck in psutil Loops
**Learning:** Calling OS-dependent functions like `proc.memory_info()` individually inside a `psutil.process_iter()` loop executes a discrete, expensive system call per process, creating a severe N+1 performance bottleneck during system-wide scans.
**Action:** Always specify the required attributes directly in the `process_iter` call (e.g., `psutil.process_iter(['pid', 'name', 'memory_info'])`). This allows `psutil` to bulk-fetch the data using optimized, batched internal C/OS-level calls, retrieving it later from the pre-populated `proc.info` dictionary.
## 2024-04-09 - Memoizing Append-Only Logs
**Learning:** When rendering append-only lists or logs (like system consoles) that grow indefinitely, extracting them into a separate `React.memo()` component is critical. Otherwise, unrelated, high-frequency global state updates (e.g., text inputs) will trigger expensive O(N) recalculations across the array on every render.
**Action:** Extract growing log arrays into a dedicated `React.memo` component to isolate render loops.
## 2024-04-12 - Virtualization with react-window Grid
**Learning:** When using `react-window` to virtualize grids, the API for `FixedSizeGrid` does not accept `cellComponent` props (unlike some other virtualization libraries). Attempting to use them will cause React runtime crashes or TypeScript errors.
**Action:** Always pass the custom cell renderer as the child of the `Grid` component (e.g., `<Grid>{Cell}</Grid>`), and pass all dynamic external data (like arrays or callbacks) through the `itemData` prop wrapped in `useMemo` to prevent stale closures and unnecessary re-renders.
## 2024-04-15 - Debouncing Window Resize Handlers
**Learning:** React state updates inside a high-frequency event listener like `window.addEventListener('resize')` trigger synchronous, expensive re-renders on every pixel change, creating severe rendering bottlenecks, especially when paired with virtualization libraries (like `react-window`) that continuously recalculate layout based on window dimensions.
**Action:** Always wrap state-updating logic inside `resize` or `scroll` listeners with a debounce or throttle mechanism (e.g., `setTimeout`) to batch render cycles and prevent blocking the main thread.
## 2026-04-12 - Memoize Static Layout inside Map renders\n**Learning:** When rendering append-only lists or logs (like system consoles) that grow indefinitely, extracting the map rendering callback to a memoized component prevents unrelated, high-frequency global state updates (e.g., text inputs) from triggering expensive O(N) inline recalculations (like string `.includes()` checks) across the array on every render.\n**Action:** Extract log item rendering logic into a dedicated `React.memo()` component, passing only the individual data string, to bypass array mapping processing bottlenecks.
## 2024-04-16 - Prevent O(N) Inline Re-renders in React Arrays
**Learning:** When rendering arrays containing conditional, computationally heavy operations (like mapping process arrays and executing `string.toLowerCase().includes()` to find specific elements), placing this logic directly inside the `.map()` loop creates an O(N) recalculation on every render.
**Action:** Extract list items with inline calculations into standalone `React.memo()` components. This isolates the operations and prevents redundant executions across the entire list when unrelated state causes the parent component to reconcile.
## 2024-04-14 - Backend psutil.process_iter optimization
**Learning:** `psutil.process_iter(['name'])` or `psutil.process_iter(['pid', 'name'])` is actually SLOWER (~35-50%) than calling `psutil.process_iter()` and manually accessing `proc.pid` and `proc.name()` inside the loop for the processes we actually care about. The overhead of bulk-fetching attributes for all processes via the `['name']` array parameter outweighs the benefit if we filter things out or if we only need a few attributes.
**Action:** Replace `psutil.process_iter(['pid', 'name'])` and `psutil.process_iter(['name'])` with `psutil.process_iter()` and manual attribute access in `get_live_processes`, `monitor_game_process`, and `boost_game` fallback.

## 2024-05-15 - React.memo for large mapped lists
**Learning:** Extracting complex mapped UI components (like `GameCard`) into `React.memo` and wrapping their callback handlers (`handleLaunchGame`, `addLog`) with `useCallback` prevents O(N) re-renders when global application state (like the `logs` array) updates frequently due to backend polling. Lazy loading images also improves rendering speed for offscreen elements.
**Action:** Always memoize individual items in large mapped arrays and ensure any functions passed to them as props are wrapped in `useCallback` to preserve referential equality and keep memoization effective.

## 2024-05-16 - Pre-compiling Regex for Hot Paths
**Learning:** Pre-compiling regular expressions at the module level in Python provides a significant performance boost (~40%) when those expressions are used inside hot loops, such as directory scanning for Steam games or string normalization. It eliminates the overhead of repeated compilation and internal cache lookups.
**Action:** Extract all static regex patterns from loops and function bodies into module-level constants (prefixed with `RE_`) in `booster_app_export/main.py`.

## 2024-05-18 - Capping Append-Only Arrays in React State
**Learning:** When managing console logs or append-only arrays in React state that can grow indefinitely, unbounded appends cause an O(N) array copy operation on every state update and continuously leak memory.
**Action:** Cap the array size (e.g., to the latest 100 entries using `.slice(-100)`) when appending to prevent O(N) bottlenecks and memory leaks over long sessions.

## 2024-05-20 - Extract Map Callbacks into Memoized Components
**Learning:** In React, mapping over arrays with inline layouts and callbacks creates new components and functions on every render. If the parent updates frequently (e.g., polling telemetry), it causes expensive O(N) re-renders across the entire list.
**Action:** Always extract list items inside `.map()` loops into standalone `React.memo()` components and ensure passed event handlers are wrapped in `useCallback` to maintain referential equality and prevent O(N) re-render bottlenecks.

## 2024-05-24 - Stable Keys for Capped Arrays
**Learning:** When mapping over append-only arrays in React that use `.slice()` or shifting (like capped log histories), using the array index as the component `key` defeats `React.memo()`. Shifting the array changes the content at every index, forcing an O(N) re-render of all previously existing items.
**Action:** Store objects with unique, stable identifiers and use them as the key (e.g., `key={log.id}`) instead of index.
