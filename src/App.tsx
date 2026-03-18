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
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [autoBoost, setAutoBoost] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([
    'cpu-core', 'cpu-sleep', 'power', 'clipboard', 'explorer', 'ram', 'cortana', 'telemetry'
  ]);

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
        addLog(`[Web Preview] Optimized: ${selectedItems.length} items`);
        setIsBoosting(false);
      }, 1500);
      return;
    }

    setIsBoosting(false);
  };

  const toggleAutoBoost = () => setAutoBoost(!autoBoost);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const specialItems = [
    { id: 'cpu-core', icon: 'CPU', label: 'Enable CPU Core' },
    { id: 'cpu-sleep', icon: 'ZZZ', label: 'Disable CPU Sleep Mode' },
    { id: 'power', icon: '⚡', label: 'Enable power solutions' },
    { id: 'clipboard', icon: '📋', label: 'Clear clipboard' },
    { id: 'explorer', icon: 'EXE', label: 'explorer.exe' },
    { id: 'ram', icon: 'RAM', label: 'Clean RAM' },
    { id: 'cortana', icon: 'C', label: 'Disable Cortana', desc: 'Disable Cortana virtual assistant', highlight: true },
    { id: 'telemetry', icon: 'TEL', label: 'Disable Telemetry' }
  ];

  return (
    <div className="bg-dark-bg text-gray-300 font-sans h-screen overflow-hidden flex flex-col select-none">
      {/* BEGIN: MainHeader */}
      <header className="bg-black text-xs font-bold uppercase tracking-widest border-b border-gray-800" data-purpose="app-top-nav">
        <div className="flex items-center justify-between px-4 h-10">
          <div className="flex items-center space-x-6">
            {/* Logo Placeholder */}
            <div className="w-6 h-6 bg-razer-green rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm transform rotate-45"></div>
            </div>
            <nav className="flex space-x-8">
              <a className="hover:text-razer-green transition-colors" href="#">Launcher</a>
              <a className="text-razer-green glass-border pb-1" href="#">Game Booster</a>
              <a className="hover:text-razer-green transition-colors" href="#">System Booster</a>
            </nav>
          </div>
          {/* Window Controls */}
          <div className="flex items-center space-x-4 text-gray-500">
            <button className="hover:text-white transition-colors">⚙️</button>
            <button className="hover:text-white transition-colors">—</button>
            <button className="hover:text-white transition-colors">▢</button>
            <button className="hover:text-red-500 transition-colors">✕</button>
          </div>
        </div>
      </header>
      {/* END: MainHeader */}

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

        {/* BEGIN: SpecialsSection */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-razer-green">●</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Specials</h2>
              <span className="text-xs text-gray-500 lowercase ml-2">{selectedItems.length} out of 12 items will be optimized during boost</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="optimization-grid">
            {specialItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={
                  item.highlight
                    ? `bg-gray-800 p-4 flex items-center space-x-4 border border-razer-green ring-1 ring-razer-green ring-opacity-50 shadow-lg scale-105 z-10 cursor-pointer`
                    : `bg-panel-bg p-4 flex items-center space-x-4 border border-transparent hover:border-gray-700 transition-colors group cursor-pointer`
                }
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded ${item.highlight ? 'bg-razer-green' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                  <span className={item.highlight ? 'text-black text-xs font-bold' : 'text-xs'}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${item.highlight ? 'font-bold text-white' : 'font-semibold text-gray-300'}`}>{item.label}</p>
                  {item.desc && <p className="text-[10px] text-razer-green uppercase">{item.desc}</p>}
                </div>
                {selectedItems.includes(item.id) && <span className="text-razer-green check-icon">✓</span>}
              </div>
            ))}
          </div>
        </section>
        {/* END: SpecialsSection */}

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

      {/* BEGIN: BottomTaskbar */}
      <footer className="bg-black/95 h-10 border-t border-gray-900 flex items-center justify-center space-x-6 relative shrink-0" data-purpose="windows-taskbar">
        <div className="flex items-center space-x-4">
          <div className="w-4 h-4 bg-blue-400/20 rounded-sm"></div>
          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
          <div className="w-6 h-6 border-b-2 border-blue-400 flex items-center justify-center bg-gray-800 rounded">
            <span className="text-[10px]">⚡</span>
          </div>
          <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
        </div>
        <div className="absolute right-4 flex items-center space-x-4 text-[10px] text-gray-400 font-medium">
          <div className="flex flex-col items-end">
            <span>8:01 AM</span>
            <span>3/21/2022</span>
          </div>
        </div>
      </footer>
      {/* END: BottomTaskbar */}
    </div>
  );
}
