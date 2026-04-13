/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Settings, Play, X, Loader2 } from 'lucide-react';
import { FixedSizeGrid as Grid } from 'react-window';
import { callEel, isEelAvailable } from './api/eelClient';

interface EelResponse {
  status: 'success' | 'error';
  message: string;
  details?: string;
}

interface TelemetryData {
  cpu_usage: number;
  ram_usage_gb: number;
  gpu_usage: number;
  gpu_temp: number;
}

interface SessionSummaryData {
  avg_fps_gain: number;
  '1_percent_lows_gain': number;
  ram_cleared_gb: number;
}

interface SessionSummaryResponse {
  status: 'success' | 'error';
  message: string;
  details: SessionSummaryData;
}

interface PrimeGame {
  id: string;
  name: string;
  primeDescription: string;
}

interface ProcessInfo {
  pid: number;
  name: string;
  memory_mb: number;
}

interface GameProfile {
  high_priority: boolean;
  network_flush: boolean;
  power_plan: boolean;
  suspend_services: boolean;
  ram_purge: boolean;
}

interface Game {
  id: string;
  title: string;
  exe_path: string;
  exe_name: string;
  icon_path: string | null;
  profile: GameProfile;
}

interface Eel {
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

// Declare eel for TypeScript
declare global {
  interface Window {
    eel: Eel;
  }
}

// ⚡ Bolt: Extract LogLine to prevent O(N) string checks and DOM reconciliations on every log append.
const LogLine = React.memo(({ log }: { log: string }) => {
  return (
    <p className={log.includes('Error') || log.includes('Failed') ? 'text-red-500' : ''}>{log}</p>
  );
});

// ⚡ Bolt: Extract SystemConsole to prevent O(N) re-renders
// The logs array grows indefinitely. Without React.memo, typing in text inputs or
// switching tabs will force the entire list of elements to re-render.
const SystemConsole = React.memo(({ logs }: { logs: string[] }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <section className="mt-10 mb-8 border-t border-gray-800 pt-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">System Console Log</h2>
      <div className="bg-[#050505] border border-[#222] rounded-lg p-4 font-mono">
        <div className="h-40 overflow-y-auto text-razer-green text-sm space-y-1" role="log" aria-live="polite">
          {logs.map((log, i) => (
            <LogLine key={i} log={log} />
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </section>
  );
});

// ⚡ Bolt: Extracted ProcessItem to prevent O(N) re-renders on every selection toggle
const SelectedProcessItem = React.memo(({ proc }: { proc: ProcessInfo }) => {
  const isRisky = proc.name.toLowerCase().includes('explorer.exe') || proc.name.toLowerCase().includes('system');
  return (
    <li className="flex justify-between text-xs p-2 hover:bg-gray-900 rounded">
      <div className="flex items-center space-x-2">
        {isRisky ? <span className="text-red-500" title="Risky Process" aria-hidden="true">⚠️</span> : <span className="text-gray-500" aria-hidden="true">📄</span>}
        <span className={isRisky ? "text-red-400" : "text-gray-300"}>{proc.name}</span>
      </div>
      <span className="text-gray-500">{proc.memory_mb.toFixed(1)} MB</span>
    </li>
  );
});

const ProcessItem = React.memo(({
  proc,
  isSelected,
  onToggle
}: {
  proc: ProcessInfo;
  isSelected: boolean;
  onToggle: (pid: number) => void;
}) => {
  return (
    <button
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select ${proc.name}`}
      className={`w-full text-left p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green ${isSelected ? 'opacity-100 ring-1 ring-razer-green/50 bg-razer-green/5' : 'opacity-50 hover:opacity-100'}`}
      onClick={() => onToggle(proc.pid)}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-razer-green text-black' : 'bg-gray-700 text-white'}`}>
        <span className="text-[10px] font-bold">{proc.name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300 truncate">{proc.name}</p>
        <p className="text-xs text-gray-500">{proc.memory_mb >= 1024 ? (proc.memory_mb / 1024).toFixed(1) + ' GB' : Math.round(proc.memory_mb) + ' MB'}</p>
      </div>
      <div className="flex-shrink-0">
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-razer-green border-razer-green' : 'border-gray-500 bg-transparent'}`}>
          {isSelected && <div className="w-2 h-2 rounded-full bg-black"></div>}
        </div>
      </div>
    </button>
  );
});

// ⚡ Bolt: Extracted TelemetryDashboard to prevent whole-app re-renders
// By moving the 1000ms polling interval here, only this component will re-render
// instead of forcing the entire application (including heavy process/game lists)
// to reconcile on every tick.
const TelemetryDashboard = React.memo(() => {
  const [telemetry, setTelemetry] = useState({ cpu_usage: 0, ram_usage_gb: 0, gpu_usage: 0, gpu_temp: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEelAvailable()) {
      interval = setInterval(async () => {
        try {
          const tel = await callEel<[], TelemetryData>('get_telemetry');
          setTelemetry(tel);
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    } else {
      interval = setInterval(() => {
        setTelemetry({
          cpu_usage: Math.floor(Math.random() * 40) + 10,
          ram_usage_gb: parseFloat((Math.random() * 8 + 4).toFixed(1)),
          gpu_usage: Math.floor(Math.random() * 30) + 5,
          gpu_temp: Math.floor(Math.random() * 20) + 40
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mb-10 bg-panel-bg p-6 rounded-sm border border-gray-800 shadow-lg" data-purpose="telemetry-dashboard">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center">
        <span className="text-razer-green mr-2 animate-pulse">●</span> Live Telemetry
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CPU */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>CPU USAGE</span>
            <span className="text-white">{telemetry.cpu_usage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${telemetry.cpu_usage > 85 ? 'bg-red-500' : 'bg-razer-green'}`}
              style={{ width: `${telemetry.cpu_usage}%` }}
            ></div>
          </div>
        </div>

        {/* RAM */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>RAM USAGE</span>
            <span className="text-white">{telemetry.ram_usage_gb} GB</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${telemetry.ram_usage_gb > 14 ? 'bg-red-500' : 'bg-razer-green'}`}
              style={{ width: `${Math.min((telemetry.ram_usage_gb / 16) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* GPU */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>GPU (USAGE / TEMP)</span>
            <span className="text-white">{telemetry.gpu_usage}% / {telemetry.gpu_temp}°C</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${telemetry.gpu_usage > 90 || telemetry.gpu_temp > 80 ? 'bg-red-500' : 'bg-razer-green'}`}
              style={{ width: `${telemetry.gpu_usage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
});


function App() {
  const [logs, setLogs] = useState<string[]>(['> System ready...']);
  const [isBoosting, setIsBoosting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Library' | 'Boost Tab' | 'System Booster' | 'Booster Prime' | 'Settings'>('Library');
  const [boostHotkey, setBoostHotkey] = useState('alt+b');
  const [overlayHotkey, setOverlayHotkey] = useState('alt+o');
  const [isUpdatingHotkeys, setIsUpdatingHotkeys] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [trayMode, setTrayMode] = useState(false);
  const [isTrayActive, setIsTrayActive] = useState(false);
  const [includeShaders, setIncludeShaders] = useState(false);
  const [cleanerStats, setCleanerStats] = useState<{freed: number, details: string} | null>(null);

  const [autoBoost, setAutoBoost] = useState(false);
  const [boostMode, setBoostMode] = useState<'Esports' | 'AAA' | 'Streaming'>('Esports');
  const [liveProcesses, setLiveProcesses] = useState<ProcessInfo[]>([]);
  const [selectedPids, setSelectedPids] = useState<number[]>([]);
  const [boostProfile, setBoostProfile] = useState<'Aggressive' | 'Conservative' | 'Custom'>('Aggressive');
  const [availableProfiles, setAvailableProfiles] = useState<Record<string, string[]>>({});
  const [isUndoing, setIsUndoing] = useState(false);
  const [isSavingCustomProfile, setIsSavingCustomProfile] = useState(false);
  const [isHyperBoosting, setIsHyperBoosting] = useState(false);

  useEffect(() => {
    const fetchTrayStatus = async () => {
      if (isEelAvailable()) {
        try {
          const status = await callEel<[], boolean>('is_tray_active');
          setTrayMode(status);
          setIsTrayActive(status);
        } catch (e) {
          console.error('Failed to fetch tray status', e);
        }
      }
    };
    fetchTrayStatus();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (isEelAvailable()) {
        try {
          const profiles = await callEel<[], Record<string, string[]>>('get_boost_profiles');
          setAvailableProfiles(profiles);
        } catch (e) {
          console.error('Failed to fetch profiles', e);
        }
      }
    };
    fetchProfiles();
  }, []);


  const [selectedGameProfile, setSelectedGameProfile] = useState<Game | null>(null);
  const [installedGames, setInstalledGames] = useState<Game[]>([]);

  const [targetExe, setTargetExe] = useState('csgo.exe');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isTweaking, setIsTweaking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{fps: number, lows: number, ram: number} | null>(null);
  const [isServicesSuspended, setIsServicesSuspended] = useState(false);
  const [isPowerPlanHigh, setIsPowerPlanHigh] = useState(false);
  const [isFlushingNetwork, setIsFlushingNetwork] = useState(false);

  const [primeGames, setPrimeGames] = useState<PrimeGame[]>([]);



  useEffect(() => {
    if (currentTab === 'Boost Tab') {
      const fetchProcesses = async () => {
        if (isEelAvailable()) {
          try {
            const procs = await callEel<[], any>('get_live_processes');
            setLiveProcesses(procs);
            // Auto-select top processes if none selected yet, or just select all by default
            if (selectedPids.length === 0 && procs.length > 0) {
              setSelectedPids(procs.slice(0, 10).map((p) => p.pid)); // Default select top 10 memory hogs
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          // Mock data
          setTimeout(() => {
            const mockProcs = [
              { pid: 1234, name: 'chrome.exe', memory_mb: 1540.5 },
              { pid: 5678, name: 'discord.exe', memory_mb: 320.1 },
              { pid: 9101, name: 'spotify.exe', memory_mb: 150.8 }
            ];
            setLiveProcesses(mockProcs);
            if (selectedPids.length === 0) {
              setSelectedPids(mockProcs.map(p => p.pid));
            }
          }, 500);
        }
      };
      fetchProcesses();
    }
  }, [currentTab]);

  // Fetch supported games dynamically from the Python backend
  useEffect(() => {
    if (currentTab === 'Booster Prime') {
      const fetchPrimeGames = async () => {
        // Fetch supported games dynamically from the Python backend
        if (isEelAvailable()) {
          try {
            const games = await callEel<[], any>('get_prime_games');
            setPrimeGames(games);
          } catch (error) {
            console.error(`Error fetching Prime games: ${error}`);
          }
        } else {
          // Mock fallback
          setTimeout(() => {
            setPrimeGames([
              { id: 'mock_cp', name: 'Cyberpunk 2077', primeDescription: 'Enables DLSS and disables V-Sync for maximum framerates.' },
              { id: 'mock_wz', name: 'Warzone', primeDescription: 'Enables DLSS and disables V-Sync for competitive advantage.' }
            ]);
          }, 500);
        }
      };
      fetchPrimeGames();
    }
  }, [currentTab]);

  // Expose a function to Python to add logs asynchronously
  useEffect(() => {
    if (window.eel && window.eel.expose) {
      window.eel.expose(addLogFromPython, 'add_log');
    }
  }, []);

  const addLogFromPython = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };

  const addLog = (msg: string, isError = false) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };



  const handleLaunchGame = async (game: Game) => {
    addLog(`Starting launch sequence for ${game.title}...`);
    try {
      if (isEelAvailable()) {
        const response = await callEel<[any, any, any, any], any>('launch_game', game.id, game.profile, game.exe_path, game.exe_name);
        if (response.status === 'success') {
          addLog(`Launch success: ${response.details}`);

          // Sync UI states based on profile
          if (game.profile.high_priority) {
            setIsMonitoring(true);
            setTargetExe(game.exe_name);
          }
          if (game.profile.suspend_services) setIsServicesSuspended(true);

        } else {
          addLog(`Launch failed: ${response.message}`);
        }
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };


  const handleScanGames = async (forceRefresh = false) => {
    setIsScanning(true);
    addLog('Scanning for installed games...');
    if (isEelAvailable()) {
      try {
        const games = await callEel<[any], any>('scan_games', forceRefresh);
        setInstalledGames(games);
        addLog(`Found ${games.length} games.`);
      } catch (error) {
        addLog(`Error scanning games: ${error}`);
      } finally {
        setIsScanning(false);
      }
    } else {
      setTimeout(() => {
        setInstalledGames([
          {
            id: 'mock_1',
            title: 'Mock Game 1',
            exe_path: 'C:\\mock\\game1.exe',
            exe_name: 'game1.exe',
            icon_path: null,
            profile: {
              high_priority: true,
              network_flush: true,
              power_plan: true,
              suspend_services: true,
              ram_purge: true
            }
          },
          {
            id: 'mock_2',
            title: 'Mock Game 2',
            exe_path: 'C:\\mock\\game2.exe',
            exe_name: 'game2.exe',
            icon_path: null,
            profile: {
              high_priority: false,
              network_flush: false,
              power_plan: false,
              suspend_services: false,
              ram_purge: false
            }
          }
        ]);
        addLog('Found 2 mock games.');
        setIsScanning(false);
      }, 500);
    }
  };


  const handleToggleTrayMode = async () => {
    const newMode = !trayMode;
    setTrayMode(newMode);
    addLog(`Setting tray mode to ${newMode ? 'Enabled' : 'Disabled'}...`);
    if (window.eel && window.eel.toggle_tray_mode) {
      try {
        const response = await callEel<[any], any>('toggle_tray_mode', newMode);
        if (response.status === 'success') {
          setIsTrayActive(newMode);
          addLog(response.message);
        } else {
          setTrayMode(!newMode); // revert on error
          addLog(`Error: ${response.message}`, true);
        }
      } catch (error) {
        setTrayMode(!newMode); // revert on error
        addLog(`Error toggling tray mode: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        setIsTrayActive(newMode);
        addLog(`[Web Preview] Tray mode ${newMode ? 'enabled' : 'disabled'}.`);
      }, 500);
    }
  };

  const handleToggleOverlay = async () => {
    addLog('Toggling performance overlay...');
    if (isEelAvailable()) {
      try {
        const response = await callEel<[], any>('toggle_overlay');
        addLog(response.message);
      } catch (error) {
        addLog(`Error toggling overlay: ${error}`);
      }
    }
  };

  const toggleProfileSetting = (settingKey: keyof GameProfile) => {
    if (!selectedGameProfile) return;

    const updatedGame = {
      ...selectedGameProfile,
      profile: {
        ...selectedGameProfile.profile,
        [settingKey]: !selectedGameProfile.profile[settingKey]
      }
    };

    setSelectedGameProfile(updatedGame);

    // Update main array
    setInstalledGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
  };


  const handleCleanSystem = async () => {
    setIsCleaning(true);
    setCleanerStats(null);
    addLog(`Initiating System Clean sequence${includeShaders ? ' (including shaders)' : ''}...`);
    if (window.eel && window.eel.full_system_clean) {
      try {
        const result = await callEel<[any], any>('full_system_clean', includeShaders);
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) {
             addLog(`Details: ${result.details}`);
          }

          const match = result.message.match(/([\d.]+)\s*MB/);
          if (match) {
             setCleanerStats({
                 freed: parseFloat(match[1]),
                 details: result.details || ''
             });
          }
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      } finally {
        setIsCleaning(false);
      }
    } else {
      setTimeout(() => {
        const amount = includeShaders ? 2500.45 : 150.45;
        addLog(`[Web Preview] Cleaned ${amount} MB of Junk.`);
        if (includeShaders) {
            addLog(`[Web Preview] Details: NVIDIA DX: 2000 MB, Prefetch: 500 MB`);
        }
        setCleanerStats({
            freed: amount,
            details: includeShaders ? 'System Temp: 0.45 MB | NVIDIA DX: 2000 MB, Prefetch: 500 MB' : 'System Temp: 150.45 MB'
        });
        setIsCleaning(false);
      }, 1000);
    }
  };

  const handleOptimizeStartup = async () => {
    setIsOptimizing(true);
    addLog('Initiating Startup Optimization sequence...');
    if (isEelAvailable()) {
      try {
        const result = await callEel<[], any>('optimize_startup');
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) {
            addLog(result.details);
          }
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      } finally {
        setIsOptimizing(false);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Disabled 3 startup programs.');
        setIsOptimizing(false);
      }, 1000);
    }
  };


  useEffect(() => {
    if (currentTab === 'Boost Tab' && liveProcesses.length > 0) {
      if (boostProfile === 'Conservative') {
        setSelectedPids([]);
      } else if (boostProfile === 'Aggressive' || boostProfile === 'Custom') {
        const targetNames = availableProfiles[boostProfile] || [];
        // ⚡ Bolt Optimization: Replace O(N*M) array cross-reference with an O(N) Set lookup
        const lowerTargetNamesSet = new Set(targetNames.map(n => n.toLowerCase()));
        const pids = liveProcesses.filter(p => lowerTargetNamesSet.has(p.name.toLowerCase())).map(p => p.pid);
        setSelectedPids(pids);
      }
    }
  }, [boostProfile, liveProcesses, availableProfiles, currentTab]);

  const initiateBoost = () => {
    if (selectedPids.length > 0) {
      setShowConfirmDialog(true);
    } else {
      handleBoostConfirmed();
    }
  };

  const executeBoost = async (profileName: 'Aggressive' | 'Conservative' | 'Custom' = boostProfile, skipIntroLog = false) => {
    setIsBoosting(true);
    if (!skipIntroLog) {
      addLog('Initiating Game Boost sequence...');
    }

    if (isEelAvailable()) {
      try {
        const result = await callEel<[any, any], any>('boost_game', selectedPids, profileName);
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) {
            addLog(result.details);
          }
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      } finally {
        setIsBoosting(false);
      }
    } else {
      // Fallback for web preview mode if Eel is not available
      setTimeout(() => {
        const freed = (Math.random() * 500 + 200).toFixed(2);
        addLog(`[Web Preview] Freed ${freed} MB of RAM.`);
        addLog(`[Web Preview] Optimized: Process list items`);
        setIsBoosting(false);
      }, 1500);
    }
  };

  const handleBoostConfirmed = async () => {
    setShowConfirmDialog(false);
    await executeBoost();
  };

  const handleHyperBoost = async () => {
    if (isHyperBoosting) return;

    const modeToProfile: Record<'Esports' | 'AAA' | 'Streaming', 'Aggressive' | 'Conservative' | 'Custom'> = {
      Esports: 'Aggressive',
      AAA: 'Custom',
      Streaming: 'Conservative'
    };

    setIsHyperBoosting(true);
    addLog(`HyperBoost mode "${boostMode}" activated...`);
    addLog('Running chained optimizations (power, network, RAM, process cleanup)...');
    try {
      if (!isPowerPlanHigh) {
        await handleTogglePowerPlan();
      }
      await handleNetworkFlush();
      if (boostMode !== 'Streaming') {
        await handlePurgeRam();
      } else {
        addLog('Streaming mode keeps memory cache warmer for OBS/browser scenes.');
      }
      if (boostMode === 'AAA' && !isServicesSuspended) {
        await handleToggleServices();
      }
      await executeBoost(modeToProfile[boostMode], true);
      addLog(`HyperBoost "${boostMode}" sequence complete.`);
    } catch (error) {
      addLog(`HyperBoost failed: ${error}`, true);
    } finally {
      setIsHyperBoosting(false);
    }
  };


  const handleUndoBoost = async () => {
    setIsUndoing(true);
    addLog('Attempting to restart terminated applications...');
    if (window.eel && window.eel.undo_boost) {
      try {
        const result = await callEel<[], any>('undo_boost');
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) addLog(result.details);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (e) {
        addLog(`Failed to communicate: ${e}`, true);
      } finally {
        setIsUndoing(false);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Restarted applications.');
        setIsUndoing(false);
      }, 1000);
    }
  };

  const toggleAutoBoost = () => setAutoBoost(!autoBoost);

  const handleSaveCustomProfile = async () => {
    if (selectedPids.length === 0) {
      addLog('No selected apps to save for custom profile.', true);
      return;
    }

    // ⚡ Bolt Optimization: Replace O(N*M) array lookup with O(1) Set lookup
    const selectedPidsSetForSave = new Set(selectedPids);
    const selectedAppNames = liveProcesses
      .filter((proc) => selectedPidsSetForSave.has(proc.pid))
      .map((proc) => proc.name);

    if (selectedAppNames.length === 0) {
      addLog('Unable to resolve selected apps for custom profile.', true);
      return;
    }

    setIsSavingCustomProfile(true);
    addLog(`Saving custom profile with ${selectedAppNames.length} apps...`);
    if (window.eel && window.eel.save_custom_profile) {
      try {
        const result = await callEel<[any], any>('save_custom_profile', selectedAppNames);
        if (result.status === 'success') {
          addLog(result.message);
          const refreshed = await callEel<[], any>('get_boost_profiles');
          setAvailableProfiles(refreshed);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to save custom profile: ${error}`, true);
      } finally {
        setIsSavingCustomProfile(false);
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Saved custom profile with ${selectedAppNames.length} apps.`);
        setIsSavingCustomProfile(false);
      }, 700);
    }
  };

  const handleToggleMonitor = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      addLog(`Stopped monitoring ${targetExe}. Reverting priority...`);
      if (isEelAvailable()) {
        try {
          await callEel<[], any>('stop_monitor');
          const summaryData = await callEel<[], any>('get_session_summary');
          if (summaryData && summaryData.status === 'success') {
            addLog(summaryData.message);
            setSessionSummary({
              fps: summaryData.details.avg_fps_gain,
              lows: summaryData.details['1_percent_lows_gain'],
              ram: summaryData.details.ram_cleared_gb
            });
          }
        } catch (error) {
          addLog(`Failed to communicate with backend: ${error}`, true);
        }
      } else {
        setTimeout(() => {
          setSessionSummary({
            fps: 12,
            lows: 5,
            ram: 1.4
          });
          addLog('[Web Preview] Session ended. You gained an average of 12 FPS and cleared 1.4GB of RAM this session!');
        }, 500);
      }
    } else {
      if (!targetExe.trim()) {
        addLog('Error: Please enter a target executable name.', true);
        return;
      }
      setIsMonitoring(true);
      setSessionSummary(null); // Clear previous summary
      addLog(`Started monitoring for ${targetExe}. Process priority will be elevated.`);
      if (isEelAvailable()) {
        try {
          const result = await callEel<[any], any>('start_monitor', targetExe);
          if (result.status === 'success') {
            addLog(result.message);
          } else {
            addLog(`Error: ${result.message}`, true);
            setIsMonitoring(false);
          }
        } catch (error) {
          addLog(`Failed to communicate with backend: ${error}`, true);
          setIsMonitoring(false);
        }
      }
    }
  };
  const handleToggleServices = async () => {
    if (!window.eel) {
      addLog(`[Web Preview] ${isServicesSuspended ? 'Restored' : 'Suspended'} background services`);
      setIsServicesSuspended(!isServicesSuspended);
      return;
    }

    if (isServicesSuspended) {
      const res = await callEel<[], any>('restore_services');
      if (res.status === 'success') {
        addLog(res.message);
        setIsServicesSuspended(false);
      } else {
        addLog(`Error: ${res.message}`, true);
      }
    } else {
      const res = await callEel<[], any>('suspend_services');
      if (res.status === 'success') {
        addLog(res.message);
        setIsServicesSuspended(true);
      } else {
        addLog(`Error: ${res.message}`, true);
      }
    }
  };


  const handleTweakGame = async (gameName: string) => {
    setIsTweaking(true);
    addLog(`Applying Booster Prime settings for ${gameName}...`);
    if (isEelAvailable()) {
      try {
        const result = await callEel<[any], any>('tweak_game_settings', gameName);
        if (result.status === 'success') {
          addLog(result.message);
          if (result.details) {
            addLog(`Tweaks applied: ${result.details}`);
          }
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      } finally {
        setIsTweaking(false);
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Applied Booster Prime settings for ${gameName}.`);
        addLog('Tweaks applied: Enabled DLSS, Disabled V-Sync');
        setIsTweaking(false);
      }, 1000);
    }
  };

  const handlePurgeRam = async () => {
    setIsPurging(true);
    addLog('Initiating RAM Purge sequence...');
    if (isEelAvailable()) {
      try {
        const result = await callEel<[], any>('purge_ram');
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to purge RAM: ${error}`, true);
      } finally {
        setIsPurging(false);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Successfully purged system RAM.');
        setIsPurging(false);
      }, 1000);
    }
  };








  const handleTogglePowerPlan = async () => {
    const nextPlan = isPowerPlanHigh ? 'balanced' : 'high_performance';
    setIsPowerPlanHigh(!isPowerPlanHigh);
    addLog(`Initiating Power Plan switch to ${nextPlan}...`);

    if (isEelAvailable()) {
      try {
        const result = await callEel<[any], any>('set_power_plan', nextPlan);
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
          setIsPowerPlanHigh(isPowerPlanHigh);
        }
      } catch (error) {
        addLog(`Failed to switch power plan: ${error}`, true);
        setIsPowerPlanHigh(isPowerPlanHigh);
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Successfully switched to ${nextPlan === 'high_performance' ? 'High Performance' : 'Balanced'} power plan.`);
      }, 1000);
    }
  };


  const handleUpdateHotkeys = async () => {
    setIsUpdatingHotkeys(true);
    addLog(`Updating hotkeys...`);
    if (isEelAvailable()) {
      try {
        const result = await callEel<[any, any], any>('update_hotkeys', boostHotkey, overlayHotkey);
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to update hotkeys: ${error}`, true);
      } finally {
        setIsUpdatingHotkeys(false);
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Hotkeys updated: Boost=${boostHotkey}, Overlay=${overlayHotkey}`);
        setIsUpdatingHotkeys(false);
      }, 500);
    }
  };

  const handleNetworkFlush = async () => {
    setIsFlushingNetwork(true);
    addLog('Initiating Network Flush sequence...');

    if (isEelAvailable()) {
      try {
        const result = await callEel<[], any>('flush_dns_and_reset');
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to flush network: ${error}`, true);
      } finally {
        setIsFlushingNetwork(false);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Network flushed and reset successfully.');
        setIsFlushingNetwork(false);
      }, 1500);
    }
  };

  // ⚡ Bolt Optimization: Prevent O(N²) list rendering bottleneck
  // Wraps the massive process list mapping in useMemo so it doesn't re-render
  // on unrelated state changes (like telemetry ticks or keystrokes).
  // Also converts the O(N) array .includes() lookup into an O(1) Set.has() lookup.
  const selectedPidsSet = useMemo(() => new Set(selectedPids), [selectedPids]);

  const handleToggleProcess = useCallback((pid: number) => {
    setSelectedPids(prev => {
      if (prev.includes(pid)) {
        return prev.filter(id => id !== pid);
      }
      return [...prev, pid];
    });
  }, []);

  // ⚡ Bolt Optimization: Use react-window's FixedSizeGrid to virtualize the process list.
  // This prevents rendering thousands of DOM nodes at once when listing all system processes.
  // Determine dynamic column count based on typical viewport width constraints
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const columnCount = windowWidth >= 1024 ? 4 : windowWidth >= 768 ? 2 : 1;
  const containerWidth = Math.min(windowWidth - 64, 1200); // 64px for padding
  const columnWidth = containerWidth / columnCount;
  const rowCount = Math.ceil(liveProcesses.length / columnCount);

  const itemData = useMemo(() => ({
    liveProcesses,
    selectedPidsSet,
    handleToggleProcess,
    columnCount
  }), [liveProcesses, selectedPidsSet, handleToggleProcess, columnCount]);

  const Cell = useCallback(({ columnIndex, rowIndex, style, data }: { columnIndex: number; rowIndex: number; style: React.CSSProperties, data: typeof itemData }) => {
    const processIndex = rowIndex * data.columnCount + columnIndex;
    if (processIndex >= data.liveProcesses.length) {
      return null;
    }
    const proc = data.liveProcesses[processIndex];
    return (
      <div style={{ ...style, padding: '0.5rem' }}>
        <ProcessItem
          proc={proc}
          isSelected={data.selectedPidsSet.has(proc.pid)}
          onToggle={data.handleToggleProcess}
        />
      </div>
    );
  }, []);

  const selectedProcesses = useMemo(() => {
    return liveProcesses.filter(p => selectedPidsSet.has(p.pid));
  }, [liveProcesses, selectedPidsSet]);

  const memoryFreedGB = useMemo(() => {
    return (selectedProcesses.reduce((sum, p) => sum + p.memory_mb, 0) / 1024).toFixed(2);
  }, [selectedProcesses]);

  const tabOrder: Array<'Library' | 'Boost Tab' | 'Booster Prime' | 'Settings'> = ['Library', 'Boost Tab', 'Booster Prime', 'Settings'];

  const handleTabStep = (direction: -1 | 1) => {
    const currentIndex = tabOrder.indexOf(currentTab as typeof tabOrder[number]);
    if (currentIndex === -1) {
      setCurrentTab('Library');
      return;
    }
    const nextIndex = (currentIndex + direction + tabOrder.length) % tabOrder.length;
    setCurrentTab(tabOrder[nextIndex]);
  };

  return (
    <div className="bg-dark-bg text-gray-300 font-sans h-screen overflow-hidden flex flex-col select-none">

      {/* BEGIN: SubNavigation */}
      <nav className="bg-header-bg px-8 py-2 flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider" data-purpose="booster-sub-nav">
        <div className="flex items-center space-x-2 text-gray-500 mr-4">
          <button
            aria-label="Previous"
            onClick={() => handleTabStep(-1)}
            className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded"
          >
            &lt;
          </button>
          <button
            aria-label="Next"
            onClick={() => handleTabStep(1)}
            className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded"
          >
            &gt;
          </button>
        </div>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Library" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Library")}>Library</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Boost Tab" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Boost Tab")}>Boost</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Booster Prime" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Booster Prime")}>Booster Prime</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Settings" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Settings")}>Settings</button>
      </nav>
      {/* END: SubNavigation */}

      {/* BEGIN: MainContent */}
<main className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-purpose="dashboard-content">

      {/* Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-boost-title">
          <div className="bg-[#111] border border-gray-700 rounded p-6 max-w-lg w-full shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 id="confirm-boost-title" className="text-xl font-bold text-white flex items-center space-x-2">
                <span className="text-yellow-500" aria-hidden="true">⚠️</span>
                <span>Confirm Process Termination</span>
              </h2>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="text-gray-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green rounded p-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              You are about to terminate <strong className="text-white">{selectedPids.length}</strong> processes. This will free approximately <strong className="text-razer-green">{memoryFreedGB} GB</strong> of RAM.
            </p>

            <div className="bg-black border border-gray-800 rounded max-h-60 overflow-y-auto mb-6 custom-scrollbar p-2">
              <ul className="space-y-1">
                {selectedProcesses.map(p => (
                  <SelectedProcessItem key={p.pid} proc={p} />
                ))}
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded text-sm font-bold text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBoostConfirmed}
                className="bg-razer-green hover:bg-green-400 text-black font-black px-6 py-2 rounded text-sm uppercase tracking-wider transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 shadow-[0_0_10px_rgba(68,214,44,0.2)]"
              >
                Confirm Kill
              </button>
            </div>
          </div>
        </div>
      )}


        {currentTab === 'Library' && (
          <div className="animate-fade-in flex flex-col space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="text-razer-green mr-3" aria-hidden="true">📚</span> My Library
              </h2>
              <button
                onClick={() => handleScanGames(true)}
                disabled={isScanning}
                className={`flex items-center justify-center space-x-2 bg-razer-green hover:bg-green-500 text-black font-black py-2.5 px-6 rounded-sm text-sm uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(68,214,44,0.3)] ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isScanning ? <><Loader2 size={16} className="animate-spin" /><span>Scanning...</span></> : <span>Scan Games</span>}
              </button>
            </div>

            {installedGames.length === 0 ? (
              <div className="bg-panel-bg p-12 rounded border border-gray-800 text-center flex flex-col items-center justify-center space-y-4">
                <span className="text-5xl opacity-50" aria-hidden="true">🎮</span>
                <p className="text-gray-400 text-lg">No games found in your library.</p>
                <button
                  onClick={() => handleScanGames(true)}
                  disabled={isScanning}
                  className={`mt-2 flex items-center justify-center space-x-2 bg-razer-green hover:bg-green-500 text-black font-black py-2.5 px-6 rounded-sm text-sm uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(68,214,44,0.3)] ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isScanning ? <><Loader2 size={16} className="animate-spin" /><span>Scanning...</span></> : <span>Scan Games Now</span>}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {installedGames.map(game => (
                  <div key={game.id} className="group bg-panel-bg rounded border border-gray-800 hover:border-razer-green transition-all duration-300 overflow-hidden relative flex flex-col h-48 shadow-lg">
                    {/* Background Pattern/Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-black/60 z-0"></div>

                    {/* Card Content */}
                    <div className="relative z-10 p-5 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-900 rounded-lg shadow-inner flex items-center justify-center overflow-hidden mb-3 border border-gray-700 group-hover:border-razer-green/50 transition-colors">
                        {game.icon_path ? (
                          <img src={game.icon_path} alt={game.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl opacity-70" aria-hidden="true">🕹️</span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-center w-full truncate px-2">{game.title}</h3>
                    </div>

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center space-y-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLaunchGame(game); }}
                        className="bg-razer-green hover:bg-green-400 text-black font-black py-2 px-8 rounded-full text-sm uppercase tracking-wider transform hover:scale-105 transition-all shadow-[0_0_15px_rgba(68,214,44,0.4)] flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <Play size={16} fill="currentColor" />
                        <span>Play & Boost</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedGameProfile(game); }}
                        className="text-gray-300 hover:text-white flex items-center space-x-2 text-xs uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1"
                      >
                        <Settings size={14} />
                        <span>Configure Profile</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'Boost Tab' && (
          <>

        {/* BEGIN: Telemetry Dashboard */}
        <TelemetryDashboard />
        {/* END: Telemetry Dashboard */}


        {/* Session Analytics Card */}





            {/* BEGIN: OptimizationSummary */}
        <section className="flex items-center justify-between mb-10 bg-panel-bg p-6 rounded-sm border-l-4 border-razer-green shadow-lg" data-purpose="summary-card">
          <div className="flex items-center space-x-6">
            {/* Circular Progress Placeholder */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-razer-green rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)' }}></div>
              <span className="text-razer-green text-xl" aria-hidden="true">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">28 items will be optimized</h1>
              <p className="text-sm text-gray-500 font-medium">Found 63 items ready for optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <label htmlFor="boost-profile" className="text-xs font-bold uppercase text-gray-400">Profile</label>
              <select
                id="boost-profile"
                value={boostProfile}
                onChange={(e) => setBoostProfile(e.target.value as 'Aggressive' | 'Conservative' | 'Custom')}
                className="bg-black border border-gray-700 text-white text-xs uppercase tracking-wider rounded px-2 py-1.5 focus:outline-none focus:border-razer-green"
              >
                <option value="Aggressive">Aggressive</option>
                <option value="Conservative">Conservative</option>
                <option value="Custom">Custom</option>
              </select>
              {boostProfile === 'Custom' && (
                <button
                  onClick={handleSaveCustomProfile}
                  disabled={isSavingCustomProfile}
                  className={`text-xs font-bold uppercase px-3 py-1.5 rounded border border-gray-700 bg-gray-800 hover:bg-gray-700 text-white ${isSavingCustomProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSavingCustomProfile ? 'Saving...' : 'Save Custom'}
                </button>
              )}
            </div>
            <button
              className="flex items-center space-x-3 cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded"
              onClick={toggleAutoBoost}
              role="switch"
              aria-checked={autoBoost}
              aria-label="Auto-Boost"
            >
              <span className="text-xs font-bold uppercase text-gray-400">Auto-Boost</span>
              {/* Toggle Switch */}
              <div className={`w-10 h-5 rounded-full relative transition-colors ${autoBoost ? 'bg-razer-green' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${autoBoost ? 'right-1' : 'left-1'}`}></div>
              </div>
            </button>
            <div className="flex space-x-4">
              <button
                onClick={handleUndoBoost}
                disabled={isUndoing}
                className={`flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white font-black py-2.5 px-6 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 border border-gray-700 ${isUndoing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUndoing ? <><Loader2 size={16} className="animate-spin" /><span>Undoing...</span></> : <span>Undo Boost</span>}
              </button>
              <button
                onClick={initiateBoost}
                disabled={isBoosting}
                className={`flex items-center justify-center space-x-2 bg-razer-green hover:bg-green-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(68,214,44,0.3)] ${isBoosting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isBoosting ? <><Loader2 size={16} className="animate-spin" /><span>Boosting...</span></> : <span>Boost Now</span>}
              </button>
            </div>
          </div>
        </section>
        {/* END: OptimizationSummary */}

        <section className="mb-10 bg-panel-bg p-6 rounded-sm border border-gray-800 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-white text-lg font-bold">HyperBoost Modes</h3>
              <p className="text-xs text-gray-400 mt-1">One-click chained optimization profiles inspired by premium game booster workflows.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                aria-label="HyperBoost mode"
                value={boostMode}
                onChange={(e) => setBoostMode(e.target.value as 'Esports' | 'AAA' | 'Streaming')}
                className="bg-black border border-gray-700 text-white text-xs uppercase tracking-wider rounded px-3 py-2 focus:outline-none focus:border-razer-green"
              >
                <option value="Esports">Esports (Lowest Latency)</option>
                <option value="AAA">AAA (Max Visual Stability)</option>
                <option value="Streaming">Streaming (Balanced)</option>
              </select>
              <button
                onClick={handleHyperBoost}
                disabled={isHyperBoosting || isBoosting || isPurging || isFlushingNetwork}
                className={`flex items-center justify-center space-x-2 bg-razer-green hover:bg-green-400 text-black font-black py-2.5 px-8 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(68,214,44,0.3)] ${(isHyperBoosting || isBoosting || isPurging || isFlushingNetwork) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isHyperBoosting ? <><Loader2 size={16} className="animate-spin" /><span>HyperBoosting...</span></> : <span>Run HyperBoost</span>}
              </button>
            </div>
          </div>
        </section>

        {/* BEGIN: Enhanced Tools Section */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">


          {/* Power Plan Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Power Plan Switcher</h3>
              <p className="text-xs text-gray-400 mb-4">Forces Windows "High Performance" to ensure CPU clocks stay high and avoid core parking.</p>
            </div>
            <button
              onClick={handleTogglePowerPlan}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green ${isPowerPlanHigh ? 'bg-orange-900/50 text-orange-400 hover:bg-orange-900 border border-orange-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
            >
              {isPowerPlanHigh ? 'Restore Balanced' : 'Enable High Perf.'}
            </button>
          </div>

          {/* Network Flush Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Network Flush</h3>
              <p className="text-xs text-gray-400 mb-4">Cleans the network stack (release/renew IP, flush DNS) to reduce latency and jitter.</p>
            </div>
            <button
              onClick={handleNetworkFlush}
              disabled={isFlushingNetwork}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex items-center justify-center space-x-2 ${isFlushingNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFlushingNetwork ? <><Loader2 size={16} className="animate-spin" /><span>Flushing...</span></> : <span>Flush Network</span>}
            </button>
          </div>

          {/* Monitor Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Start Monitor</h3>
              <p className="text-xs text-gray-400 mb-4">Assigns high priority to your game and lowers background apps.</p>
              <label htmlFor="targetExeInput" className="sr-only">Target Game Executable</label>
              <input
                id="targetExeInput"
                type="text"
                value={targetExe}
                onChange={(e) => setTargetExe(e.target.value)}
                placeholder="Game .exe (e.g., csgo.exe)"
                className="w-full bg-black border border-gray-700 text-white p-2 text-sm rounded mb-4 focus:outline-none focus:border-razer-green"
              />
            </div>
            <button
              onClick={handleToggleMonitor}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green ${isMonitoring ? 'bg-red-900/50 text-red-400 hover:bg-red-900 border border-red-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
            >
              {isMonitoring ? 'Stop Monitor' : 'Start Monitor'}
            </button>
          </div>

          {/* Services Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Suspend Services</h3>
              <p className="text-xs text-gray-400 mb-4">Temporarily disables non-essential Windows services like Print Spooler while you game.</p>
            </div>
            <button
              onClick={handleToggleServices}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green ${isServicesSuspended ? 'bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
            >
              {isServicesSuspended ? 'Restore Services' : 'Suspend Services'}
            </button>
          </div>


          {/* Overlay Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Performance Overlay</h3>
              <p className="text-xs text-gray-400 mb-4">Toggle the on-screen display for FPS, CPU, and RAM metrics while gaming.</p>
            </div>
            <button
              onClick={handleToggleOverlay}
              className="w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
            >
              Toggle Overlay
            </button>
          </div>

          {/* RAM Purge Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Purge RAM</h3>
              <p className="text-xs text-gray-400 mb-4">Force clears standby memory using EmptyWorkingSet API to free up physical RAM for gaming.</p>
            </div>
            <button
              onClick={handlePurgeRam}
              disabled={isPurging}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex items-center justify-center space-x-2 ${isPurging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPurging ? <><Loader2 size={16} className="animate-spin" /><span>Purging...</span></> : <span>Purge RAM</span>}
            </button>
          </div>

        </section>
        {/* END: Enhanced Tools Section */}

        {/* BEGIN: ProcessesSection */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">○</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Processes</h2>
              <span className="text-xs text-gray-500 lowercase ml-2">{selectedPids.length} out of {liveProcesses.length} items will be optimized during boost</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <span>Memory Usage</span>
              <span>▼</span>
            </div>
          </div>
          <div data-purpose="process-grid" className="w-full">
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={400}
              rowCount={rowCount}
              rowHeight={80}
              width={containerWidth}
              itemData={itemData}
              className="custom-scrollbar"
            >
              {Cell}
            </Grid>
          </div>
        </section>
        {/* END: ProcessesSection */}
          </>
        )}



        {currentTab === 'Booster Prime' && (
          <div className="flex flex-col space-y-8 animate-fade-in">
            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-yellow-500 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-yellow-500 text-3xl" aria-hidden="true">🔥</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Booster Prime</h1>
                    <p className="text-sm text-gray-500 font-medium">Automatically apply the best competitive settings for popular games.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {primeGames.length > 0 ? (
                primeGames.map((game) => (
                  <div key={game.id} className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold mb-2">{game.name}</h3>
                      <p className="text-xs text-gray-400 mb-4">{game.primeDescription}</p>
                    </div>
                    <button
                      onClick={() => handleTweakGame(game.name)}
                      disabled={isTweaking}
                      className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-yellow-600 border border-gray-700 ${isTweaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isTweaking ? 'Optimizing...' : `Optimize ${game.name}`}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center p-8 bg-panel-bg rounded border border-gray-800 flex flex-col items-center">
                  <span className="text-3xl opacity-50 block mb-2" aria-hidden="true">🎮</span>
                  <p className="text-gray-400 mb-4">No supported Booster Prime games found on this system.</p>
                  <button
                    onClick={() => setCurrentTab('Library')}
                    className="bg-razer-green hover:bg-green-500 text-black font-black py-2 px-6 rounded-sm text-sm uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(68,214,44,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green"
                  >
                    Go to Library
                  </button>
                </div>
              )}
            </div>

            {/* Injected System Booster Tools */}
            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-blue-500 shadow-lg" data-purpose="clean-system-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-blue-500 text-3xl" aria-hidden="true">🧹</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">System Cleaner</h1>
                    <p className="text-sm text-gray-500 font-medium">Reclaims disk space by thoroughly wiping temporary files.</p>
                  </div>
                </div>
                <button
                  onClick={handleCleanSystem}
                  disabled={isCleaning}
                  className={`flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)] ${isCleaning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCleaning ? <><Loader2 size={16} className="animate-spin" /><span>Cleaning...</span></> : <span>Clean Now</span>}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center">
                <button
                  role="checkbox"
                  aria-checked={includeShaders}
                  onClick={() => setIncludeShaders(!includeShaders)}
                  className="flex items-center space-x-3 text-sm text-gray-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <div className={`w-5 h-5 flex items-center justify-center border rounded ${includeShaders ? 'bg-blue-500 border-blue-500 text-black' : 'border-gray-600 bg-black'}`}>
                    {includeShaders && <span>✓</span>}
                  </div>
                  <span>Include GPU Shader Caches & Windows Prefetch files</span>
                </button>
              </div>
              {cleanerStats && (
                <div className="mt-6 bg-blue-900/20 border border-blue-500/50 rounded p-4 animate-fade-in flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h4 className="text-blue-400 font-bold text-lg flex items-center">
                            <span className="mr-2">✓</span> Clean Complete
                        </h4>
                        <p className="text-white text-2xl font-black mt-1">{cleanerStats.freed.toFixed(2)} MB <span className="text-sm font-normal text-gray-400 tracking-wide uppercase">Freed</span></p>
                    </div>
                    <div className="mt-4 md:mt-0 text-xs text-gray-400 max-w-sm text-right">
                        <span className="font-bold text-gray-300 block mb-1">Details Breakdown:</span>
                        {cleanerStats.details.split(' | ').map((d, i) => (
                            <div key={i}>{d}</div>
                        ))}
                    </div>
                </div>
              )}
            </section>

            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-purple-500 shadow-lg" data-purpose="startup-optimize-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-purple-500 text-3xl" aria-hidden="true">🚀</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Startup Optimizer</h1>
                    <p className="text-sm text-gray-500 font-medium">Improves boot times by disabling non-essential applications.</p>
                  </div>
                </div>
                <button
                  onClick={handleOptimizeStartup}
                  disabled={isOptimizing}
                  className={`flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isOptimizing ? <><Loader2 size={16} className="animate-spin" /><span>Optimizing...</span></> : <span>Optimize Now</span>}
                </button>
              </div>
            </section>
          </div>
        )}




        {currentTab === 'Settings' && (
          <div className="flex flex-col space-y-8 animate-fade-in">
            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-gray-500 shadow-lg">
              <div className="flex items-center space-x-6">
                <div className="text-gray-400 text-3xl"><Settings size={32} /></div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Application Settings</h1>
                  <p className="text-sm text-gray-500 font-medium">Customize global hotkeys and preferences.</p>
                </div>
              </div>
            </section>

            <div className="bg-panel-bg p-6 rounded-sm border border-gray-800 space-y-6">
              <h2 className="text-lg font-bold text-white mb-4">Global Hotkeys</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="boostHotkey" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Boost Game Hotkey</label>
                  <input
                    id="boostHotkey"
                    type="text"
                    value={boostHotkey}
                    onChange={(e) => setBoostHotkey(e.target.value)}
                    aria-describedby="boostHotkey-help"
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-razer-green focus:outline-none transition-colors"
                    placeholder="e.g. alt+b"
                  />
                  <p id="boostHotkey-help" className="text-xs text-gray-500 mt-2">Trigger game boost optimizations instantly.</p>
                </div>

                <div>
                  <label htmlFor="overlayHotkey" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Performance Overlay Hotkey</label>
                  <input
                    id="overlayHotkey"
                    type="text"
                    value={overlayHotkey}
                    onChange={(e) => setOverlayHotkey(e.target.value)}
                    aria-describedby="overlayHotkey-help"
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-razer-green focus:outline-none transition-colors"
                    placeholder="e.g. alt+o"
                  />
                  <p id="overlayHotkey-help" className="text-xs text-gray-500 mt-2">Toggle the click-through telemetry overlay.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={handleUpdateHotkeys}
                  disabled={isUpdatingHotkeys}
                  className={`bg-razer-green hover:bg-green-500 text-black font-black py-2.5 px-8 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(68,214,44,0.3)] ${isUpdatingHotkeys ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUpdatingHotkeys ? 'Saving...' : 'Save Hotkeys'}
                </button>
              </div>
            </div>

            <div className="bg-panel-bg p-6 rounded-sm border border-gray-800 space-y-6">
              <h2 className="text-lg font-bold text-white mb-4">System Tray</h2>
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h3 className="text-gray-200 text-sm font-bold">Minimize to System Tray Instead of Closing</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {trayMode
                      ? "App will minimize to tray when closed. Click tray icon to restore."
                      : "App will exit when closed (normal behavior)."}
                  </p>
                </div>
                <button
                  onClick={handleToggleTrayMode}
                  role="switch"
                  aria-checked={trayMode}
                  aria-label="Toggle System Tray Integration"
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none ${trayMode ? 'bg-razer-green' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${trayMode ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}


{/* Output Console Box (moved from old design) */}
        <SystemConsole logs={logs} />
      </main>
      {/* END: MainContent */}


      {/* Profile Configuration Modal */}
      {selectedGameProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="bg-panel-bg w-full max-w-md rounded-lg shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
              <h2 id="profile-modal-title" className="text-white font-bold text-lg">{selectedGameProfile.title} Profile</h2>
              <button aria-label="Close Profile"
                onClick={() => setSelectedGameProfile(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400 mb-6">Select which optimizations apply when launching this game.</p>

              {/* Toggles */}
              {[
                { key: 'high_priority', label: 'High Priority Mode', desc: 'Elevates game priority and lowers background apps.' },
                { key: 'network_flush', label: 'Network Flush', desc: 'Clears DNS cache and resets IP stack for lower ping.' },
                { key: 'power_plan', label: 'High Performance Plan', desc: 'Forces Windows power plan to maximize CPU clocks.' },
                { key: 'suspend_services', label: 'Suspend Services', desc: 'Pauses non-essential Windows background services.' },
                { key: 'ram_purge', label: 'Purge RAM', desc: 'Clears standby memory to free up physical RAM.' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <div className="flex-1 pr-4">
                    <h3 className="text-gray-200 text-sm font-bold">{setting.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleProfileSetting(setting.key as keyof GameProfile)}
                    role="switch"
                    aria-checked={selectedGameProfile.profile[setting.key as keyof GameProfile]}
                    aria-label={setting.label}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none ${selectedGameProfile.profile[setting.key as keyof GameProfile] ? 'bg-razer-green' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${selectedGameProfile.profile[setting.key as keyof GameProfile] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-black/50 flex justify-end">
              <button
                onClick={() => setSelectedGameProfile(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2 px-6 rounded uppercase tracking-wider transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {sessionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="summary-modal-title" className="bg-panel-bg w-full max-w-lg rounded-lg shadow-[0_0_30px_rgba(68,214,44,0.15)] border border-razer-green flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-razer-green opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black relative z-10">
              <h2 id="summary-modal-title" className="text-white font-bold text-lg flex items-center"><span className="text-razer-green mr-2" aria-hidden="true">📊</span> Session Summary</h2>
              <button aria-label="Close Summary"
                onClick={() => setSessionSummary(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 relative z-10">
              <p className="text-sm text-gray-300 mb-6 font-medium text-center">Your game just closed. Here is how Nexus Booster improved your session:</p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-black bg-opacity-50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                  <span className="text-3xl font-black text-razer-green mb-1">+{sessionSummary.fps}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Avg FPS</span>
                </div>
                <div className="bg-black bg-opacity-50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                  <span className="text-3xl font-black text-blue-400 mb-1">+{sessionSummary.lows}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">1% Lows</span>
                </div>
                <div className="bg-black bg-opacity-50 p-4 rounded border border-gray-800 flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                  <span className="text-3xl font-black text-purple-400 mb-1">{sessionSummary.ram}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">GB RAM Cleared</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-black/50 flex justify-center relative z-10">
              <button
                onClick={() => setSessionSummary(null)}
                className="bg-razer-green hover:bg-green-500 text-black font-black py-2.5 px-8 rounded-sm text-sm uppercase tracking-tighter transition-all shadow-[0_0_15px_rgba(68,214,44,0.3)]"
              >
                Awesome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
