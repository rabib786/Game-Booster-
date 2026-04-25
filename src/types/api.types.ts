/**
 * API-related TypeScript definitions for the Game Booster application
 */

// Import types from other files
import type { PrimeGame, Game, GameProfile } from './game.types';
import type { ProcessInfo } from './process.types';

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

export interface SessionSummaryResponse {
  status: 'success' | 'error';
  message: string;
  details: SessionSummaryData;
}

export interface Eel {
  expose: (func: Function, name?: string) => void;
  get_telemetry: () => () => Promise<TelemetryData>;
  toggle_overlay: () => () => Promise<EelResponse>;
  start_monitor: (targetExe: string) => () => Promise<EelResponse>;
  stop_monitor: () => () => Promise<EelResponse>;
  get_session_summary: () => () => Promise<SessionSummaryResponse>;
  suspend_services: () => () => Promise<EelResponse>;
  restore_services: () => () => Promise<EelResponse>;
  purge_ram: () => () => Promise<EelResponse>;
  tweak_game_settings: (gameName: string) => () => Promise<EelResponse>;
  optimize_startup: () => () => Promise<EelResponse>;
  set_power_plan: (planType: 'high_performance' | 'balanced') => () => Promise<EelResponse>;
  flush_dns_and_reset: () => () => Promise<EelResponse>;
  update_hotkeys: (newBoost: string, newOverlay: string) => () => Promise<EelResponse>;
  get_prime_games: (forceRefresh?: boolean) => () => Promise<PrimeGame[]>;
  scan_games: (forceRefresh?: boolean) => () => Promise<Game[]>;
  launch_game: (gameId: string, profile: GameProfile, exePath: string, exeName: string) => () => Promise<EelResponse>;
  get_live_processes: () => () => Promise<ProcessInfo[]>;
  get_boost_profiles: () => () => Promise<Record<string, string[]>>;
  save_custom_profile: (appNames: string[]) => () => Promise<EelResponse>;
  undo_boost: () => () => Promise<EelResponse>;
  boost_game: (pidsToKill?: number[], profileName?: string) => () => Promise<EelResponse>;
  is_tray_active: () => () => Promise<boolean>;
  toggle_tray_mode: (enable: boolean) => () => Promise<EelResponse>;
  clean_shader_caches: () => () => Promise<EelResponse>;
  full_system_clean: (includeShaders: boolean) => () => Promise<EelResponse>;
}

// Re-export types that are defined in other files
export type { PrimeGame, Game, GameProfile } from './game.types';
export type { ProcessInfo } from './process.types';

// Global window augmentation
declare global {
  interface Window {
    eel: Eel;
  }
}