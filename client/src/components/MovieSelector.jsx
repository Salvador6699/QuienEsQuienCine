import React, { useState, useEffect } from 'react';
import { Search, Film, Check, Lock, Sparkles, AlertCircle, Clock, Calendar, Globe2, User, Clapperboard } from 'lucide-react';
import { socketService, API_BASE_URL } from '../services/socket';
import { sounds } from '../utils/audio';

export default function MovieSelector({ room, myPlayerId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');

  // Check if current player already selected movie
  const me = room?.players.find(p => p.id === myPlayerId);
  useEffect(() => {
    if (me?.hasSelectedMovie) {
      setIsConfirmed(true);
    }
  }, [me]);

  // Debounced TMDB search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/tmdb/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        setError('Error al buscar en TMDB: ' + err.message);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load complete movie details on pick
  const handleSelectMovie = async (movie) => {
    setLoadingDetails(true);
    sounds.playClapperSnap();
    try {
      const res = await fetch(`${API_BASE_URL}/api/tmdb/movie/${movie.id}`);
      const data = await res.json();
      setSelectedMovie(data.movie || movie);
    } catch {
      setSelectedMovie(movie);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmMovie = async () => {
    if (!selectedMovie || !room?.code) return;
    sounds.playClapperSnap();
    try {
      await socketService.setMovie(room.code, selectedMovie);
      setIsConfirmed(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // If already confirmed, show waiting room state
  if (isConfirmed) {
    const totalPlayers = room.players.length;
    const readyPlayers = room.players.filter(p => p.hasSelectedMovie).length;

    return (
      <div className="max-w-2xl mx-auto my-6 px-4">
        <div className="rounded-3xl bg-[#121520] border border-amber-500/30 p-8 shadow-2xl text-center space-y-6">
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold font-cinema text-gray-100">
              ¡Película Secreta Registrada!
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Tu elección está sellada bajo estricto secreto de sumario ante el árbitro Gemini.
            </p>
          </div>

          {/* Selected Movie Summary Preview */}
          {selectedMovie && (
            <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 flex items-center gap-4 text-left max-w-md mx-auto">
              {selectedMovie.poster_path ? (
                <img
                  src={selectedMovie.poster_path}
                  alt={selectedMovie.title}
                  className="w-16 h-24 object-cover rounded-lg border border-gray-700 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Film className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase block">Tu Secreto:</span>
                <h3 className="font-bold text-sm text-gray-100 truncate">{selectedMovie.title}</h3>
                <p className="text-xs text-gray-400">{selectedMovie.year} • {(selectedMovie.directors || []).join(', ')}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{selectedMovie.overview}</p>
              </div>
            </div>
          )}

          {/* Progress / Status of other players */}
          <div className="pt-4 border-t border-gray-800">
            <span className="text-xs font-mono-code text-amber-400 block mb-3">
              ESTADO DE SELECCIÓN: {readyPlayers} de {totalPlayers} DIRECTORES LISTOS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {room.players.map(p => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    p.hasSelectedMovie
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-black/30 border-gray-800 text-gray-500'
                  }`}
                >
                  <span className="text-base">{p.avatar}</span>
                  <div className="truncate flex-1 text-left">
                    <span className="font-semibold block truncate">{p.name}</span>
                    <span className="text-[10px] opacity-70">
                      {p.hasSelectedMovie ? '¡Listo!' : 'Eligiendo...'}
                    </span>
                  </div>
                  {p.hasSelectedMovie && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Active Movie Selection Screen
  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <div className="rounded-3xl bg-[#121520] border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              FASE DE PREPARACIÓN
            </div>
            <h2 className="text-2xl font-black font-cinema text-gray-100">
              Elige tu Película Secreta
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Busca en el catálogo oficial de TMDB la película que tus rivales deberán adivinar.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/60 border border-gray-700 text-xs text-gray-400">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Ficha oculta para los rivales</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Escribe el título de una película (ej: Titanic, Matrix, El Padrino, Parásitos...)"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-sm text-gray-100 placeholder-gray-500 shadow-inner"
          />
          {loadingSearch && (
            <div className="absolute right-4 top-3.5 text-xs text-amber-400 font-mono animate-pulse">
              Buscando en TMDB...
            </div>
          )}
        </div>

        {/* Main Content Layout: Search Results vs Selected Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Search Results List */}
          <div className="md:col-span-6 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {searchResults.length === 0 && !loadingSearch && (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-dashed border-gray-800 text-gray-500 text-xs">
                {searchQuery.trim().length > 0
                  ? 'No se encontraron películas con ese título. Prueba con otro nombre.'
                  : 'Escribe en el buscador para ver resultados oficiales de TMDB con reparto y directores.'}
              </div>
            )}

            {searchResults.map(movie => {
              const isSelected = selectedMovie?.id === movie.id;
              return (
                <div
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-gray-100 shadow-md'
                      : 'bg-black/40 border-gray-800/80 hover:bg-gray-800/50 text-gray-300'
                  }`}
                >
                  {movie.poster_path ? (
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Film className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm truncate">{movie.title}</h4>
                      {movie.year && (
                        <span className="text-[11px] font-mono-code text-amber-400 font-semibold ml-2">
                          {movie.year}
                        </span>
                      )}
                    </div>
                    {movie.original_title && movie.original_title !== movie.title && (
                      <p className="text-[11px] text-gray-500 truncate italic">({movie.original_title})</p>
                    )}
                    <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{movie.overview}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Movie Tech Card & Confirm Action */}
          <div className="md:col-span-6">
            {selectedMovie ? (
              <div className="rounded-2xl bg-gradient-to-b from-[#181D2B] to-[#10131E] border border-amber-500/40 p-5 space-y-4 shadow-xl">
                
                <div className="flex gap-4">
                  {selectedMovie.poster_path ? (
                    <img
                      src={selectedMovie.poster_path}
                      alt={selectedMovie.title}
                      className="w-24 h-36 object-cover rounded-xl border border-gray-700 shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-36 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Film className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase font-bold">
                      Ficha Técnica para Gemini
                    </span>
                    <h3 className="text-lg font-bold font-cinema text-gray-100 leading-tight">
                      {selectedMovie.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400 pt-1">
                      {selectedMovie.year && <span className="text-amber-300 font-mono font-bold">📅 {selectedMovie.year}</span>}
                      {selectedMovie.country && <span>🌍 {selectedMovie.country}</span>}
                      {selectedMovie.runtime > 0 && <span>⏱️ {selectedMovie.runtime} min</span>}
                    </div>
                  </div>
                </div>

                {/* Directors & Cast */}
                <div className="space-y-2 text-xs border-t border-gray-800 pt-3">
                  <div>
                    <span className="text-gray-400 font-semibold block">Dirección:</span>
                    <span className="text-gray-200">{(selectedMovie.directors || []).join(', ') || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Reparto principal:</span>
                    <span className="text-gray-300 text-[11px] leading-relaxed">
                      {(selectedMovie.cast || []).join(', ') || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Géneros:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedMovie.genres || []).map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-gray-300">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Sinopsis oficial:</span>
                    <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed mt-0.5">
                      {selectedMovie.overview}
                    </p>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmMovie}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Confirmar como mi Película Secreta
                </button>

              </div>
            ) : (
              <div className="h-full min-h-[300px] rounded-2xl bg-black/20 border border-dashed border-gray-800 flex flex-col items-center justify-center p-6 text-center text-gray-500 text-xs">
                <Film className="w-10 h-10 text-gray-700 mb-2" />
                <span>Selecciona una película de la lista para ver su ficha técnica completa y confirmarla.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
