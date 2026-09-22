import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Music, Image as ImageIcon, Sparkles, HelpCircle, Trophy, 
  Target, Volume2, ArrowRight, CheckCircle2, XCircle, Clock, 
  ShieldAlert, UserCheck
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

const QUICK_QUESTIONS = [
  '¿Es anterior al año 2000?',
  '¿Ganó algún premio Óscar?',
  '¿Es una película de animación?',
  '¿Es de producción europea o española?',
  '¿Pertenece al género de ciencia ficción o terror?',
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
  const [playingAudio, setPlayingAudio] = useState(false);
  const logEndRef = useRef(null);

  const activeDetective = detectives[activeDetectiveIndex] || detectives[0];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionHistory, isAsking]);

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

      // Auto-advance turn if there are multiple detectives
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

  const handlePlaySoundtrackMotif = () => {
    setPlayingAudio(true);
    sounds.playSoundtrackMotif(movie.soundtrackAudioStyle || 'epic_orchestral');
    setTimeout(() => {
      setPlayingAudio(false);
    }, 1800);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Top Game Bar: Points, Round and Active Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Round & Director Info */}
        <div className="bg-[#121620]/90 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{director.avatar}</span>
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold">Director de la Ronda {roundNumber}</div>
              <div className="text-sm font-bold text-gray-200">{director.name}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
            Película Oculta
          </span>
        </div>

        {/* Turn Indicator Banner (Essential for 2, 3 and 4 players) */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-amber-500/5 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activeDetective.avatar}</span>
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                Turno de Pregunta
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                {activeDetective.name}
                <span className="text-[11px] text-gray-400 font-normal">
                  ({detectives.length > 1 ? `Detective ${(activeDetectiveIndex % detectives.length) + 1} de ${detectives.length}` : 'Detective'})
                </span>
              </div>
            </div>
          </div>
          {detectives.length > 1 && (
            <button
              type="button"
              onClick={onNextDetectiveTurn}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Pasar turno al siguiente detective"
            >
              Pasar <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Current Round Points Pot */}
        <div className="bg-[#121620]/90 border border-gray-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Pozo de Puntos de la Ronda</div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {currentPoints} pts
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGuessModal}
            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Target className="w-4 h-4" />
            Resolver
          </button>
        </div>
      </div>

      {/* Main Grid: Clues & Interrogation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Clue Cards (Soundtrack & Photogram, -20 pts each) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pistas Disponibles (-20 pts c/u)
            </h3>
            <span className="text-[11px] text-gray-500">
              {Object.values(cluesUsed).filter(Boolean).length}/2 descubiertas
            </span>
          </div>

          {/* Clue 1: Banda Sonora */}
          <div className={`p-4 rounded-xl border transition-all ${
            cluesUsed.soundtrack 
              ? 'bg-[#181D2A] border-amber-500/40 shadow-lg shadow-amber-500/5'
              : 'bg-[#121620]/60 border-gray-800/80 hover:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Music className="w-4 h-4" />
                Pista 1: Banda Sonora
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cluesUsed.soundtrack ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'
              }`}>
                {cluesUsed.soundtrack ? 'Revelada (-20 pts)' : '-20 pts'}
              </span>
            </div>

            {cluesUsed.soundtrack ? (
              <div className="animate-fadeIn">
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {movie.soundtrackClue}
                </p>
                <button
                  type="button"
                  onClick={handlePlaySoundtrackMotif}
                  disabled={playingAudio}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${playingAudio ? 'animate-bounce' : ''}`} />
                  {playingAudio ? 'Reproduciendo sintetizador...' : 'Escuchar motivo musical'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  Descubre el estilo musical, instrumentos clave o compositores legendarios.
                </p>
                <button
                  type="button"
                  onClick={() => onUseClue('soundtrack')}
                  className="w-full py-2 px-3 rounded-lg bg-[#212738] hover:bg-amber-500/20 hover:border-amber-500/50 border border-gray-700 text-gray-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5" />
                  Revelar Pista BSO (-20 pts)
                </button>
              </div>
            )}
          </div>

          {/* Clue 2: Fotograma */}
          <div className={`p-4 rounded-xl border transition-all ${
            cluesUsed.photogram 
              ? 'bg-[#181D2A] border-cyan-500/40 shadow-lg shadow-cyan-500/5'
              : 'bg-[#121620]/60 border-gray-800/80 hover:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <ImageIcon className="w-4 h-4" />
                Pista 2: Fotograma
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                cluesUsed.photogram ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800 text-gray-400'
              }`}>
                {cluesUsed.photogram ? 'Revelada (-20 pts)' : '-20 pts'}
              </span>
            </div>

            {cluesUsed.photogram ? (
              <div className="animate-fadeIn">
                <div className="bg-[#0e121c] p-3 rounded-lg border border-cyan-500/20 mb-2">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold mb-1">
                    Descripción del plano icónico:
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed italic">
                    "{movie.photogramClue}"
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  Revela la escena visual más emblemática descrita por la IA sin decir el título.
                </p>
                <button
                  type="button"
                  onClick={() => onUseClue('photogram')}
                  className="w-full py-2 px-3 rounded-lg bg-[#212738] hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-gray-700 text-gray-300 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Revelar Fotograma (-20 pts)
                </button>
              </div>
            )}
          </div>

          {/* Quick Detective Roster */}
          <div className="p-3.5 rounded-xl bg-[#121620]/50 border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase font-semibold mb-2">
              Turno de detectives:
            </div>
            <div className="space-y-1.5">
              {detectives.map((det, idx) => {
                const isCurrent = idx === activeDetectiveIndex;
                return (
                  <div
                    key={det.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                      isCurrent
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-gray-400 bg-gray-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{det.avatar}</span>
                      <span>{det.name}</span>
                    </div>
                    {isCurrent && <span className="text-[10px] uppercase">Preguntando</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Interrogation Log & Question Input */}
        <div className="lg:col-span-8 flex flex-col h-[580px] bg-[#121620]/90 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Interrogation Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#151926]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-gray-200">
                Interrogatorio con el Árbitro Gemini
              </h3>
            </div>
            <div className="text-xs text-gray-500">
              {questionHistory.length} preguntas formuladas
            </div>
          </div>

          {/* Chat Messages / Interrogation Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {questionHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <HelpCircle className="w-10 h-10 mb-2 opacity-30 text-amber-400" />
                <div className="text-sm font-medium text-gray-400 mb-1">
                  El interrogatorio está listo
                </div>
                <div className="text-xs max-w-sm">
                  {activeDetective.name}, escribe una pregunta directa para descubrir la película secreta o elige una sugerencia rápida.
                </div>
              </div>
            ) : (
              questionHistory.map((item, index) => (
                <div key={index} className="bg-[#181D2A] border border-gray-800/70 rounded-xl p-3.5 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                      <span>{item.detective.avatar}</span>
                      <span>{item.detective.name}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="text-gray-100 font-medium mb-2.5 pl-1">
                    "{item.question}"
                  </div>

                  {/* AI Verdict Box */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${getVerdictStyle(item.veredicto)}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm tracking-wider">
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
              <div className="bg-[#181D2A]/60 border border-gray-800 rounded-xl p-3.5 flex items-center gap-3 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <div className="text-xs text-gray-400">
                  Gemini está contrastando tu pregunta con la ficha técnica...
                </div>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Quick Suggestions Pills */}
          <div className="px-4 py-2 bg-[#151926]/60 border-t border-gray-800/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                disabled={isAsking}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#1e2436] hover:bg-[#283047] text-gray-300 hover:text-amber-300 border border-gray-700/60 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form for Active Detective */}
          <div className="p-3 border-t border-gray-800 bg-[#151926]">
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
                placeholder={`Pregunta de ${activeDetective.name} (ej. ¿Es de los 90?, ¿Es de terror?)...`}
                disabled={isAsking}
                className="flex-1 bg-[#181D2A] border border-gray-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preguntar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
