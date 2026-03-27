## 2025-02-27 - Double Disk Traversal in File Cleanup
**Learning:** Found a severe I/O bottleneck in `clean_system` where it calculated directory size using `os.walk` and then deleted the directory using `shutil.rmtree`. This causes two full disk traversals for the same files, which is an anti-pattern for disk operations.
**Action:** Use a single bottom-up traversal (`os.walk(topdown=False)`) to calculate file size and delete files/directories simultaneously, effectively cutting I/O operations by up to 50%.

## 2025-02-27 - Expensive System Calls in process_iter
**Learning:** Calling `psutil.process_iter(['name', 'memory_info'])` fetches the memory footprint for *every* running process on the system, regardless of whether it's a target process. `memory_info` is an expensive system call compared to `name`.
**Action:** Filter processes by a cheap attribute first (`name`), and only invoke expensive system calls (like `proc.memory_info()`) on the matched processes. This avoids hundreds of unnecessary OS system calls.
