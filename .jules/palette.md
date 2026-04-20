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

## 2024-05-19 - Improve Tab Navigation Accessibility
**Learning:** Custom tab navigation built with standard `<nav>` and `<button>` elements lacks implicit semantics. Screen readers will not announce the structure as a tabbed interface or indicate which tab is active, leading to confusing navigation for visually impaired users.
**Action:** Always add explicit ARIA roles (`role="tablist"`, `role="tab"`) and state attributes (`aria-selected`) to custom tab components to ensure they behave semantically like native tabs.
## 2024-05-20 - Add focus visible styles to primary action buttons
**Learning:** Found multiple primary action buttons missing `focus-visible` styles, making keyboard navigation difficult for users relying on keyboard focus indicators.
**Action:** Always ensure any `<button>` includes explicit `focus-visible` utility classes that match the application's global focus styles (e.g., `focus-visible:ring-razer-green`).

## 2024-05-21 - Enforce accessibility for purely visual typographic symbols
**Learning:** Screen readers announce visual typographic symbols like `✓` and `✕`, causing unnecessary noise for users relying on assistive technologies.
**Action:** Always ensure purely visual typographic symbols are wrapped in an element with `aria-hidden="true"`.

## 2024-05-22 - Improve accessible names for dynamic controls
**Learning:** Generic `aria-label`s on repeated items (like "Play & Boost" on every game card) create ambiguity for screen reader users. Additionally, custom switches using `<button role="switch">` often duplicate label text in their `aria-label` instead of programmatically associating with their descriptive sibling elements.
**Action:** Always include dynamic contextual data (like the game title) in `aria-label`s for repeated list items. For custom switches, use `aria-labelledby` and `aria-describedby` pointing to the IDs of the nearby heading and paragraph elements to provide full context without duplicating text.
## 2024-04-19 - Screen Reader Accessibility for Status Emojis
**Learning:** Many status indicators in this app (like the risky process warning or the lightning bolt) use visual emojis with `aria-hidden="true"`. However, without an adjacent `sr-only` text span, the status information is completely lost to screen reader users.
**Action:** Always pair `aria-hidden="true"` visual indicators with an adjacent visually hidden text element (e.g., `<span className="sr-only">Status Text</span>`) when the visual conveys important state.

## 2024-06-15 - Add Keyboard Shortcut Hints to Actions
**Learning:** Exposing customizable keyboard shortcuts visually via `<kbd>` tags and semantically via `aria-keyshortcuts` helps both power users and users relying on assistive technologies discover efficient ways to interact with the app.
**Action:** Always include visual and semantic hints for keyboard shortcuts on primary actions.
