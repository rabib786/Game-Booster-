## 2024-04-06 - Implement Kill Confirmation Modal & Profile Switcher

- Added a confirmation modal overlay (`showConfirmDialog`) to preview selected processes and estimated RAM savings before terminating apps.
- Integrated semantic ARIA tags (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) to ensure standard compliance for modal dialogs.
- Included warning indicators for sensitive background tasks (e.g. `explorer.exe`).
- Implemented a select dropdown for `boostProfile` to rapidly load process kill-lists directly into selection states.
