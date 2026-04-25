import React from 'react';
import { Play, Settings } from 'lucide-react';
import { Game } from '../../types/game.types';

export interface GameCardProps {
  game: Game;
  onLaunch: (game: Game) => void;
  onConfigure: (game: Game) => void;
}

/**
 * Game card component for displaying game information with launch/configure actions
 */
export const GameCard: React.FC<GameCardProps> = React.memo(({ game, onLaunch, onConfigure }) => {
  return (
    <div className="group bg-panel-bg rounded border border-gray-800 hover:border-razer-green transition-all duration-300 overflow-hidden relative flex flex-col h-48 shadow-lg">
      {/* Background Pattern/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-black/60 z-0"></div>

      {/* Card Content */}
      <div className="relative z-10 p-5 flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-900 rounded-lg shadow-inner flex items-center justify-center overflow-hidden mb-3 border border-gray-700 group-hover:border-razer-green/50 transition-colors">
          {game.icon_path ? (
            <img src={game.icon_path} alt={game.title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl opacity-70" aria-hidden="true">🕹️</span>
          )}
        </div>
        <h3 className="text-white font-bold text-center w-full truncate px-2">{game.title}</h3>
      </div>

      {/* Hover Overlay with Actions */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center space-y-3">
        <button
          onClick={(e) => { e.stopPropagation(); onLaunch(game); }}
          className="bg-razer-green hover:bg-green-400 text-black font-black py-2 px-8 rounded-full text-sm uppercase tracking-wider transform hover:scale-105 transition-all shadow-[0_0_15px_rgba(68,214,44,0.4)] flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Play & Boost ${game.title}`}
        >
          <Play size={16} fill="currentColor" aria-hidden="true" />
          <span>Play & Boost</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onConfigure(game); }}
          className="text-gray-300 hover:text-white flex items-center space-x-2 text-xs uppercase tracking-widest font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded px-2 py-1"
          aria-label={`Configure Profile for ${game.title}`}
        >
          <Settings size={14} aria-hidden="true" />
          <span>Configure Profile</span>
        </button>
      </div>
    </div>
  );
});

GameCard.displayName = 'GameCard';