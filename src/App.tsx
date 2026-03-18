/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Zap, Trash2, Cpu, HardDrive, Download, Rocket } from 'lucide-react';

// Declare eel for TypeScript
declare global {
  interface Window {
    eel: any;
  }
}

export default function App() {
  const [logs, setLogs] = useState<string[]>(['> System ready...']);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
        addLog('[Web Preview] Closed: spotify.exe, discord.exe');
        setIsBoosting(false);
      }, 1500);
      return;
    }

    setIsBoosting(false);
  };

  const handleClean = async () => {
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
      // Fallback for web preview mode if Eel is not available
      setTimeout(() => {
        const freed = (Math.random() * 1000 + 100).toFixed(2);
        addLog(`[Web Preview] Cleaned ${freed} MB of Junk from %TEMP%.`);
        setIsCleaning(false);
      }, 2000);
      return;
    }

    setIsCleaning(false);
  };

  const handleOptimize = async () => {
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
      // Fallback for web preview mode if Eel is not available
      setTimeout(() => {
        const disabledCount = Math.floor(Math.random() * 3) + 1;
        const apps = ['spotify', 'discord', 'skype', 'onedrive'].sort(() => 0.5 - Math.random()).slice(0, disabledCount);
        addLog(`[Web Preview] Disabled ${disabledCount} startup programs.`);
        addLog(`[Web Preview] Disabled: ${apps.join(', ')}`);
        setIsOptimizing(false);
      }, 1800);
      return;
    }

    setIsOptimizing(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-200 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Header */}
        <header className="text-center space-y-3">
          <h1 className="text-5xl font-black tracking-widest text-white">
            NEXUS <span className="text-[#00ffcc] drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]">BOOSTER</span>
          </h1>
          {!window.eel && (
            <p className="text-gray-500 tracking-wide uppercase text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Web Preview Mode
            </p>
          )}
        </header>

        {/* Main Actions */}
        <main className="grid md:grid-cols-3 gap-6">
          {/* Game Booster Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#00ffcc]/30 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-[#00ffcc]/10 flex items-center justify-center mb-4">
              <Cpu className="w-8 h-8 text-[#00ffcc]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Booster</h2>
            <p className="text-gray-400 text-sm mb-8 flex-grow">Kill background apps to free up RAM and CPU.</p>
            <button
              onClick={handleBoost}
              disabled={isBoosting}
              className="w-full py-4 px-6 rounded-lg font-bold tracking-widest uppercase transition-all border-2 border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-[#0a0a0c] hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBoosting ? 'Boosting...' : 'Boost Game'}
            </button>
          </div>

          {/* System Cleaner Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#b026ff]/30 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-[#b026ff]/10 flex items-center justify-center mb-4">
              <HardDrive className="w-8 h-8 text-[#b026ff]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">System Cleaner</h2>
            <p className="text-gray-400 text-sm mb-8 flex-grow">Clear temporary files to free up disk space.</p>
            <button
              onClick={handleClean}
              disabled={isCleaning}
              className="w-full py-4 px-6 rounded-lg font-bold tracking-widest uppercase transition-all border-2 border-[#b026ff] text-[#b026ff] hover:bg-[#b026ff] hover:text-white hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCleaning ? 'Cleaning...' : 'Clean System'}
            </button>
          </div>

          {/* Startup Optimizer Card */}
          <div className="bg-[#151518] border border-white/5 rounded-xl p-8 text-center transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#ff9900]/30 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-4">
              <Rocket className="w-8 h-8 text-[#ff9900]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Startup Optimizer</h2>
            <p className="text-gray-400 text-sm mb-8 flex-grow">Disable non-essential startup apps for faster boot.</p>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full py-4 px-6 rounded-lg font-bold tracking-widest uppercase transition-all border-2 border-[#ff9900] text-[#ff9900] hover:bg-[#ff9900] hover:text-[#0a0a0c] hover:shadow-[0_0_20px_rgba(255,153,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Startup'}
            </button>
          </div>
        </main>

        {/* Console */}
        <div className="bg-[#050505] border border-[#222] rounded-lg p-4 font-mono">
          <div className="flex items-center gap-2 text-gray-500 mb-3 border-b border-[#222] pb-2">
            <Terminal className="w-4 h-4" />
            <h3 className="text-xs uppercase tracking-widest">System Logs</h3>
          </div>
          <div className="h-40 overflow-y-auto text-[#00ff00] text-sm space-y-1">
            {logs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
