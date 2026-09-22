import React from 'react';
import { Clapperboard, Volume2, VolumeX, Key, HelpCircle, Trophy } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar({
  gameStarted,
  roundNumber,
  director,
  onOpenRules,
  onOpenApiKeyModal,
  onOpenScoreboard,
  soundEnabled,
  setSoundEnabled
}) {
  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundEnabled(newState);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0D13]/90 backdrop-blur-md border-b border-gray-800/80 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.location.reload()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Clapperboard className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="font-cinema text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              CINECLUE
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest text-gray-400 uppercase font-mono -mt-1">
              Quién es Quién de Cine • Gemini AI
            </span>
          </div>
        </div>

        {/* Game Status Pills */}
        {gameStarted && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenScoreboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Ronda {roundNumber}</span>
            </button>
            {director && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-gray-300 text-xs">
                <span>{director.avatar}</span>
                <span>Dir: <strong>{director.name}</strong></span>
              </span>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar efectos'}
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Rules Modal Button */}
          <button
            type="button"
            onClick={onOpenRules}
            title="Reglas del juego"
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Gemini API Key Button */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            title="Configurar clave Gemini"
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50 cursor-pointer"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
