# Game Booster React Application - Component Architecture Plan

## Executive Summary

This document outlines a comprehensive component architecture redesign for the Game Booster application, addressing the current 2037-line monolithic `App.tsx` file. The new architecture focuses on maintainability, scalability, and performance while preserving all existing functionality across 5 tabs (Library, Boost, System Booster, Booster Prime, Settings).

## Current Issues Analysis

### 1. **Monolithic Structure**
- 2037 lines in single `App.tsx` file
- 20+ useState hooks creating complex state management
- Mixed concerns: UI rendering, business logic, data fetching

### 2. **Poor Separation of Concerns**
- Inline components that can't be reused
- No clear component hierarchy
- Business logic intertwined with UI code

### 3. **Performance Concerns**
- No proper tree-shaking support
- Inefficient re-renders due to monolithic state
- No component-level memoization strategy

### 4. **Maintainability Challenges**
- No proper folder structure
- No named exports for optimal bundling
- Difficult to test individual components

## Proposed Architecture

### 1. **Folder Structure Organization**

```
src/
├── App.tsx                    # Main application wrapper
├── main.tsx                   # Entry point
├── index.css                  # Global styles
├── types/                     # TypeScript definitions
│   ├── index.ts              # Barrel exports
│   ├── api.types.ts          # API response types
│   ├── game.types.ts         # Game-related types
│   ├── process.types.ts      # Process management types
│   └── ui.types.ts           # UI component types
├── api/                       # API layer
│   ├── eelClient.ts          # Existing Eel client
│   ├── gameService.ts        # Game-related API calls
│   ├── processService.ts     # Process management API
│   ├── systemService.ts      # System optimization API
│   └── telemetryService.ts   # Telemetry data API
├── components/                # React components
│   ├── layout/               # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── NavigationTabs.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── ui/                   # Reusable UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── ToggleSwitch/
│   │   └── ProgressBar/
│   ├── features/             # Feature-specific components
│   │   ├── library/          # Library tab components
│   │   │   ├── GameLibrary.tsx
│   │   │   ├── GameCard.tsx
│   │   │   ├── GameCardSkeleton.tsx
│   │   │   └── GameProfileModal.tsx
│   │   ├── boost/            # Boost tab components
│   │   │   ├── BoostDashboard.tsx
│   │   │   ├── ProcessGrid.tsx
│   │   │   ├── ProcessItem.tsx
│   │   │   ├── TelemetryDashboard.tsx
│   │   │   └── HyperBoostPanel.tsx
│   │   ├── system-booster/   # System Booster components
│   │   │   ├── SystemCleaner.tsx
│   │   │   ├── StartupOptimizer.tsx
│   │   │   └── OptimizationCards.tsx
│   │   ├── booster-prime/    # Booster Prime components
│   │   │   ├── PrimeGamesList.tsx
│   │   │   └── PrimeGameItem.tsx
│   │   └── settings/         # Settings components
│   │       ├── HotkeySettings.tsx
│   │       ├── TraySettings.tsx
│   │       └── ProfileSettings.tsx
│   └── shared/               # Shared components
│       ├── ConsoleLog.tsx
│       ├── ConfirmationDialog.tsx
│       └── SessionSummaryModal.tsx
├── hooks/                    # Custom React hooks
│   ├── useTelemetry.ts
│   ├── useGameLibrary.ts
│   ├── useProcessManager.ts
│   ├── useSystemOptimizer.ts
│   ├── useHotkeys.ts
│   ├── useTrayManager.ts
│   └── useLogging.ts
├── store/                    # State management
│   ├── slices/               # Zustand/Redux slices
│   │   ├── gameSlice.ts
│   │   ├── processSlice.ts
│   │   ├── systemSlice.ts
│   │   ├── telemetrySlice.ts
│   │   └── uiSlice.ts
│   └── index.ts
├── utils/                    # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
└── styles/                   # Component-specific styles
    ├── components/
    └── themes/
```

### 2. **Component Hierarchy**

```mermaid
graph TB
    App[App Component]
    App --> AppLayout[AppLayout]
    
    AppLayout --> NavigationTabs[NavigationTabs]
    AppLayout --> MainContent[MainContent]
    
    NavigationTabs --> TabButton[TabButton] x5
    
    MainContent --> CurrentTab[CurrentTab]
    
    CurrentTab --> LibraryTab[LibraryTab]
    CurrentTab --> BoostTab[BoostTab]
    CurrentTab --> SystemBoosterTab[SystemBoosterTab]
    CurrentTab --> BoosterPrimeTab[BoosterPrimeTab]
    CurrentTab --> SettingsTab[SettingsTab]
    
    LibraryTab --> GameLibrary[GameLibrary]
    GameLibrary --> GameCard[GameCard]
    GameLibrary --> GameCardSkeleton[GameCardSkeleton]
    GameLibrary --> GameProfileModal[GameProfileModal]
    
    BoostTab --> TelemetryDashboard[TelemetryDashboard]
    BoostTab --> BoostDashboard[BoostDashboard]
    BoostTab --> ProcessGrid[ProcessGrid]
    BoostTab --> HyperBoostPanel[HyperBoostPanel]
    BoostTab --> OptimizationCards[OptimizationCards]
    
    ProcessGrid --> ProcessItem[ProcessItem]
    ProcessGrid --> ProcessItemSkeleton[ProcessItemSkeleton]
    
    SystemBoosterTab --> SystemCleaner[SystemCleaner]
    SystemBoosterTab --> StartupOptimizer[StartupOptimizer]
    
    BoosterPrimeTab --> PrimeGamesList[PrimeGamesList]
    PrimeGamesList --> PrimeGameItem[PrimeGameItem]
    
    SettingsTab --> HotkeySettings[HotkeySettings]
    SettingsTab --> TraySettings[TraySettings]
    
    AppLayout --> ConsoleLog[ConsoleLog]
    AppLayout --> ConfirmationDialog[ConfirmationDialog]
    AppLayout --> SessionSummaryModal[SessionSummaryModal]
```

### 3. **Type System Organization**

**Extracted from current App.tsx interfaces:**

```typescript
// types/api.types.ts
export interface EelResponse {
  status: 'success' | 'error';
  message: string;
  details?: string;
}

export interface TelemetryData {
  cpu_usage: number;
  ram_usage_gb: number;
  gpu_usage: number;
  gpu_temp: number;
}

export interface SessionSummaryData {
  avg_fps_gain: number;
  '1_percent_lows_gain': number;
  ram_cleared_gb: number;
}

// types/game.types.ts
export interface GameProfile {
  high_priority: boolean;
  network_flush: boolean;
  power_plan: boolean;
  suspend_services: boolean;
  ram_purge: boolean;
}

export interface Game {
  id: string;
  title: string;
  exe_path: string;
  exe_name: string;
  icon_path: string | null;
  profile: GameProfile;
}

export interface PrimeGame {
  id: string;
  name: string;
  primeDescription: string;
}

// types/process.types.ts
export interface ProcessInfo {
  pid: number;
  name: string;
  memory_mb: number;
}

// types/ui.types.ts
export type AppTab = 'Library' | 'Boost Tab' | 'System Booster' | 'Booster Prime' | 'Settings';
export type BoostProfile = 'Aggressive' | 'Conservative' | 'Custom';
export type BoostMode = 'Esports' | 'AAA' | 'Streaming';
```

### 4. **Custom Hooks Architecture**

| Hook | Purpose | State Managed |
|------|---------|---------------|
| `useTelemetry()` | Live system metrics polling | `telemetryData`, `isPolling` |
| `useGameLibrary()` | Game scanning and management | `games`, `isScanning`, `selectedGame` |
| `useProcessManager()` | Process listing and selection | `processes`, `selectedPids`, `isLoading` |
| `useSystemOptimizer()` | System optimization actions | `optimizationState`, `isOptimizing` |
| `useHotkeys()` | Hotkey configuration | `hotkeys`, `isUpdating` |
| `useTrayManager()` | Tray mode management | `trayMode`, `isTrayActive` |
| `useLogging()` | Console log management | `logs`, `addLog`, `clearLogs` |

### 5. **Service Layer Design**

```typescript
// api/gameService.ts
export const gameService = {
  scanGames: (forceRefresh?: boolean) => callEel<[boolean], Game[]>('scan_games', forceRefresh),
  launchGame: (gameId: string, profile: GameProfile, exePath: string, exeName: string) => 
    callEel<[string, GameProfile, string, string], EelResponse>('launch_game', gameId, profile, exePath, exeName),
  getPrimeGames: (forceRefresh?: boolean) => callEel<[boolean], PrimeGame[]>('get_prime_games', forceRefresh),
  tweakGameSettings: (gameName: string) => callEel<[string], EelResponse>('tweak_game_settings', gameName),
};

// api/processService.ts
export const processService = {
  getLiveProcesses: () => callEel<[], ProcessInfo[]>('get_live_processes'),
  getBoostProfiles: () => callEel<[], Record<string, string[]>>('get_boost_profiles'),
  saveCustomProfile: (appNames: string[]) => callEel<[string[]], EelResponse>('save_custom_profile', appNames),
  boostGame: (pidsToKill?: number[], profileName?: string) => 
    callEel<[number[], string], EelResponse>('boost_game', pidsToKill, profileName),
  undoBoost: () => callEel<[], EelResponse>('undo_boost'),
};

// api/systemService.ts
export const systemService = {
  cleanSystem: (includeShaders: boolean) => callEel<[boolean], EelResponse>('full_system_clean', includeShaders),
  optimizeStartup: () => callEel<[], EelResponse>('optimize_startup'),
  purgeRam: () => callEel<[], EelResponse>('purge_ram'),
  suspendServices: () => callEel<[], EelResponse>('suspend_services'),
  restoreServices: () => callEel<[], EelResponse>('restore_services'),
  setPowerPlan: (planType: 'high_performance' | 'balanced') => 
    callEel<[string], EelResponse>('set_power_plan', planType),
  flushNetwork: () => callEel<[], EelResponse>('flush_dns_and_reset'),
};

// api/telemetryService.ts
export const telemetryService = {
  getTelemetry: () => callEel<[], TelemetryData>('get_telemetry'),
  toggleOverlay: () => callEel<[], EelResponse>('toggle_overlay'),
  startMonitor: (targetExe: string) => callEel<[string], EelResponse>('start_monitor', targetExe),
  stopMonitor: () => callEel<[], EelResponse>('stop_monitor'),
  getSessionSummary: () => callEel<[], SessionSummaryResponse>('get_session_summary'),
};
```

### 6. **State Management Strategy**

**Approach**: Use Zustand for global state with slices pattern

```typescript
// store/slices/gameSlice.ts
interface GameState {
  games: Game[];
  primeGames: PrimeGame[];
  selectedGame: Game | null;
  isScanning: boolean;
  isLaunching: boolean;
  actions: {
    scanGames: (forceRefresh?: boolean) => Promise<void>;
    launchGame: (game: Game) => Promise<void>;
    selectGame: (game: Game | null) => void;
    updateGameProfile: (gameId: string, profile: Partial<GameProfile>) => void;
  };
}

// store/slices/processSlice.ts
interface ProcessState {
  processes: ProcessInfo[];
  selectedPids: number[];
  boostProfile: BoostProfile;
  availableProfiles: Record<string, string[]>;
  isLoading: boolean;
  isBoosting: boolean;
  actions: {
    fetchProcesses: () => Promise<void>;
    toggleProcessSelection: (pid: number) => void;
    setBoostProfile: (profile: BoostProfile) => void;
    executeBoost: () => Promise<void>;
    saveCustomProfile: () => Promise<void>;
  };
}

// store/slices/uiSlice.ts
interface UIState {
  currentTab: AppTab;
  showConfirmationDialog: boolean;
  showSessionSummary: boolean;
  logs: LogEntry[];
  actions: {
    setCurrentTab: (tab: AppTab) => void;
    showDialog: (dialogType: DialogType) => void;
    hideDialog: () => void;
    addLog: (message: string, isError?: boolean) => void;
  };
}
```

### 7. **Export Patterns for Tree-Shaking**

**Barrel Exports Pattern:**
```typescript
// components/ui/index.ts
export { Button } from './Button/Button';
export { Card } from './Card/Card';
export { Modal } from './Modal/Modal';
export { ToggleSwitch } from './ToggleSwitch/ToggleSwitch';

// hooks/index.ts
export { useTelemetry } from './useTelemetry';
export { useGameLibrary } from './useGameLibrary';
export { useProcessManager } from './useProcessManager';

// types/index.ts
export type { Game, GameProfile } from './game.types';
export type { ProcessInfo } from './process.types';
export type { AppTab, BoostProfile } from './ui.types';
```

**Named Exports Only:**
- Avoid default exports for better tree-shaking
- Use `export const` for components
- Use `export type` for TypeScript types

### 8. **Implementation Roadmap**

#### **Phase 1: Foundation (Week 1-2)**
1. **Setup Project Structure**
   - Create folder hierarchy
   - Configure barrel exports
   - Set up TypeScript path aliases

2. **Extract Types**
   - Move all interfaces to `types/` directory
   - Create proper type definitions
   - Update imports across codebase

3. **Create Service Layer**
   - Extract API calls from App.tsx
   - Implement service modules
   - Add error handling and logging

#### **Phase 2: Component Extraction (Week 3-4)**
1. **Extract UI Components**
   - Create reusable Button, Card, Modal components
   - Implement loading skeletons
   - Add proper TypeScript props

2. **Extract Feature Components**
   - Library tab components
   - Boost tab components
   - System Booster components
   - Settings components

3. **Create Custom Hooks**
   - Extract state logic from App.tsx
   - Implement useTelemetry, useGameLibrary, etc.
   - Add proper dependency arrays

#### **Phase 3: State Management (Week 5-6)**
1. **Implement Zustand Store**
   - Set up store with slices
   - Migrate useState hooks to store
   - Add persistence for settings

2. **Refactor App.tsx**
   - Break down into container components
   - Connect to store
   - Remove inline component definitions

3. **Performance Optimization**
   - Add React.memo for expensive components
   - Implement virtual scrolling for process list
   - Add proper key props

#### **Phase 4: Testing & Polish (Week 7-8)**
1. **Add Unit Tests**
   - Test service functions
   - Test custom hooks
   - Test component rendering

2. **Performance Testing**
   - Bundle size analysis
   - Render performance profiling
   - Memory leak detection

3. **Documentation**
   - Component documentation
   - API documentation
   - Architecture decision records

### 9. **Migration Strategy**

**Incremental Migration Approach:**
1. **Start with types and services** - Non-breaking changes
2. **Extract one tab at a time** - Maintain functionality
3. **Use feature flags** - Roll back if issues arise
4. **Parallel implementation** - Old and new components coexist
5. **Final switchover** - Replace App.tsx with new architecture

**Backward Compatibility:**
- Maintain all existing Eel API calls
- Preserve all UI functionality
- Keep same user experience
- No breaking changes to Python backend

### 10. **Performance Benefits**

**Expected Improvements:**
1. **Bundle Size Reduction**: 30-40% through tree-shaking
2. **Render Performance**: 50% faster re-renders with proper memoization
3. **Memory Usage**: Reduced by separating component lifecycles
4. **Maintainability**: 80% reduction in cognitive load for developers

### 11. **Risk Mitigation**

**Technical Risks:**
1. **State Management Complexity** - Use proven library (Zustand)
2. **Migration Breaking Changes** - Incremental rollout with testing
3. **Performance Regression** - Comprehensive performance testing

**Mitigation Strategies:**
- Comprehensive test coverage
- Feature flag system
