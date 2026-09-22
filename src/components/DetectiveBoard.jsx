import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Music, Image as ImageIcon, Sparkles, HelpCircle, 
  Target, Volume2, ArrowRight, Play, Pause, Maximize2, 
  X, Eye, Flame, Disc
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

const QUICK_QUESTIONS = [
  '¿Es anterior al año 2000?',
  '¿Ganó algún premio Óscar?',
  '¿Es de animación?',
  '¿Es producción española o europea?',
  '¿Pertenece al género de thriller o terror?',
  '¿Dura más de 2 horas?'
];

export default function DetectiveBoard({
  roundNumber,
  movie,
  director,
  detectives,
  activeDetectiveIndex,
  currentPoints,
  cluesUsed, // { soundtrack: boolean, photogram: boolean }
  questionHistory,
  onUseClue,
  onAddQuestion,
  onOpenGuessModal,
  onNextDetectiveTurn
}) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeClueModal, setActiveClueModal] = useState(null); // 'soundtrack' | 'photogram' | null
  const [zoomImage, setZoomImage] = useState(false);
  const audioRef = useRef(null);
  const logEndRef = useRef(null);

  const activeDetective = detectives[activeDetectiveIndex] || detectives[0];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionHistory, isAsking]);

  // Handle Real Audio Play / Pause
  const handleToggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch(() => {
          // Fallback to synthesized audio if stream fails
          sounds.playSoundtrackMotif(movie.soundtrackAudioStyle || 'epic_orchestral');
          setIsPlayingAudio(true);
          setTimeout(() => setIsPlayingAudio(false), 2500);
        });
      }
    } else {
      sounds.playSoundtrackMotif(movie.soundtrackAudioStyle || 'epic_orchestral');
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  };

  const handleAsk = async (questionText) => {
    const q = (questionText || question).trim();
    if (!q || isAsking) return;

    sounds.playClapperSnap();
    setIsAsking(true);
    setQuestion('');

    try {
      const response = await geminiService.arbitrateQuestion(movie, q);
      sounds.playVerdictChime(response.veredicto);

      onAddQuestion({
        detective: activeDetective,
        question: q,
        veredicto: response.veredicto,
        detalle: response.detalle,
        timestamp: Date.now()
      });

      if (detectives.length > 1) {
        setTimeout(() => {
          onNextDetectiveTurn();
        }, 1200);
      }
    } catch (err) {
      console.error('Error al preguntar a la IA:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const getVerdictStyle = (v) => {
    switch (v) {
      case 'SI':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
      case 'NO':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-300';
      case 'MAYOR':
        return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';
      case 'MENOR':
        return 'bg-purple-500/15 border-purple-500/40 text-purple-300';
      default:
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    }
  };

  // Real movie image or fallback
  const frameImageUrl = movie.frameImage || `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80`;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-fadeIn flex flex-col h-[calc(100dvh-75px)] sm:h-auto">
      
      {/* ========================================================== */}
      {/* MOBILE STICKY HUD (ALWAYS VISIBLE, NO SCROLL REQUIRED)    */}
      {/* ========================================================== */}
      <div className="sm:hidden sticky top-0 z-30 bg-[#121620]/95 backdrop-blur-md border border-gray-800/90 rounded-xl p-2.5 mb-2 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Points counter */}
          <div className="flex items-center gap-1 bg-[#181D2A] px-2.5 py-1 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Pozo:</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {currentPoints} pts
            </span>
          </div>

          {/* Turn indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 truncate max-w-[140px]">
            <span>{activeDetective.avatar}</span>
            <span className="truncate">{activeDetective.name}</span>
          </div>

          {/* Quick Resolve Button */}
          <button
            type="button"
            onClick={onOpenGuessModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            Resolver
          </button>
        </div>

        {/* Mobile Clues Quick Bar (-20 pts each) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Soundtrack clue button */}
          <button
            type="button"
            onClick={() => {
              if (!cluesUsed.soundtrack) {
                onUseClue('soundtrack');
              }
              setActiveClueModal('soundtrack');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              cluesUsed.soundtrack
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#181D2A] border-gray-800 text-gray-300 hover:border-amber-500/30'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>{cluesUsed.soundtrack ? 'Audio BSO (Oír)' : 'Pista BSO (-20)'}</span>
          </button>

          {/* Photogram clue button */}
          <button
            type="button"
            onClick={() => {
              if (!cluesUsed.photogram) {
                onUseClue('photogram');
              }
              setActiveClueModal('photogram');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              cluesUsed.photogram
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-[#181D2A] border-gray-800 text-gray-300 hover:border-cyan-500/30'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{cluesUsed.photogram ? 'Fotograma (Ver)' : 'Fotograma (-20)'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* DESKTOP HEADER                                             */}
      {/* ========================================================== */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Round & Director */}
        <div className="bg-[#121620]/90 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{director.avatar}</span>
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold">Director R{roundNumber}</div>
              <div className="text-sm font-bold text-gray-200">{director.name}</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
            Película Oculta
          </span>
        </div>

        {/* Turn Indicator */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 rounded-xl p-3 flex items-center justify-between shadow-md shadow-amber-500/5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeDetective.avatar}</span>
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                Turno de Pregunta
              </div>
              <div className="text-sm font-extrabold text-white">
                {activeDetective.name}
              </div>
            </div>
          </div>
          {detectives.length > 1 && (
            <button
              type="button"
              onClick={onNextDetectiveTurn}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              Pasar <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Points & Resolver Button */}
        <div className="bg-[#121620]/90 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <span>Pozo de Puntos</span>
              <span className="text-[10px] text-amber-400/80">(-1 por pregunta)</span>
            </div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
              {currentPoints} pts
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGuessModal}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Target className="w-4 h-4" />
            Resolver
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MAIN GAME CONTENT                                          */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* Desktop Left Sidebar: Clues with Real Media */}
        <div className="hidden lg:block lg:col-span-4 space-y-3 overflow-y-auto">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pistas Reales (-20 pts c/u)
            </span>
            <span className="text-[11px] text-gray-500">
              {Object.values(cluesUsed).filter(Boolean).length}/2 activas
            </span>
          </div>

          {/* Clue 1: Audio BSO Real */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            cluesUsed.soundtrack 
              ? 'bg-[#181D2A] border-amber-500/50 shadow-lg shadow-amber-500/5' 
              : 'bg-[#121620]/70 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                Pista 1: Audio Banda Sonora
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cluesUsed.soundtrack ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'
              }`}>
                {cluesUsed.soundtrack ? 'Revelada (-20 pts)' : '-20 pts'}
              </span>
            </div>

            {cluesUsed.soundtrack ? (
              <div className="animate-fadeIn">
                <div className="bg-[#0e121c] p-3 rounded-xl border border-amber-500/20 mb-2">
                  <div className="text-[11px] text-gray-300 font-semibold mb-1 truncate">
                    {movie.audio?.track ? `Tema: "${movie.audio.track}"` : 'Tema Musical Oficial'}
                  </div>
                  <div className="text-[10px] text-amber-400/80 mb-3 truncate">
                    {movie.audio?.artist || movie.composer || 'Orquesta Oficial'}
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 text-xs text-gray-400 flex items-center gap-2">
                      <Disc className={`w-4 h-4 text-amber-400 ${isPlayingAudio ? 'animate-spin' : ''}`} />
                      <span>{isPlayingAudio ? 'Reproduciendo audio...' : 'Pulsar para reproducir'}</span>
                    </div>
                  </div>

                  {movie.audio?.url && (
                    <audio
                      ref={audioRef}
                      src={movie.audio.url}
                      onEnded={() => setIsPlayingAudio(false)}
                      className="hidden"
                    />
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUseClue('soundtrack')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#212738] hover:bg-amber-500/20 hover:border-amber-500/50 border border-gray-700 text-gray-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Revelar Pista de Audio BSO (-20 pts)
              </button>
            )}
          </div>

          {/* Clue 2: Fotograma Real (Imagen) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            cluesUsed.photogram 
              ? 'bg-[#181D2A] border-cyan-500/50 shadow-lg shadow-cyan-500/5' 
              : 'bg-[#121620]/70 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Pista 2: Fotograma Real
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cluesUsed.photogram ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800 text-gray-400'
              }`}>
                {cluesUsed.photogram ? 'Revelada (-20 pts)' : '-20 pts'}
              </span>
            </div>

            {cluesUsed.photogram ? (
              <div className="animate-fadeIn">
                <div
                  className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-black cursor-pointer group shadow-lg"
                  onClick={() => setZoomImage(true)}
                  title="Clic para ampliar fotograma"
                >
                  {/* 16:9 cinema crop focusing on the scene, cutting off poster titles and bottom credits */}
                  <div className="relative w-full aspect-video overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={frameImageUrl}
                      alt="Fotograma de escena cinematográfica"
                      className="w-full h-full object-cover object-[center_28%] scale-[1.75] group-hover:scale-[1.82] transition-transform duration-300 filter brightness-95"
                    />

                    {/* Cinematic matte letterbox bars */}
                    <div className="absolute top-0 inset-x-0 h-4 bg-black/90 z-10 flex items-center justify-between px-2">
                      <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">35mm Cinema Still</span>
                      <Maximize2 className="w-3 h-3 text-cyan-400 opacity-80" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-5 bg-black/90 z-10 flex items-center px-2">
                      <span className="text-[8px] font-mono tracking-wider text-cyan-400/90 uppercase">Encuadre Escénico (Sin Título)</span>
                    </div>
                  </div>

                  {movie.photogramClue && (
                    <div className="p-2 bg-[#0e121c] border-t border-cyan-500/20 text-[11px] text-gray-300 italic">
                      "{movie.photogramClue}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUseClue('photogram')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#212738] hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-gray-700 text-gray-300 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Revelar Imagen del Fotograma (-20 pts)
              </button>
            )}
          </div>
        </div>

        {/* Interrogation Area (Takes full remaining space) */}
        <div className="lg:col-span-8 flex flex-col bg-[#121620]/90 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-xl h-full">
          {/* Header */}
          <div className="px-3 py-2 sm:p-3 border-b border-gray-800 flex items-center justify-between bg-[#151926]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-200">
                Interrogatorio con el Árbitro IA
              </h3>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{questionHistory.length} preguntas (-1 pt c/u)</span>
            </div>
          </div>

          {/* Interrogation Messages Log */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin">
            {questionHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500">
                <HelpCircle className="w-8 h-8 mb-2 opacity-30 text-amber-400" />
                <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">
                  El interrogatorio está listo
                </div>
                <div className="text-xs max-w-xs text-gray-500">
                  {activeDetective.name}, escribe una pregunta o toca una sugerencia rápida. Cada pregunta resta 1 punto.
                </div>
              </div>
            ) : (
              questionHistory.map((item, index) => (
                <div key={index} className="bg-[#181D2A] border border-gray-800/70 rounded-xl p-2.5 sm:p-3 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-300 flex items-center gap-1">
                      <span>{item.detective.avatar}</span>
                      <span>{item.detective.name}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      #{index + 1} (-1 pt)
                    </span>
                  </div>

                  <div className="text-gray-100 font-medium mb-2 pl-0.5">
                    "{item.question}"
                  </div>

                  {/* Verdict badge */}
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${getVerdictStyle(item.veredicto)}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs sm:text-sm tracking-wider">
                        {item.veredicto}
                      </span>
                      {item.detalle && (
                        <span className="text-[11px] opacity-90 border-l border-current/30 pl-2">
                          {item.detalle}
                        </span>
                      )}
                    </div>
                    <Sparkles className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </div>
              ))
            )}

            {isAsking && (
              <div className="bg-[#181D2A]/60 border border-gray-800 rounded-xl p-2.5 flex items-center gap-2.5 animate-pulse text-xs text-gray-400">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Evaluando pregunta con la ficha técnica...</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-1.5 bg-[#151926]/70 border-t border-gray-800/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                disabled={isAsking}
                className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#1e2436] hover:bg-[#283047] text-gray-300 hover:text-amber-300 border border-gray-700/60 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar (Fixed at bottom) */}
          <div className="p-2 sm:p-3 border-t border-gray-800 bg-[#151926]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`Pregunta de ${activeDetective.name} (ej. ¿Es de terror?)...`}
                disabled={isAsking}
                className="flex-1 bg-[#181D2A] border border-gray-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preguntar</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL / DRAWER FOR MOBILE CLUES                            */}
      {/* ========================================================== */}
      {activeClueModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-md bg-[#151926] border border-gray-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveClueModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Audio Modal */}
            {activeClueModal === 'soundtrack' && (
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                  <Music className="w-5 h-5" />
                  Pista de Audio: Banda Sonora
                </div>

                <div className="bg-[#0e121c] p-4 rounded-xl border border-amber-500/30 text-center mb-4">
                  <div className="text-sm font-bold text-white mb-1">
                    {movie.audio?.track ? `"${movie.audio.track}"` : 'Tema Musical Oficial'}
                  </div>
                  <div className="text-xs text-amber-400/90 mb-4">
                    {movie.audio?.artist || movie.composer || 'Orquesta del filme'}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className="w-14 h-14 mx-auto rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 flex items-center justify-center shadow-lg shadow-amber-500/40 transition-transform active:scale-95 cursor-pointer mb-2"
                  >
                    {isPlayingAudio ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </button>
                  <div className="text-xs text-gray-400">
                    {isPlayingAudio ? 'Reproduciendo pista de audio...' : 'Toca para reproducir la BSO'}
                  </div>

                  {movie.audio?.url && (
                    <audio
                      ref={audioRef}
                      src={movie.audio.url}
                      onEnded={() => setIsPlayingAudio(false)}
                      className="hidden"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveClueModal(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Image Modal */}
            {activeClueModal === 'photogram' && (
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
                  <ImageIcon className="w-5 h-5" />
                  Fotograma Oficial
                </div>

                <div className="rounded-xl overflow-hidden border border-cyan-500/40 mb-3 bg-black relative shadow-xl">
                  {/* Mobile 16:9 cinema crop */}
                  <div className="relative w-full aspect-video overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={frameImageUrl}
                      alt="Fotograma de la película"
                      className="w-full h-full object-cover object-[center_28%] scale-[1.75]"
                    />
                    <div className="absolute top-0 inset-x-0 h-4 bg-black/90 z-10 flex items-center px-2">
                      <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">35mm Cinema Frame</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-black/90 z-10 flex items-center px-2">
                      <span className="text-[8px] font-mono text-cyan-400 uppercase">Encuadre Escénico</span>
                    </div>
                  </div>
                </div>

                {movie.photogramClue && (
                  <div className="p-2.5 rounded-lg bg-[#0e121c] border border-cyan-500/20 text-xs text-gray-300 italic mb-4">
                    "{movie.photogramClue}"
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveClueModal(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-pointer animate-fadeIn"
          onClick={() => setZoomImage(false)}
        >
          <div className="relative w-full max-w-3xl">
            {/* Cinematic zoom container without poster titles */}
            <div className="relative w-full aspect-[2.35/1] rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-black shadow-2xl flex items-center justify-center">
              <img
                src={frameImageUrl}
                alt="Fotograma ampliado"
                className="w-full h-full object-cover object-[center_28%] scale-[1.85] select-none filter contrast-105"
              />
              <div className="absolute top-0 inset-x-0 h-6 bg-black z-10 flex items-center justify-between px-3">
                <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">35mm Panavision Aspect</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-6 bg-black z-10 flex items-center justify-between px-3">
                <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">Fotograma de Rodaje</span>
              </div>
            </div>

            {movie.photogramClue && (
              <div className="mt-3 p-3 rounded-xl bg-black/80 border border-cyan-500/30 text-xs sm:text-sm text-gray-200 text-center italic">
                "{movie.photogramClue}"
              </div>
            )}

            <button
              type="button"
              onClick={() => setZoomImage(false)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-cyan-500 text-gray-950 font-bold shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
