import React from 'react';
import { Trophy, Film, Sparkles, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ScoreboardModal({
  isOpen,
  roundNumber,
  winner,
  pointsWon,
  movie,
  players,
  nextDirector,
  onNextRound,
  onResetGame
}) {
  if (!isOpen) return null;

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#151926] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Round Resolution Banner */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
            winner 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            <Trophy className="w-3.5 h-3.5" />
            {winner ? `¡Ronda ${roundNumber} Completada!` : `Ronda ${roundNumber} Finalizada`}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            {winner ? (
              <span>
                ¡<strong className="text-amber-400">{winner.name}</strong> adivinó la película!
              </span>
            ) : (
              <span className="text-rose-300 flex items-center justify-center gap-2">
                <span>🏳️</span> Los detectives se han rendido
              </span>
            )}
          </h2>
          {winner ? (
            <p className="text-sm font-semibold text-emerald-400">
              +{pointsWon} puntos sumados al marcador
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Ningún detective acertó el título en esta ronda. Película secreta revelada:
            </p>
          )}
        </div>

        {/* Secret Movie Reveal Card */}
        {movie && (
          <div className="p-4 rounded-xl bg-[#0e121c] border border-gray-800 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#1e2436] flex items-center justify-center text-3xl flex-shrink-0">
              {movie.posterEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase font-semibold">Película revelada</div>
              <div className="text-base font-bold text-white truncate">{movie.title}</div>
              <div className="text-xs text-gray-400">
                {movie.year} • Dir: {movie.directors?.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Marcador General</span>
            <span>Puntos Totales</span>
          </div>
          <div className="space-y-2">
            {sortedPlayers.map((player, idx) => {
              const isWinner = winner && player.id === winner.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-white font-bold'
                      : 'bg-[#181D2A] border-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center text-xs font-bold text-gray-500">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="text-xl">{player.avatar}</span>
                    <span className="text-sm">{player.name}</span>
                    {isWinner && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Ganador ronda
                      </span>
                    )}
                  </div>
                  <div className="text-base font-black text-amber-400 font-mono">
                    {player.score} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Round Director Alert */}
        {nextDirector && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 text-xs text-gray-300 flex items-center gap-2.5">
            <span className="text-xl">{nextDirector.avatar}</span>
            <div>
              En la siguiente ronda, el rol de Director pasa a{' '}
              <strong className="text-amber-300">{nextDirector.name}</strong> para que elija su película secreta.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClapperSnap();
              onNextRound();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Siguiente Ronda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClapperSnap();
              onResetGame();
            }}
            className="py-3.5 px-4 rounded-xl bg-[#1e2436] hover:bg-[#283047] text-gray-400 hover:text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nueva Partida
          </button>
        </div>
      </div>
    </div>
  );
}
