import React from 'react';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Sidebar component (optional, can be used for additional navigation or info)
 */
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  if (collapsed) {
    return (
      <aside className="w-16 bg-sidebar-bg border-r border-gray-800 flex flex-col items-center py-6">
        <button
          onClick={onToggleCollapse}
          className="mb-8 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
          aria-label="Expand sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <div className="space-y-6">
          <button className="text-gray-400 hover:text-white" aria-label="Dashboard">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-sidebar-bg border-r border-gray-800 flex flex-col py-6">
      <div className="px-6 mb-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Quick Actions</h2>
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2 px-4">
          <li>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-razer-green">
              <span className="text-razer-green">⚡</span>
              <span>Quick Boost</span>
            </button>
          </li>
          <li>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-razer-green">
              <span className="text-blue-400">📊</span>
              <span>Performance Monitor</span>
            </button>
          </li>
          <li>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-razer-green">
              <span className="text-yellow-400">🎮</span>
              <span>Game Profiles</span>
            </button>
          </li>
          <li>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-razer-green">
              <span className="text-purple-400">⚙️</span>
              <span>System Settings</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="px-6 mt-8 pt-6 border-t border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-green-400">42%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">RAM Free</span>
              <span className="text-green-400">8.2 GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">GPU Temp</span>
              <span className="text-yellow-400">65°C</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};