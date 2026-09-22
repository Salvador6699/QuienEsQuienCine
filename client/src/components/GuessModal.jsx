import React, { useState, useEffect } from 'react';
import { X, Search, Film, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { socketService, API_BASE_URL } from '../services/socket';
import { sounds } from '../utils/audio';

export default function GuessModal({ isOpen, onClose, target, myLives, roomCode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setSelectedMovie(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/tmdb/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        // ignore
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen || !target) return null;

  const handleConfirmGuess = async () => {
    const movieTitle = selectedMovie ? selectedMovie.title : searchQuery.trim();
    if (!movieTitle) {
      setError('Escribe o selecciona el título de la película');
      return;
    }

    setSubmitting(true);
    setError('');
    sounds.playClapperSnap();

    try {
      const res = await socketService.guessMovie(roomCode, target.id, movieTitle);
      if (res.isCorrect) {
        sounds.playVictoryFanfare();
      } else {
        sounds.playVerdictChime('NO');
      }
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#121520] border-2 border-rose-500/40 p-6 sm:p-7 shadow-2xl shadow-rose-500/10 text-gray-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-cinema text-rose-400">Resolver / Adivinar Película</h2>
            <p className="text-xs text-gray-400">
              Vas a arriesgarte a resolver la película secreta de <strong className="text-gray-200">{target.name}</strong> ({target.avatar})
            </p>
          </div>
        </div>

        {/* Lives Warning Banner */}
        <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center gap-3 text-xs mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div className="text-gray-300">
            <span>Tienes <strong>{myLives} / 2</strong> intentos de resolución restantes.</span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Si fallas, {myLives === 1 ? '¡quedarás ELIMINADO de la partida!' : 'te quedará tu último intento.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        {/* TMDB Search for Exact Movie */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Busca y selecciona la película exacta:
          </label>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedMovie(null);
              }}
              placeholder="Escribe el título que crees que eligió tu rival..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-gray-700 focus:border-rose-500 focus:outline-none text-xs text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Autocomplete Results */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {results.map(movie => {
              const isSelected = selectedMovie?.id === movie.id;
              return (
                <div
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all text-xs ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-black/30 border-gray-800 hover:bg-gray-800/40 text-gray-300'
                  }`}
                >
                  {movie.poster_path ? (
                    <img src={movie.poster_path} alt="" className="w-8 h-11 object-cover rounded shadow" />
                  ) : (
                    <div className="w-8 h-11 bg-gray-800 rounded flex items-center justify-center">
                      <Film className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block truncate">{movie.title}</span>
                    <span className="text-[10px] text-gray-400">{movie.year || 'Año desconocido'}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
              );
            })}
          </div>

          {/* Selected Movie Pill */}
          {selectedMovie && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
              <span className="text-gray-300">
                Seleccionada: <strong className="text-rose-300">{selectedMovie.title} ({selectedMovie.year})</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="text-[10px] text-gray-400 hover:text-white"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || (!selectedMovie && !searchQuery.trim())}
            onClick={handleConfirmGuess}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-98 transition-all flex items-center gap-2"
          >
            {submitting ? 'Verificando con Árbitro...' : '¡Arriesgar y Resolver!'}
          </button>
        </div>

      </div>
    </div>
  );
}
