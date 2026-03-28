1. **Shader Cleaner (Python Backend):**
   - Update `clean_system` in `booster_app_export/main.py` to also clean DirectX caches, NVIDIA caches (`%LocalAppData%\NVIDIA\DXCache`, `%LocalAppData%\NVIDIA\GLCache`), and Windows Prefetch (`C:\Windows\Prefetch`), updating the `freed_space` calculation and logging correctly. Ensure errors are gracefully handled.
2. **Game-Specific "Booster Prime" (Python Backend):**
   - Implement `tweak_game_settings` in `main.py` to target a specific game (e.g. `Cyberpunk 2077` or `Warzone`), locate its `GameUserSettings.ini` (or equivalent config file), parse it using `configparser`, and apply hardcoded "Best Practice" settings (e.g., V-Sync disabled, DLSS enabled).
3. **Session Analytics (Frontend & Backend):**
   - Add a method to calculate and return a "Session Summary" when the boost ends or the monitored game closes. We need a basic simulation of FPS/Lows and actual RAM cleared over the session. Since actual FPS injection needs a separate complex hook, we can simulate realistic data or gather actual resource numbers.
4. **System Tray Minimization (Python Backend):**
   - Add the `pystray` and `Pillow` libraries to `requirements.txt`.
   - Implement system tray logic in `main.py` using `pystray` to keep the app running in the tray instead of the taskbar. Provide a "Quit" and "Show" option. Handle the window closing by minimizing to tray instead of exiting entirely if configured.
5. **Frontend UI Update (React):**
   - Update `src/App.tsx` to expose the new "Shader Cleaner" action (integrated into the System Cleaner or separate).
   - Add the "Booster Prime" UI to list supported games and call the new `tweak_game_settings` backend function.
   - Display the "Session Summary" card.
