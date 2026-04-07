# Immediate Improvements (Frontend + Backend)

This list focuses on **high-impact tasks that are realistic to implement in the next 1–3 development sessions**.

## Frontend (React/Vite)

1. **Split `src/App.tsx` into feature components + hooks**
   - Move each major tab (Library, Boost Tab, System Booster, Booster Prime, Settings) into separate components.
   - Extract repeated Eel call patterns into reusable hooks (`useEelAction`, `usePolling`).
   - Why now: lowers maintenance risk and makes tests more targeted.

2. **Create a typed API client layer for all Eel calls**
   - Centralize `window.eel` calls in `src/api/eelClient.ts`.
   - Add runtime response guards to avoid UI breakage from malformed backend responses.
   - Why now: reduces duplicated error handling and improves debuggability.

3. **Improve UX feedback states for long-running actions**
   - Add progress and result toasts for scan/boost/clean actions.
   - Disable only the relevant controls while actions are in flight.
   - Why now: better perceived quality and fewer accidental repeated actions.

4. **Add accessibility and keyboard support pass**
   - Ensure all interactive controls are keyboard reachable.
   - Add semantic labels for icon-only buttons and status regions.
   - Why now: quick quality win and helps future UI automation.

5. **Strengthen frontend tests around critical journeys**
   - Add tests for: game scan, profile selection, boost flow, undo flow, and settings save flow.
   - Mock Eel responses consistently to verify success/error rendering.
   - Why now: protects against regressions when refactoring App.tsx.

## Backend (Python/Eel)

1. **Modularize `booster_app_export/main.py` into services**
   - Split into modules such as `telemetry_service.py`, `process_service.py`, `cleaner_service.py`, `profiles_service.py`, and `tray_service.py`.
   - Keep Eel-exposed handlers thin and delegate logic to services.
   - Why now: enables focused tests and safer future feature work.

2. **Add structured logging and operation audit trail**
   - Use Python `logging` with rotating file handler.
   - Log operation start/end, selected profile, killed process count, and errors.
   - Why now: significantly improves supportability when users report “boost didn’t work”.

3. **Harden process termination safety checks**
   - Expand and validate safe/critical process lists.
   - Add dry-run mode for diagnostics that reports what would be terminated.
   - Why now: reduces risk of destabilizing user systems.

4. **Improve configuration resilience**
   - Validate `config.json` with defaults + schema-like checks.
   - Auto-recover invalid config with backup and user-facing warning.
   - Why now: prevents startup/runtime failures due to bad config writes.

5. **Expand backend tests for edge cases**
   - Add tests for permission errors, missing executables, invalid profile names, and corrupted config files.
   - Add mocks around `psutil`, `subprocess`, and registry operations for deterministic tests.
   - Why now: catches high-risk failures before release.

## Suggested execution order

1. Frontend API client layer + error normalization.
2. Backend config validation + structured logging.
3. Frontend App.tsx split.
4. Backend modularization by service area.
5. Expand frontend + backend critical-path tests.

