1. **Request review for proposed UX improvement.**
2. **Apply UX improvements:**
   - Update `SelectedProcessItem` in `src/App.tsx` to include `<span className="sr-only">` tags next to status indicators (`⚠️` and `📄`) that are hidden from screen readers via `aria-hidden="true"`.
   - Update `Settings` icon in `src/App.tsx` (Application Settings section) to have `aria-hidden="true"`.
3. **Verify the change:**
   - Run `pnpm lint` and `pnpm test:ui` to ensure no errors were introduced.
4. **Log the critical learning in `.jules/palette.md`:**
   - Document the specific pattern found for status indicator emojis.
5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
6. **Submit PR:**
   - Title: "🎨 Palette: Add screen reader text to process status indicators"
   - Description detailing What, Why, and Accessibility impacts.
