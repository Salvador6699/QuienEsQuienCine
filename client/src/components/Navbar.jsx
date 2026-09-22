import React, { useState } from 'react';
import { Film, Clapperboard, Volume2, VolumeX, Settings, HelpCircle, Copy, Check, Users } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar({
  room,
  onOpenRules,
  onOpenSettings,
  soundEnabled,
  setSoundEnabled
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!room?.code) return;
    const shareUrl = `${window.location.origin}?room=${room.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    sounds.playClapperSnap();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundEnabled(newState);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0D13]/90 backdrop-blur-md border-b border-gray-800/80 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Clapperboard className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="font-cinema text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              CINECLUE
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest text-gray-400 uppercase font-mono-code -mt-1">
              Quién es Quién de Cine • Gemini IA
            </span>
          </div>
        </div>

        {/* Room badge if in room */}
        {room?.code && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copiar enlace de la sala"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 transition-all text-xs sm:text-sm font-mono-code shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>SALA: <strong className="text-amber-200">{room.code}</strong></span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400 opacity-70" />
              )}
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar efectos'}
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Rules Modal Button */}
          <button
            onClick={onOpenRules}
            title="Cómo jugar"
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            title="Ajustes de API (Gemini / TMDB)"
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-amber-400 transition-colors border border-gray-700/50"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
