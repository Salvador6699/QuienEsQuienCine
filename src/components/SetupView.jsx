import React, { useState } from 'react';
import { Film, Users, Sparkles, Key, Play, Trophy, ShieldAlert } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

const AVATARS = ['🎬', '🕵️‍♂️', '🍿', '🎥', '📼', '📽️', '🎭', '🌟'];

export default function SetupView({ onStartGame, onOpenApiKeyModal }) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4']);
  const [hasApiKey, setHasApiKey] = useState(Boolean(geminiService.getApiKey()));

  const handlePlayerCountChange = (count) => {
    sounds.playClapperSnap();
    setNumPlayers(count);
  };

  const handleNameChange = (index, value) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const handleStart = () => {
    sounds.playClapperSnap();
    const finalPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      finalPlayers.push({
        id: `p_${i + 1}`,
        name: playerNames[i].trim() || `Jugador ${i + 1}`,
        avatar: AVATARS[i % AVATARS.length],
        score: 0
      });
    }
    onStartGame(finalPlayers);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Nueva Versión Vercel • Impulsado por Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 tracking-tight mb-3">
          ¿Quién es Quién? Cine
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Un jugador elige en secreto la película con ayuda de la IA. Los detectives interrogan al árbitro de Gemini para adivinarla.
        </p>
      </div>

      {/* Main Setup Card */}
      <div className="bg-[#121620]/90 border border-gray-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Selector de número de jugadores */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            1. Selecciona el número de jugadores
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[2, 3, 4].map((count) => {
              const active = numPlayers === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`py-3.5 px-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all border ${
                    active
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'bg-[#181D2A] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <span className="text-2xl">{count}</span>
                  <span className="text-xs uppercase tracking-wider font-medium">Jugadores</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {numPlayers === 2 && '1 Director (elige película) vs 1 Detective (adivina).'}
            {numPlayers === 3 && '1 Director y 2 Detectives con turnos rotativos para preguntar.'}
            {numPlayers === 4 && '1 Director y 3 Detectives con turnos rotativos para preguntar.'}
          </p>
        </div>

        {/* 2. Nombres de los jugadores */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            <Film className="w-4 h-4 text-amber-400" />
            2. Nombres de los participantes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: numPlayers }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-[#181D2A] border border-gray-800/80 rounded-xl p-2.5 focus-within:border-amber-500/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#212738] flex items-center justify-center text-xl flex-shrink-0">
                  {AVATARS[i % AVATARS.length]}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    {i === 0 ? 'Director Ronda 1' : `Detective ${i}`}
                  </div>
                  <input
                    type="text"
                    value={playerNames[i]}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`Jugador ${i + 1}`}
                    maxLength={20}
                    className="w-full bg-transparent text-sm font-medium text-gray-200 outline-none placeholder-gray-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Reglas rápidas de puntuación */}
        <div className="bg-[#181D2A]/70 border border-gray-800/60 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" />
            Sistema de Puntos de la Ronda (100 pts)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-400">
            <div className="bg-[#121620] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
              <span>Cada pregunta:</span>
              <span className="font-bold text-orange-400">-1 pt</span>
            </div>
            <div className="bg-[#121620] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
              <span>Audio BSO real:</span>
              <span className="font-bold text-amber-400">-20 pts</span>
            </div>
            <div className="bg-[#121620] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
              <span>Fotograma real:</span>
              <span className="font-bold text-cyan-400">-20 pts</span>
            </div>
          </div>
        </div>

        {/* Status de Gemini API Key */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <Key className="w-4 h-4 text-amber-400" />
            <span>
              Clave de Gemini: <strong className="text-emerald-400">Configurada y lista</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Ver o cambiar clave
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-gray-950 hover:brightness-110 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          Comenzar Partida
        </button>
      </div>
    </div>
  );
}
