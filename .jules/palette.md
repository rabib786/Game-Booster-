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
## 2024-04-11 - Empty State Contextual CTAs
**Learning:** Found a dead-end empty state pattern in the "Booster Prime" tab that only provided descriptive text ("Install a supported game...") instead of actionable guidance. This disrupts user flow and forces them to manually navigate away.
**Action:** Always embed primary or secondary actions (like "Go to Library") directly inside empty state components to prevent navigation dead-ends and keep users engaged in the application flow.
## 2026-04-12 - Enforce Emoji Accessibility
**Learning:** Screen readers announce purely decorative emojis, causing unnecessary noise for users relying on assistive technologies.
**Action:** Always ensure purely visual emojis are wrapped in a span or element with `aria-hidden="true"`.
## 2024-05-18 - Added keyboard focus to interactive dashboard cards
**Learning:** Secondary dashboard cards (like "Enhanced Tools") often lack explicit `focus-visible` states compared to primary action buttons, making keyboard navigation difficult for power users and screen reader users since default browser outlines are invisible on dark themes.
**Action:** Always ensure any `<button>` within a dashboard card includes explicit `focus-visible` utility classes that match the application's global focus styles (e.g., `focus-visible:ring-razer-green`).
