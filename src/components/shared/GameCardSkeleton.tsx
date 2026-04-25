import React from 'react';

/**
 * Skeleton loading component for GameCard
 */
export const GameCardSkeleton: React.FC = React.memo(() => {
  return (
    <div className="group bg-panel-bg rounded border border-gray-800 overflow-hidden relative flex flex-col h-48 shadow-lg animate-pulse">
      {/* Background Pattern/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-black/60 z-0"></div>

      {/* Card Content */}
      <div className="relative z-10 p-5 flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-700 rounded-lg shadow-inner flex items-center justify-center overflow-hidden mb-3 border border-gray-700">
          {/* Placeholder for icon */}
          <div className="w-full h-full bg-gray-600"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
      </div>

      {/* Hover Overlay with Actions (hidden in skeleton) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 z-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 bg-gray-700 rounded-full w-32"></div>
        <div className="h-6 bg-gray-800 rounded w-24"></div>
      </div>
    </div>
  );
});

GameCardSkeleton.displayName = 'GameCardSkeleton';