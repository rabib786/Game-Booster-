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
