import React from 'react';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

/**
 * Application header component
 */
export const Header: React.FC<HeaderProps> = ({
  title = 'Nexus Game Booster',
  subtitle = 'Optimize your gaming experience',
  showLogo = true,
}) => {
  return (
    <header className="flex items-center justify-between p-6 border-b border-gray-800 bg-header-bg">
      <div className="flex items-center space-x-4">
        {showLogo && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-razer-green to-green-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>System Connected</span>
        </div>
        <button 
          className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
          aria-label="Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};