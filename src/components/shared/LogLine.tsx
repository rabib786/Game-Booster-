import React from 'react';

export interface LogLineProps {
  log: string;
}

/**
 * Log line component for displaying console log messages
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const LogLine: React.FC<LogLineProps> = React.memo(({ log }) => {
  const isError = log.includes('Error') || log.includes('Failed');
  
  return (
    <p className={isError ? 'text-red-500' : 'text-razer-green'}>{log}</p>
  );
});

LogLine.displayName = 'LogLine';