import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Crown, Film } from 'lucide-react';
import { socketService } from '../services/socket';
import { sounds } from '../utils/audio';

export default function GameOverModal({ isOpen, room, myPlayerId }) {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictoryFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const isHost = room.hostId === myPlayerId;
  const winner = room.winner;

  const handleRestart = async () => {
    sounds.playClapperSnap();
    try {
      await socketService.restartRoom(room.code);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121520] border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-gray-200 text-center">
        
        {/* Trophy Header */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black font-cinema text-amber-300">
          ¡CORTEN! FIN DE LA PARTIDA
        </h2>

        {winner ? (
          <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2 text-2xl mb-1">
              <Crown className="w-6 h-6 text-amber-400" />
              <span>{winner.avatar}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-100">{winner.name}</h3>
            <span className="text-xs text-amber-300 font-mono-code uppercase tracking-wider">
              ¡Gran Maestro de la Deducción de Cine!
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400 my-3">
            ¡Todos los directores cayeron en el intento! La partida ha terminado en empate.
          </p>
        )}

        {/* Revelation of ALL Players' Secret Movies */}
        <div className="my-6 text-left">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Film className="w-4 h-4" />
            Revelación Oficial de Películas Secretas
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {room.players.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-black/40 border border-gray-800 flex items-center gap-3"
              >
                {p.secretMovie?.poster_path ? (
                  <img
                    src={p.secretMovie.poster_path}
                    alt=""
                    className="w-12 h-16 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span>{p.avatar}</span>
                    <strong className="text-gray-200 truncate">{p.name}</strong>
                  </div>
                  <span className="text-amber-300 font-bold block truncate mt-0.5">
                    {p.secretMovie?.title || 'Película no elegida'}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {p.secretMovie?.year} • {(p.secretMovie?.directors || []).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restart Action for Host */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-center gap-4">
          {isHost ? (
            <button
              onClick={handleRestart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm tracking-wide flex items-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              ¡Jugar Otra Partida (Revancha)!
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">
              Esperando a que el anfitrión inicie una revancha...
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
