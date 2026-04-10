## 2024-04-06 - Implement Kill Confirmation Modal & Profile Switcher

- Added a confirmation modal overlay (`showConfirmDialog`) to preview selected processes and estimated RAM savings before terminating apps.
- Integrated semantic ARIA tags (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) to ensure standard compliance for modal dialogs.
- Included warning indicators for sensitive background tasks (e.g. `explorer.exe`).
- Implemented a select dropdown for `boostProfile` to rapidly load process kill-lists directly into selection states.

## 2024-04-08 - Contextual Call-To-Actions in Empty States
**Learning:** For empty states, putting a descriptive text that tells a user what to do in another part of the app is bad UX. Users respond significantly better to immediate, contextual CTA buttons that mirror main behaviors.
**Action:** Always embed primary/secondary actions directly inside the empty state component instead of routing the user's attention away from the problem area.

## 2024-04-10 - Adding Accessibility to System Logs
**Learning:** Components rendering dynamic application feedback like a System Console Log do not automatically inform screen readers when new entries are added, leaving out important status updates for actions that don't trigger global UI notifications.
**Action:** Include `role="log"` and `aria-live="polite"` on the scrollable container so that screen readers announce these updates appropriately to users without being overly intrusive.
