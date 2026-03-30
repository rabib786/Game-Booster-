## YYYY-MM-DD - [Convert navigation `<a>` tags to `<button>`]
**Learning:** Found an accessibility issue pattern where `<a>` tags without `href` were used for app navigation tabs, breaking keyboard accessibility as they aren't naturally focusable via the `Tab` key.
**Action:** Replaced these `<a>` tags with `<button>` elements, ensuring they are keyboard-accessible (tab-focusable) and readable by screen readers. Added `aria-label` attributes to icon-only buttons for screen reader friendliness and `focus-visible` styles for better keyboard navigation visual feedback.
