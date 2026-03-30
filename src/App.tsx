/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Settings, Play, X } from 'lucide-react';

// Declare eel for TypeScript
declare global {
  interface Window {
    eel: any;
  }
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

// ⚡ Bolt: Extracted TelemetryDashboard to prevent whole-app re-renders
// By moving the 1000ms polling interval here, only this component will re-render
// instead of forcing the entire application (including heavy process/game lists)
// to reconcile on every tick.
const TelemetryDashboard = () => {
  const [telemetry, setTelemetry] = useState({ cpu_usage: 0, ram_usage_gb: 0, gpu_usage: 0, gpu_temp: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (window.eel) {
      interval = setInterval(async () => {
        try {
          const tel = await window.eel.get_telemetry()();
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
};


function App() {
  const [logs, setLogs] = useState<string[]>(['> System ready...']);
  const [isBoosting, setIsBoosting] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Library' | 'Boost Tab' | 'System Booster' | 'Booster Prime' | 'Settings'>('Library');
  const [boostHotkey, setBoostHotkey] = useState('alt+b');
  const [overlayHotkey, setOverlayHotkey] = useState('alt+o');
  const [isUpdatingHotkeys, setIsUpdatingHotkeys] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [autoBoost, setAutoBoost] = useState(false);
  const [liveProcesses, setLiveProcesses] = useState<any[]>([]);
  const [selectedPids, setSelectedPids] = useState<number[]>([]);


  const [selectedGameProfile, setSelectedGameProfile] = useState<Game | null>(null);
  const [installedGames, setInstalledGames] = useState<Game[]>([]);

  const [targetExe, setTargetExe] = useState('csgo.exe');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isTweaking, setIsTweaking] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{fps: number, lows: number, ram: number} | null>(null);
  const [isServicesSuspended, setIsServicesSuspended] = useState(false);
  const [isPowerPlanHigh, setIsPowerPlanHigh] = useState(false);
  const [isFlushingNetwork, setIsFlushingNetwork] = useState(false);

  const [primeGames, setPrimeGames] = useState<{id: string, name: string, primeDescription: string}[]>([]);



  useEffect(() => {
    if (currentTab === 'Boost Tab') {
      const fetchProcesses = async () => {
        if (window.eel) {
          try {
            const procs = await window.eel.get_live_processes()();
            setLiveProcesses(procs);
            // Auto-select top processes if none selected yet, or just select all by default
            if (selectedPids.length === 0 && procs.length > 0) {
              setSelectedPids(procs.slice(0, 10).map((p: any) => p.pid)); // Default select top 10 memory hogs
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
        if (window.eel) {
          try {
            const games = await window.eel.get_prime_games()();
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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Expose a function to Python to add logs asynchronously
  useEffect(() => {
    if (window.eel) {
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
      if (window.eel) {
        const response = await window.eel.launch_game(game.id, game.profile, game.exe_path, game.exe_name)();
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
    addLog('Scanning for installed games...');
    if (window.eel) {
      try {
        const games = await window.eel.scan_games(forceRefresh)();
        setInstalledGames(games);
        addLog(`Found ${games.length} games.`);
      } catch (error) {
        addLog(`Error scanning games: ${error}`);
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
      }, 500);
    }
  };


  const handleToggleOverlay = async () => {
    addLog('Toggling performance overlay...');
    if (window.eel) {
      try {
        const response = await window.eel.toggle_overlay()();
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
    addLog('Initiating System Clean sequence...');
    if (window.eel) {
      try {
        const result = await window.eel.clean_system()();
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to communicate with backend: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Cleaned 150.45 MB of Junk.');
        setIsCleaning(false);
      }, 1000);
      return;
    }
    setIsCleaning(false);
  };

  const handleOptimizeStartup = async () => {
    setIsOptimizing(true);
    addLog('Initiating Startup Optimization sequence...');
    if (window.eel) {
      try {
        const result = await window.eel.optimize_startup()();
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
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Disabled 3 startup programs.');
        setIsOptimizing(false);
      }, 1000);
      return;
    }
    setIsOptimizing(false);
  };

  const handleBoost = async () => {
    setIsBoosting(true);
    addLog('Initiating Game Boost sequence...');

    if (window.eel) {
      try {
        const result = await window.eel.boost_game(selectedPids)();
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
      }
    } else {
      // Fallback for web preview mode if Eel is not available
      setTimeout(() => {
        const freed = (Math.random() * 500 + 200).toFixed(2);
        addLog(`[Web Preview] Freed ${freed} MB of RAM.`);
        addLog(`[Web Preview] Optimized: Process list items`);
        setIsBoosting(false);
      }, 1500);
      return;
    }

    setIsBoosting(false);
  };

  const toggleAutoBoost = () => setAutoBoost(!autoBoost);

  const handleToggleMonitor = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      addLog(`Stopped monitoring ${targetExe}. Reverting priority...`);
      if (window.eel) {
        try {
          await window.eel.stop_monitor()();
          const summaryData = await window.eel.get_session_summary()();
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
      if (window.eel) {
        try {
          const result = await window.eel.start_monitor(targetExe)();
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
      const res = await window.eel.restore_services()();
      if (res.status === 'success') {
        addLog(res.message);
        setIsServicesSuspended(false);
      } else {
        addLog(`Error: ${res.message}`, true);
      }
    } else {
      const res = await window.eel.suspend_services()();
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
    if (window.eel) {
      try {
        const result = await window.eel.tweak_game_settings(gameName)();
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
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Applied Booster Prime settings for ${gameName}.`);
        addLog('Tweaks applied: Enabled DLSS, Disabled V-Sync');
        setIsTweaking(false);
      }, 1000);
      return;
    }
    setIsTweaking(false);
  };

  const handlePurgeRam = async () => {
    setIsPurging(true);
    addLog('Initiating RAM Purge sequence...');
    if (window.eel) {
      try {
        const result = await window.eel.purge_ram()();
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to purge RAM: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Successfully purged system RAM.');
        setIsPurging(false);
      }, 1000);
      return;
    }
    setIsPurging(false);
  };








  const handleTogglePowerPlan = async () => {
    const nextPlan = isPowerPlanHigh ? 'balanced' : 'high_performance';
    setIsPowerPlanHigh(!isPowerPlanHigh);
    addLog(`Initiating Power Plan switch to ${nextPlan}...`);

    if (window.eel) {
      try {
        const result = await window.eel.set_power_plan(nextPlan)();
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
    if (window.eel) {
      try {
        const result = await window.eel.update_hotkeys(boostHotkey, overlayHotkey)();
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to update hotkeys: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog(`[Web Preview] Hotkeys updated: Boost=${boostHotkey}, Overlay=${overlayHotkey}`);
      }, 500);
    }
    setIsUpdatingHotkeys(false);
  };

  const handleNetworkFlush = async () => {
    setIsFlushingNetwork(true);
    addLog('Initiating Network Flush sequence...');

    if (window.eel) {
      try {
        const result = await window.eel.flush_dns_and_reset()();
        if (result.status === 'success') {
          addLog(result.message);
        } else {
          addLog(`Error: ${result.message}`, true);
        }
      } catch (error) {
        addLog(`Failed to flush network: ${error}`, true);
      }
    } else {
      setTimeout(() => {
        addLog('[Web Preview] Network flushed and reset successfully.');
        setIsFlushingNetwork(false);
      }, 1500);
      return;
    }
    setIsFlushingNetwork(false);
  };

  // ⚡ Bolt Optimization: Prevent O(N²) list rendering bottleneck
  // Wraps the massive process list mapping in useMemo so it doesn't re-render
  // on unrelated state changes (like telemetry ticks or keystrokes).
  // Also converts the O(N) array .includes() lookup into an O(1) Set.has() lookup.
  const memoizedProcesses = useMemo(() => {
    const selectedSet = new Set(selectedPids);
    return liveProcesses.map((proc, idx) => {
      const isSelected = selectedSet.has(proc.pid);
      return (
        <div
          key={proc.pid}
          className={`p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-pointer transition-colors ${isSelected ? 'opacity-100 ring-1 ring-razer-green/50 bg-razer-green/5' : 'opacity-50 hover:opacity-100'}`}
          onClick={() => {
            if (isSelected) {
              setSelectedPids(prev => prev.filter(id => id !== proc.pid));
            } else {
              setSelectedPids(prev => [...prev, proc.pid]);
            }
          }}
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
        </div>
      );
    });
  }, [liveProcesses, selectedPids]);

  return (
    <div className="bg-dark-bg text-gray-300 font-sans h-screen overflow-hidden flex flex-col select-none">

      {/* BEGIN: SubNavigation */}
      <nav className="bg-header-bg px-8 py-2 flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider" data-purpose="booster-sub-nav">
        <div className="flex items-center space-x-2 text-gray-500 mr-4">
          <button aria-label="Previous" className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded">&lt;</button>
          <button aria-label="Next" className="hover:text-white focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded">&gt;</button>
        </div>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Library" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Library")}>Library</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Boost Tab" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Boost Tab")}>Boost</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Booster Prime" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Booster Prime")}>Booster Prime</button>
        <button className={`transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:outline-none rounded px-1 ${currentTab === "Settings" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Settings")}>Settings</button>
      </nav>
      {/* END: SubNavigation */}

      {/* BEGIN: MainContent */}
<main className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-purpose="dashboard-content">

        {currentTab === 'Library' && (
          <div className="animate-fade-in flex flex-col space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="text-razer-green mr-3">📚</span> My Library
              </h2>
              <button
                onClick={() => handleScanGames(true)}
                className="bg-razer-green hover:bg-green-500 text-black font-black py-2.5 px-6 rounded-sm text-sm uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(68,214,44,0.3)]"
              >
                Scan Games
              </button>
            </div>

            {installedGames.length === 0 ? (
              <div className="bg-panel-bg p-12 rounded border border-gray-800 text-center flex flex-col items-center justify-center space-y-4">
                <span className="text-5xl opacity-50">🎮</span>
                <p className="text-gray-400 text-lg">No games found in your library.</p>
                <p className="text-sm text-gray-600">Click the Scan Games button to automatically find Steam titles.</p>
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
                          <span className="text-3xl opacity-70">🕹️</span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-center w-full truncate px-2">{game.title}</h3>
                    </div>

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center space-y-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLaunchGame(game); }}
                        className="bg-razer-green hover:bg-green-400 text-black font-black py-2 px-8 rounded-full text-sm uppercase tracking-wider transform hover:scale-105 transition-all shadow-[0_0_15px_rgba(68,214,44,0.4)] flex items-center space-x-2"
                      >
                        <Play size={16} fill="currentColor" />
                        <span>Play & Boost</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedGameProfile(game); }}
                        className="text-gray-300 hover:text-white flex items-center space-x-2 text-xs uppercase tracking-widest font-bold transition-colors"
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
              <span className="text-razer-green text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">28 items will be optimized</h1>
              <p className="text-sm text-gray-500 font-medium">Found 63 items ready for optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={toggleAutoBoost}>
              <span className="text-xs font-bold uppercase text-gray-400">Auto-Boost</span>
              {/* Toggle Switch */}
              <div className={`w-10 h-5 rounded-full relative transition-colors ${autoBoost ? 'bg-razer-green' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${autoBoost ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <button
              onClick={handleBoost}
              disabled={isBoosting}
              className={`bg-razer-green hover:bg-green-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(68,214,44,0.3)] ${isBoosting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBoosting ? 'Boosting...' : 'Boost Now'}
            </button>
          </div>
        </section>
        {/* END: OptimizationSummary */}

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
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors ${isPowerPlanHigh ? 'bg-orange-900/50 text-orange-400 hover:bg-orange-900 border border-orange-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
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
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 ${isFlushingNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFlushingNetwork ? 'Flushing...' : 'Flush Network'}
            </button>
          </div>

          {/* Monitor Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Start Monitor</h3>
              <p className="text-xs text-gray-400 mb-4">Assigns high priority to your game and lowers background apps.</p>
              <input
                type="text"
                value={targetExe}
                onChange={(e) => setTargetExe(e.target.value)}
                placeholder="Game .exe (e.g., csgo.exe)"
                className="w-full bg-black border border-gray-700 text-white p-2 text-sm rounded mb-4 focus:outline-none focus:border-razer-green"
              />
            </div>
            <button
              onClick={handleToggleMonitor}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors ${isMonitoring ? 'bg-red-900/50 text-red-400 hover:bg-red-900 border border-red-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
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
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors ${isServicesSuspended ? 'bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
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
              className="w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
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
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 ${isPurging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPurging ? 'Purging...' : 'Purge RAM'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="process-grid">
            {memoizedProcesses}
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
                  <div className="text-yellow-500 text-3xl">🔥</div>
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
                <div className="col-span-full text-center p-8 bg-panel-bg rounded border border-gray-800">
                  <span className="text-3xl opacity-50 block mb-2">🎮</span>
                  <p className="text-gray-400">No supported Booster Prime games found on this system.</p>
                  <p className="text-sm text-gray-600 mt-2">Install a supported game to see optimization options here.</p>
                </div>
              )}
            </div>

            {/* Injected System Booster Tools */}
            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-blue-500 shadow-lg" data-purpose="clean-system-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-blue-500 text-3xl">🧹</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">System Cleaner</h1>
                    <p className="text-sm text-gray-500 font-medium">Reclaims disk space by thoroughly wiping temporary files.</p>
                  </div>
                </div>
                <button
                  onClick={handleCleanSystem}
                  disabled={isCleaning}
                  className={`bg-blue-500 hover:bg-blue-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)] ${isCleaning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCleaning ? 'Cleaning...' : 'Clean Now'}
                </button>
              </div>
            </section>

            <section className="bg-panel-bg p-6 rounded-sm border-l-4 border-purple-500 shadow-lg" data-purpose="startup-optimize-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-purple-500 text-3xl">🚀</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Startup Optimizer</h1>
                    <p className="text-sm text-gray-500 font-medium">Improves boot times by disabling non-essential applications.</p>
                  </div>
                </div>
                <button
                  onClick={handleOptimizeStartup}
                  disabled={isOptimizing}
                  className={`bg-purple-500 hover:bg-purple-400 text-black font-black py-2.5 px-12 rounded-sm text-sm uppercase tracking-tighter transition-all transform active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
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
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Boost Game Hotkey</label>
                  <input
                    type="text"
                    value={boostHotkey}
                    onChange={(e) => setBoostHotkey(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-razer-green focus:outline-none transition-colors"
                    placeholder="e.g. alt+b"
                  />
                  <p className="text-xs text-gray-500 mt-2">Trigger game boost optimizations instantly.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Performance Overlay Hotkey</label>
                  <input
                    type="text"
                    value={overlayHotkey}
                    onChange={(e) => setOverlayHotkey(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-razer-green focus:outline-none transition-colors"
                    placeholder="e.g. alt+o"
                  />
                  <p className="text-xs text-gray-500 mt-2">Toggle the click-through telemetry overlay.</p>
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
          </div>
        )}


{/* Output Console Box (moved from old design) */}
        <section className="mt-10 mb-8 border-t border-gray-800 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">System Console Log</h2>
          <div className="bg-[#050505] border border-[#222] rounded-lg p-4 font-mono">
            <div className="h-40 overflow-y-auto text-razer-green text-sm space-y-1">
              {logs.map((log, i) => (
                <p key={i} className={log.includes('Error') || log.includes('Failed') ? 'text-red-500' : ''}>{log}</p>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </section>
      </main>
      {/* END: MainContent */}


      {/* Profile Configuration Modal */}
      {selectedGameProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-panel-bg w-full max-w-md rounded-lg shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
              <h2 className="text-white font-bold text-lg">{selectedGameProfile.title} Profile</h2>
              <button aria-label="Close Profile"
                onClick={() => setSelectedGameProfile(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
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
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${selectedGameProfile.profile[setting.key as keyof GameProfile] ? 'bg-razer-green' : 'bg-gray-600'}`}
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
          <div className="bg-panel-bg w-full max-w-lg rounded-lg shadow-[0_0_30px_rgba(68,214,44,0.15)] border border-razer-green flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-razer-green opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black relative z-10">
              <h2 className="text-white font-bold text-lg flex items-center"><span className="text-razer-green mr-2">📊</span> Session Summary</h2>
              <button aria-label="Close Summary"
                onClick={() => setSessionSummary(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
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
