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

export default function App() {
  const [logs, setLogs] = useState<string[]>(['> System ready...']);
  const [isBoosting, setIsBoosting] = useState(false);
  const [currentTab, setCurrentTab] = useState<'Game Booster' | 'System Booster'>('Game Booster');
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [autoBoost, setAutoBoost] = useState(false);

  const [targetExe, setTargetExe] = useState('csgo.exe');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isServicesSuspended, setIsServicesSuspended] = useState(false);


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
    if (!window.eel) {
      addLog(`[Web Preview] ${isMonitoring ? 'Stopped' : 'Started'} monitoring ${targetExe}`);
      setIsMonitoring(!isMonitoring);
      return;
    }

    if (isMonitoring) {
      const res = await window.eel.stop_monitor()();
      if (res.status === 'success') {
        addLog(res.message);
        setIsMonitoring(false);
      } else {
        addLog(`Error: ${res.message}`, true);
      }
    } else {
      const res = await window.eel.start_monitor(targetExe)();
      if (res.status === 'success') {
        addLog(res.message);
        setIsMonitoring(true);
      } else {
        addLog(`Error: ${res.message}`, true);
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




  return (
    <div className="bg-dark-bg text-gray-300 font-sans h-screen overflow-hidden flex flex-col select-none">

      {/* BEGIN: SubNavigation */}
      <nav className="bg-header-bg px-8 py-2 flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider" data-purpose="booster-sub-nav">
        <div className="flex items-center space-x-2 text-gray-500 mr-4">
          <button className="hover:text-white">&lt;</button>
          <button className="hover:text-white">&gt;</button>
        </div>
        <a className="text-razer-green border-b-2 border-razer-green pb-1" href="#">Boost</a>
        <a className="text-gray-500 hover:text-white transition-colors" href="#">Booster Prime</a>
      </nav>
      {/* END: SubNavigation */}

      {/* BEGIN: MainContent */}
<main className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-purpose="dashboard-content">

        {currentTab === 'Game Booster' && (
          <>
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
        <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Monitor Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">Process Monitor</h3>
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
              <h3 className="text-white font-bold mb-2">Service Suspension</h3>
              <p className="text-xs text-gray-400 mb-4">Temporarily disables non-essential Windows services like Print Spooler while you game.</p>
            </div>
            <button
              onClick={handleToggleServices}
              className={`w-full py-2 font-bold text-sm uppercase tracking-wider rounded transition-colors ${isServicesSuspended ? 'bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}
            >
              {isServicesSuspended ? 'Restore Services' : 'Suspend Services'}
            </button>
          </div>

          {/* RAM Purge Card */}
          <div className="bg-panel-bg p-5 rounded-sm border border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold mb-2">RAM Purge</h3>
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
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">System Console Logs</h2>
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
