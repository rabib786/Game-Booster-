import React from 'react';
import { ProcessInfo } from '../../types/process.types';

export interface ProcessItemProps {
  proc: ProcessInfo;
  isSelected: boolean;
  onToggle: (pid: number) => void;
}

/**
 * Process item component for displaying and selecting processes
 */
export const ProcessItem: React.FC<ProcessItemProps> = React.memo(({
  proc,
  isSelected,
  onToggle,
}) => {
  return (
    <button
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Select ${proc.name}`}
      className={`w-full text-left p-3 flex items-center space-x-4 hover:bg-item-hover rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green ${
        isSelected
          ? 'opacity-100 ring-1 ring-razer-green/50 bg-razer-green/5'
          : 'opacity-50 hover:opacity-100'
      }`}
      onClick={() => onToggle(proc.pid)}
    >
      <div
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
          isSelected ? 'bg-razer-green text-black' : 'bg-gray-700 text-white'
        }`}
      >
        <span className="text-[10px] font-bold">{proc.name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300 truncate">{proc.name}</p>
        <p className="text-xs text-gray-500">
          {proc.memory_mb >= 1024
            ? (proc.memory_mb / 1024).toFixed(1) + ' GB'
            : Math.round(proc.memory_mb) + ' MB'}
        </p>
      </div>
      <div className="flex-shrink-0">
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
            isSelected ? 'bg-razer-green border-razer-green' : 'border-gray-500 bg-transparent'
          }`}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-black"></div>}
        </div>
      </div>
    </button>
  );
});

ProcessItem.displayName = 'ProcessItem';