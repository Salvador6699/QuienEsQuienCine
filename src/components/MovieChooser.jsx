import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle2, RotateCcw, EyeOff, Film, Music, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

const SUGGESTIONS = [
  'Pulp Fiction',
  'Gladiator',
  'El viaje de Chihiro',
  'El Caballero Oscuro',
  'Titanic',
  'Matrix',
  'Interstellar',
  'Parásitos',
  'El Padrino',
  'Volver al Futuro'
];

export default function MovieChooser({ director, onConfirmMovie }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [screenHidden, setScreenHidden] = useState(false);

  const handleSearch = async (targetQuery) => {
    const textToSearch = targetQuery || query;
    if (!textToSearch || textToSearch.trim().length === 0) {
      setErrorMsg('Escribe el título de una película.');
      return;
    }

    sounds.playClapperSnap();
    setErrorMsg('');
    setLoading(true);
    setCandidate(null);

    try {
      const result = await geminiService.searchAndDetailMovie(textToSearch);
      setCandidate(result);
    } catch (err) {
      setErrorMsg(err.message || 'Error al buscar con Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!candidate) return;
    sounds.playVictoryFanfare();
    onConfirmMovie(candidate);
  };

  const handleReset = () => {
    sounds.playClapperSnap();
    setCandidate(null);
    setQuery('');
    setErrorMsg('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Privacy Alert */}
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <EyeOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-gray-300">
          <strong className="text-amber-300">¡Pantalla Secreta del Director!</strong>{' '}
          Pasa el dispositivo a <span className="text-white font-bold">{director.name}</span>. Los demás detectives no deben mirar esta pantalla mientras se elige y confirma la película.
        </div>
      </div>

      <div className="bg-[#121620]/90 border border-gray-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{director.avatar}</span>
            <div>
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                Turno del Director
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
                {director.name}, elige la película secreta
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs font-mono">
            Ronda Activa
          </span>
        </div>

        {/* Search Phase */}
        {!candidate && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Escribe cualquier película que quieras poner a prueba. La IA la buscará y te mostrará su ficha para que confirmes que es exactamente la que quieres:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2 mb-4"
            >
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: El club de la lucha, Interstellar, Parásitos, Titanic..."
                  className="w-full bg-[#181D2A] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-gray-950 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar
              </button>
            </form>

            {errorMsg && (
              <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Suggestions */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                Ideas rápidas de películas clásicas y taquilleras:
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#181D2A] hover:bg-[#212738] border border-gray-800 text-gray-300 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="mt-8 p-6 text-center bg-[#181D2A]/40 rounded-xl border border-gray-800/60 animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
                <div className="text-sm font-semibold text-gray-200">
                  Gemini está analizando la película...
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Extrayendo ficha técnica, pistas de banda sonora y fotograma icónico.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Phase: The Director Reviews the AI's identification */}
        {candidate && (
          <div className="animate-fadeIn">
            <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 mb-6">
              <div className="bg-[#151926] rounded-[14px] p-5 sm:p-6 border border-amber-500/30">
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Película identificada por la IA
                  </span>
                  <span className="text-2xl">{candidate.posterEmoji}</span>
                </div>

                {/* Title & Metadata */}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {candidate.title}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-4">
                  <span>{candidate.year}</span>
                  <span>•</span>
                  <span>Dir: {candidate.directors.join(', ')}</span>
                  <span>•</span>
                  <span>{candidate.genres.join(', ')}</span>
                  <span>•</span>
                  <span>{candidate.country}</span>
                </div>

                {/* Synopsis */}
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-5 bg-[#0e121c] p-3.5 rounded-xl border border-gray-800/80">
                  {candidate.overview}
                </p>

                {/* Clues Preview (Visible to Director so they know what will be given) */}
                <div className="space-y-2 mb-5">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pistas secretas que la IA tiene listas:
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e121c] border border-gray-800 flex items-start gap-2.5 text-xs text-gray-300">
                    <Music className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400">Pista BSO (-20 pts):</strong> {candidate.soundtrackClue}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e121c] border border-gray-800 flex items-start gap-2.5 text-xs text-gray-300">
                    <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-400">Pista Fotograma (-20 pts):</strong> {candidate.photogramClue}
                    </div>
                  </div>
                </div>

                {/* Confirmation Prompt */}
                <div className="text-center pt-2">
                  <div className="text-sm font-bold text-gray-200 mb-4">
                    ¿Es esta la película que quieres para la ronda?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Sí, confirmar película!
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#1e2436] hover:bg-[#283047] border border-gray-700 text-gray-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      No, buscar otra
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
