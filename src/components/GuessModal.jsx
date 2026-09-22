import React, { useState } from 'react';
import { Target, X, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

export default function GuessModal({
  isOpen,
  onClose,
  movie,
  activeDetective,
  currentPoints,
  onSuccessGuess,
  onFailedGuess
}) {
  const [guess, setGuess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanGuess = guess.trim();
    if (!cleanGuess || isVerifying) return;

    sounds.playClapperSnap();
    setIsVerifying(true);
    setFeedback(null);

    try {
      const result = await geminiService.checkSolveGuess(movie, cleanGuess);
      if (result.isCorrect) {
        sounds.playVictoryFanfare();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setFeedback({ isCorrect: true, message: `¡Correcto! Es "${movie.title}"` });
        setTimeout(() => {
          onSuccessGuess(activeDetective, currentPoints);
          onClose();
        }, 1600);
      } else {
        sounds.playVerdictChime('NO');
        setFeedback({
          isCorrect: false,
          message: `Incorrecto. No es "${cleanGuess}". El turno pasa al siguiente detective.`
        });
        setTimeout(() => {
          onFailedGuess(activeDetective);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Error al verificar intento:', err);
      setFeedback({ isCorrect: false, message: 'Hubo un error al verificar. Intenta de nuevo.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#151926] border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Resolver Película
            </h3>
            <p className="text-xs text-gray-400">
              Turno de <span className="text-amber-400 font-semibold">{activeDetective.name}</span> por <span className="text-emerald-400 font-bold">{currentPoints} pts</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Título exacto o aproximado
            </label>
            <input
              type="text"
              autoFocus
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Ej: Gladiator, Pulp Fiction, Titanic..."
              disabled={isVerifying}
              className="w-full bg-[#181D2A] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              feedback.isCorrect
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 py-3 rounded-xl bg-[#1e2436] hover:bg-[#283047] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || !guess.trim()}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Comprobando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Confirmar Adivinanza
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
