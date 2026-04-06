## 2024-04-06 - Implement Profile & Config Logic

- Created a persistent JSON config file to manage boost profiles (Aggressive, Conservative, Custom).
- Added backend tracking for killed processes using `subprocess.Popen` arguments to enable restart via undo boost functionality.
- Converted repetitive array loops for `liveProcesses` cross-referencing into O(1) set operations when checking whitelist inclusion before kills.
- Stored full executable paths when killing processes to reliably support reversing targeted kills.
