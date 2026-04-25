/**
 * Game-related TypeScript definitions for the Game Booster application
 */

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