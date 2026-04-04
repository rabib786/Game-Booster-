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

## 2025-03-31 - O(N*M) Bottlenecks in Backend Process Filtering
**Learning:** Checking `if item in list` inside a loop over hundreds of system processes (like `psutil.process_iter`) creates an O(N*M) algorithmic bottleneck. For example, filtering 300 processes against a list of 150 process IDs or target names results in tens of thousands of unnecessary string or integer comparisons.
**Action:** Always convert lookup lists (like `pids_to_kill` or `critical_processes`) into `set()` structures *before* entering the process iteration loop. This guarantees O(1) lookups and significantly reduces CPU overhead during system monitoring and boosting.

## 2025-04-01 - Avoid psutil.process_iter for explicit PID lookups
**Learning:** Calling `psutil.process_iter` forces a complete iteration of every running process on the OS to fetch process metadata. When optimizing operations like `boost_game` where the target PIDs (`pids_to_kill`) are already explicitly known, iterating through all system processes just to check `if pid in targets` creates massive unnecessary overhead (O(N) vs O(K)).
**Action:** When a direct list of PIDs is available, bypass `psutil.process_iter()` entirely and directly instantiate process objects via `psutil.Process(pid)`. This drops the time complexity from an O(N) system-wide metadata scan to an O(K) direct OS-level lookup (where K is the number of targeted processes).

## 2025-04-01 - Avoid psutil.process_iter for PID-only lookups
**Learning:** Using `psutil.process_iter(['pid'])` instantiates full process objects which carries significant overhead. When only needing the raw Process IDs (e.g., for direct OS API calls via `ctypes`), using `psutil.pids()` directly is significantly faster (~15x) as it skips object instantiation and fetches a raw list of integers.
**Action:** Replace `psutil.process_iter(['pid'])` with `psutil.pids()` in loops where only the Process ID is required and no other process metadata is needed.

## 2025-04-02 - Combine Multiple Process Iterations
**Learning:** Calling `psutil.process_iter()` multiple times within a short period (like in a polling loop) is very expensive due to OS-level system calls. In `monitor_game_process`, we were making two full passes: one to find the game, and another to adjust background apps.
**Action:** Consolidate multiple system-wide metadata scans into a single pass. Process the properties you need in one go (e.g., finding the game AND collecting background apps) to halve the number of expensive system calls.

## 2025-04-03 - Cache Dynamic System States in Polling Loops
**Learning:** When optimizing continuous polling loops (like `while monitoring_active:`), placing dynamic system state calculations (such as fetching `current_process.children(recursive=True)` for whitelisting) inside the loop triggers expensive OS-level allocations on every iteration. However, strictly hoisting these calculations outside the loop can lead to stale cache regressions, as newly spawned child processes won't be captured.
**Action:** Introduce a periodic cache refresh mechanism. Hoist dynamic data structures, but update them conditionally based on time (e.g., `if current_time - last_refresh > 60:`) rather than strictly keeping them static. This balances performance optimization with keeping dynamic system states accurate.

## 2025-04-04 - Optimize Directory Scanning with os.scandir
**Learning:** In the system cleaner, using `os.listdir()` to scan highly populated temp directories forces us to make extra OS-level stat calls (`os.path.isfile`, `os.path.getsize`) for every single item. This creates a severe I/O bottleneck. `os.scandir()` inherently caches these attributes on Windows and most Unix systems.
**Action:** Replace `os.listdir()` followed by `os.path.*` calls with a single `os.scandir()` loop. This eliminates up to 3 redundant stat calls per file, dramatically speeding up directory traversal and file cleaning operations.
