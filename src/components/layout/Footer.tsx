import React from 'react';

export interface FooterProps {
  version?: string;
  showStatus?: boolean;
}

/**
 * Application footer component
 */
export const Footer: React.FC<FooterProps> = ({
  version = 'v1.0.0',
  showStatus = true,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-footer-bg px-8 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-6 mb-4 md:mb-0">
          <div className="text-sm text-gray-500">
            © {currentYear} Nexus Game Booster. All rights reserved.
          </div>
          {showStatus && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Backend Connected</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-xs text-gray-500">
            Version: <span className="text-gray-300">{version}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="text-xs text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
              aria-label="Documentation"
            >
              Docs
            </button>
            <button 
              className="text-xs text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
              aria-label="Support"
            >
              Support
            </button>
            <button 
              className="text-xs text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-razer-green rounded"
              aria-label="Feedback"
            >
              Feedback
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center md:text-left">
        <p className="text-xs text-gray-600">
          This software is provided "as is" without warranty of any kind. Use at your own risk.
          Game Booster optimizes system resources but may not improve performance in all scenarios.
        </p>
      </div>
    </footer>
  );
};