import React from 'react';

/**
 * Skeleton loading component for ProcessItem
 */
export const ProcessItemSkeleton: React.FC = React.memo(() => {
  return (
    <div className="w-full text-left p-3 flex items-center space-x-4 rounded animate-pulse">
      <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center">
        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        <div className="h-2 bg-gray-800 rounded w-1/2"></div>
      </div>
      <div className="flex-shrink-0">
        <div className="w-4 h-4 rounded-full border border-gray-700 bg-transparent"></div>
      </div>
    </div>
  );
});

ProcessItemSkeleton.displayName = 'ProcessItemSkeleton';