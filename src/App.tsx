/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

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
}

interface Game {
  id: string;
  title: string;
  exe_path: string;
  exe_name: string;
  icon_path: string | null;
  profile: GameProfile;
}

function App() {
  const [logs, setLogs] = useState<string[]>(['> System ready...']);
  const [isBoosting, setIsBoosting] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Boost Tab' | 'System Booster' | 'Booster Prime'>('Boost Tab');
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [autoBoost, setAutoBoost] = useState(false);


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


  const handleScanGames = async () => {
    addLog('Scanning for installed games...');
    if (window.eel) {
      try {
        const games = await window.eel.scan_games()();
        setInstalledGames(games);
        addLog(`Found ${games.length} games.`);
      } catch (error) {
        addLog(`Error scanning games: ${error}`);
      }
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
        const result = await window.eel.boost_game()();
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

  return (
    <div className="bg-dark-bg text-gray-300 font-sans h-screen overflow-hidden flex flex-col select-none">

      {/* BEGIN: SubNavigation */}
      <nav className="bg-header-bg px-8 py-2 flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider" data-purpose="booster-sub-nav">
        <div className="flex items-center space-x-2 text-gray-500 mr-4">
          <button className="hover:text-white">&lt;</button>
          <button className="hover:text-white">&gt;</button>
        </div>
        <a className={`transition-colors cursor-pointer ${currentTab === "Boost Tab" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Boost Tab")}>Boost</a>
        <a className={`transition-colors cursor-pointer ${currentTab === "Booster Prime" ? "text-razer-green border-b-2 border-razer-green pb-1" : "text-gray-500 hover:text-white"}`} onClick={() => setCurrentTab("Booster Prime")}>Booster Prime</a>
      </nav>
      {/* END: SubNavigation */}

      {/* BEGIN: MainContent */}
<main className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-purpose="dashboard-content">

        {currentTab === 'Boost Tab' && (
          <>

        {/* Session Analytics Card */}
        {sessionSummary && (
          <section className="mb-10 bg-gradient-to-r from-gray-900 to-black p-6 rounded-sm border border-razer-green shadow-lg animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-razer-green opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center"><span className="text-razer-green mr-2">📊</span> Session Summary</h2>
            <p className="text-sm text-gray-300 mb-6 font-medium">Your game just closed. Here is how Nexus Booster improved your session:</p>
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
          </section>
        )}


        {/* Games Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="text-razer-green mr-2">🎮</span> My Games
            </h2>
            <button
              onClick={handleScanGames}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm uppercase tracking-wider transition-colors border border-gray-700"
            >
              Scan Games
            </button>
          </div>

          {installedGames.length === 0 ? (
            <div className="bg-panel-bg p-8 rounded border border-gray-800 text-center">
              <p className="text-gray-500 mb-2">No games found.</p>
              <p className="text-xs text-gray-600">Click Scan Games to search your Steam library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedGames.map(game => (
                <div key={game.id} className="bg-panel-bg p-4 rounded border border-gray-800 hover:border-razer-green transition-colors flex items-center space-x-4 cursor-pointer" onClick={() => handleLaunchGame(game)}>
                  <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
                    {game.icon_path ? (
                      <img src={game.icon_path} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🕹️</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm truncate w-40">{game.title}</h3>
                    <p className="text-xs text-razer-green">Click to Launch & Boost</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
              <span className="text-xs text-gray-500 lowercase ml-2">0 out of 19 items will be optimized during boost</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <span>Memory Usage</span>
              <span>▼</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-70" data-purpose="process-grid">
            {/* Process 1 */}
            <div className="p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-default">
              <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-[10px]">G</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">Google Chrome</p>
                <p className="text-xs text-gray-500">4 GB</p>
              </div>
            </div>
            {/* Process 2 */}
            <div className="p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-default">
              <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-[10px]">Q</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">QQ</p>
                <p className="text-xs text-gray-500">196 MB</p>
              </div>
            </div>
            {/* Process 3 */}
            <div className="p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-default">
              <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-[10px]">T</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">Microsoft Teams</p>
                <p className="text-xs text-gray-500">18 MB</p>
              </div>
            </div>
            {/* Process 4 */}
            <div className="p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-default">
              <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-[10px]">S</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">Host Process Services</p>
                <p className="text-xs text-gray-500">17 MB</p>
              </div>
            </div>
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
              <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-bold mb-2">Cyberpunk 2077</h3>
                  <p className="text-xs text-gray-400 mb-4">Enables DLSS and disables V-Sync for maximum framerates.</p>
                </div>
                <button
                  onClick={() => handleTweakGame('Cyberpunk 2077')}
                  disabled={isTweaking}
                  className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-yellow-600 border border-gray-700 ${isTweaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTweaking ? 'Optimizing...' : 'Optimize Cyberpunk'}
                </button>
              </div>

              <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-bold mb-2">Warzone</h3>
                  <p className="text-xs text-gray-400 mb-4">Enables DLSS and disables V-Sync for competitive advantage.</p>
                </div>
                <button
                  onClick={() => handleTweakGame('Warzone')}
                  disabled={isTweaking}
                  className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors bg-gray-800 text-white hover:bg-yellow-600 border border-gray-700 ${isTweaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTweaking ? 'Optimizing...' : 'Optimize Warzone'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'System Booster' && (
          <div className="flex flex-col space-y-8">
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

    </div>
  );
}

export default App;
