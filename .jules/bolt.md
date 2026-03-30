## 2025-02-27 - Double Disk Traversal in File Cleanup
**Learning:** Found a severe I/O bottleneck in `clean_system` where it calculated directory size using `os.walk` and then deleted the directory using `shutil.rmtree`. This causes two full disk traversals for the same files, which is an anti-pattern for disk operations.
**Action:** Use a single bottom-up traversal (`os.walk(topdown=False)`) to calculate file size and delete files/directories simultaneously, effectively cutting I/O operations by up to 50%.

## 2025-02-27 - Expensive System Calls in process_iter
**Learning:** Calling `psutil.process_iter(['name', 'memory_info'])` fetches the memory footprint for *every* running process on the system, regardless of whether it's a target process. `memory_info` is an expensive system call compared to `name`.
**Action:** Filter processes by a cheap attribute first (`name`), and only invoke expensive system calls (like `proc.memory_info()`) on the matched processes. This avoids hundreds of unnecessary OS system calls.
## 2026-03-28 - Prevent React Root Re-renders with Component Extraction
**Learning:** In a React app, placing high-frequency polling logic (like a 1000ms `setInterval` for telemetry) in the root `App` component causes the entire component tree to unnecessarily reconcile every second, even if most child components don't depend on that data.
**Action:** Extract the high-frequency state, its `useEffect` polling hook, and the corresponding UI rendering logic into a distinct, isolated component (e.g., `TelemetryDashboard`). Render this component where needed, ensuring only it re-renders on every tick, saving massive CPU cycles on reconciliation.

## 2025-02-28 - Prevent O(N²) List Rendering Bottlenecks
**Learning:** Rendering a massive list (`liveProcesses.map`) that does an `O(N)` array `.includes()` check on every item results in `O(N²)` complexity, causing severe frontend lag when unrelated state changes (e.g., typing in an input field) trigger parent re-renders.
**Action:** Wrap the heavy list mapping logic in a `useMemo` block that only updates when its dependencies change, and convert the lookup array into a `Set` for `O(1)` lookups (e.g., `Set.has()`).
