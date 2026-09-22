import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Send,
  Film,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  BookOpen,
  MessageSquare,
  History,
  Target,
  Users,
  ChevronDown,
  Heart
} from 'lucide-react';
import { socketService } from '../services/socket';
import { sounds } from '../utils/audio';

const QUICK_QUESTIONS = [
  "¿Es anterior al año 2000?",
  "¿Ganó algún premio Óscar?",
  "¿El director es europeo o español?",
  "¿Es una película de animación?",
  "¿Dura más de 2 horas?",
  "¿Pertenece al género de Ciencia Ficción o Terror?",
  "¿La película se rodó en blanco y negro?",
  "¿El protagonista principal es mujer?"
];

export default function GameBoard({
  room,
  myPlayerId,
  onOpenGuessModal,
  refereeThinking,
  latestVerdict
}) {
  const [targetId, setTargetId] = useState('ALL');
  const [questionText, setQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'notebook'
  const [showMySecret, setShowMySecret] = useState(false);
  const [myNotes, setMyNotes] = useState(() => localStorage.getItem('cineclue_notes') || '');
  const [crossedClues, setCrossedClues] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cineclue_crossed') || '[]');
    } catch {
      return [];
    }
  });

  const me = room?.players.find(p => p.id === myPlayerId);
  const isMyTurn = room?.currentTurnPlayerId === myPlayerId && !me?.isEliminated;
  const currentTurnPlayer = room?.players.find(p => p.id === room.currentTurnPlayerId);
  const opponents = (room?.players || []).filter(p => p.id !== myPlayerId);

  // Save notes to local storage
  const handleNotesChange = (text) => {
    setMyNotes(text);
    localStorage.setItem('cineclue_notes', text);
  };

  const toggleCrossedClue = (tag) => {
    const next = crossedClues.includes(tag)
      ? crossedClues.filter(t => t !== tag)
      : [...crossedClues, tag];
    setCrossedClues(next);
    localStorage.setItem('cineclue_crossed', JSON.stringify(next));
  };

  const handleSendQuestion = async (e) => {
    e?.preventDefault();
    if (!isMyTurn || !questionText.trim() || submittingQuestion) return;

    setSubmittingQuestion(true);
    sounds.playClapperSnap();

    try {
      await socketService.askQuestion(room.code, targetId, questionText.trim());
      setQuestionText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const selectQuickQuestion = (q) => {
    setQuestionText(q);
    sounds.playClapperSnap();
  };

  // Helper for verdict styling
  const getVerdictBadge = (verdict) => {
    const v = (verdict || '').toUpperCase();
    if (v === 'SI') {
      return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-extrabold text-xs tracking-wider shadow-sm">[SÍ]</span>;
    }
    if (v === 'NO') {
      return <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-extrabold text-xs tracking-wider shadow-sm">[NO]</span>;
    }
    if (v === 'MAYOR') {
      return <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300 font-extrabold text-xs tracking-wider shadow-sm">[MAYOR]</span>;
    }
    if (v === 'MENOR') {
      return <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-extrabold text-xs tracking-wider shadow-sm">[MENOR]</span>;
    }
    return <span className="px-2.5 py-1 rounded-lg bg-gray-700/40 border border-gray-600 text-gray-300 font-extrabold text-xs tracking-wider">[INDETERMINADO]</span>;
  };

  return (
    <div className="max-w-6xl mx-auto my-4 px-4 space-y-6 pb-24">
      
      {/* 1. Turn Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isMyTurn
          ? 'bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border-amber-500 cinema-gold-glow'
          : 'bg-[#121520] border-gray-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
            isMyTurn ? 'bg-amber-400 text-black animate-pulse' : 'bg-gray-800 text-gray-300'
          }`}>
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold uppercase tracking-widest">
                TOMA {room.round || 1} • ESCENA EN VIVO
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-100 flex items-center gap-2">
              {isMyTurn ? (
                <span className="text-amber-300 font-cinema flex items-center gap-2">
                  🎬 ¡ES TU TURNO DE PREGUNTAR!
                </span>
              ) : (
                <span>
                  Turno de <strong className="text-amber-400">{currentTurnPlayer?.name}</strong> {currentTurnPlayer?.avatar}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Lives Counter for me */}
        {me && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-gray-700 text-xs font-mono">
              <span className="text-gray-400">Vidas de resolución:</span>
              <div className="flex gap-1">
                {[1, 2].map(life => (
                  <span
                    key={life}
                    className={`text-sm ${life <= me.lives ? 'text-rose-500' : 'text-gray-700 opacity-40'}`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Rivals Gallery (Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Galería de Directores Rivales ({opponents.length})
          </h3>
          <span className="text-[11px] text-gray-500">Haz clic en un rival para interrogar o resolver</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opponents.map(opp => {
            const isTarget = targetId === opp.id;
            return (
              <div
                key={opp.id}
                className={`relative rounded-2xl border transition-all p-4 flex flex-col justify-between overflow-hidden ${
                  opp.isSolved
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : opp.isEliminated
                    ? 'bg-rose-950/20 border-rose-900/50 opacity-60'
                    : isTarget
                    ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-[#121520] border-gray-800/90 hover:border-gray-700'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-black/40 border border-gray-800">
                      {opp.avatar}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-gray-100 flex items-center gap-1.5">
                        {opp.name}
                        {opp.isEliminated && <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 font-mono">ELIMINADO</span>}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 text-xs">
                        <span className="text-gray-500 text-[10px]">Intentos:</span>
                        <div className="flex gap-0.5">
                          {[1, 2].map(l => (
                            <span key={l} className={`text-[10px] ${l <= opp.lives ? 'text-rose-500' : 'text-gray-700'}`}>
                              ❤️
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {opp.isSolved && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                      ¡DESCUBIERTA!
                    </span>
                  )}
                </div>

                {/* Secret Card Section: Solved Movie Poster vs Mystery Silhouette */}
                <div className="my-2 rounded-xl bg-black/50 border border-gray-800/80 p-3 min-h-[110px] flex items-center gap-3">
                  {opp.isSolved && opp.secretMovie ? (
                    <>
                      {opp.secretMovie.poster_path ? (
                        <img
                          src={opp.secretMovie.poster_path}
                          alt=""
                          className="w-16 h-24 object-cover rounded-lg border border-emerald-500/40 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="text-emerald-400 font-bold block truncate text-sm">
                          {opp.secretMovie.title}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          {opp.secretMovie.year} • {(opp.secretMovie.directors || []).join(', ')}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Descubierta por: {opp.solvedBy || 'Rival'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-3 py-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-cinema text-xl font-black animate-pulse">
                        ?
                      </div>
                      <div className="text-left text-xs">
                        <span className="text-gray-300 font-semibold block">Película Enigma</span>
                        <span className="text-[11px] text-gray-500">Oculta ante el Árbitro Gemini</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                {!opp.isSolved && !opp.isEliminated && (
                  <div className="pt-2 mt-1 grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetId(opp.id);
                        sounds.playClapperSnap();
                      }}
                      className={`py-1.5 px-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all ${
                        isTarget
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      Preguntar
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenGuessModal(opp)}
                      className="py-1.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      Resolver
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Question Interrogation Console */}
      <div className="rounded-3xl bg-[#121520] border border-amber-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clapperboard className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold font-cinema text-gray-100 uppercase tracking-wider">
              Consola de Interrogatorio al Árbitro Gemini
            </h3>
          </div>
          <span className="text-xs text-amber-400/80 font-mono-code">Gemini 3.8 Flash</span>
        </div>

        {/* Target Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="text-gray-400 font-medium">Dirigir pregunta a:</span>
          
          <button
            type="button"
            onClick={() => setTargetId('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              targetId === 'ALL'
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-black/40 border border-gray-800 text-gray-300 hover:bg-gray-800'
            }`}
          >
            📢 A TODOS LOS RIVALES
          </button>

          {opponents.filter(o => !o.isSolved && !o.isEliminated).map(opp => (
            <button
              key={opp.id}
              type="button"
              onClick={() => setTargetId(opp.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                targetId === opp.id
                  ? 'bg-amber-400 text-black font-bold shadow-md'
                  : 'bg-black/40 border border-gray-800 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>{opp.avatar}</span>
              <span>{opp.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mb-3">
          <span className="text-[11px] text-gray-400 block mb-1.5">Sugerencias rápidas de preguntas:</span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectQuickQuestion(q)}
                className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-gray-800 hover:border-amber-500/40 text-[11px] text-gray-300 hover:text-amber-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Submit */}
        <form onSubmit={handleSendQuestion} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              disabled={!isMyTurn || submittingQuestion || refereeThinking}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder={
                !isMyTurn
                  ? "Espera tu turno para formular una pregunta al árbitro..."
                  : "Escribe tu pregunta en lenguaje natural (ej: ¿Es posterior al 2010? ¿El protagonista muere?)..."
              }
              className="w-full px-4 py-3.5 rounded-2xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-sm text-gray-100 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              {targetId === 'ALL'
                ? 'Gemini responderá individualmente para cada rival con su película oculta.'
                : 'Gemini consultará la ficha técnica del rival seleccionado.'}
            </span>

            <button
              type="submit"
              disabled={!isMyTurn || !questionText.trim() || submittingQuestion || refereeThinking}
              className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                isMyTurn && questionText.trim() && !submittingQuestion && !refereeThinking
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black cursor-pointer shadow-amber-500/25 active:scale-98'
                  : 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {submittingQuestion || refereeThinking ? 'Árbitro Deliberando...' : 'Consultar al Árbitro'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Gemini Referee Deliberation Banner */}
      {refereeThinking && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-blue-950/40 border border-blue-500/40 flex items-center justify-center gap-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-sm font-semibold text-blue-200">
            🎬 Gemini 3.8 Flash está deliberando con la ficha técnica secreta...
          </span>
        </div>
      )}

      {/* 5. Dual Section: Timeline Q&A vs Detective Notebook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Main: Timeline Q&A Feed */}
        <div className="lg:col-span-8 rounded-3xl bg-[#121520] border border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono-code">
                Historial de Veredictos del Árbitro ({room.history?.length || 0})
              </h3>
            </div>
            <span className="text-[11px] text-gray-500">Últimas preguntas formuladas</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {room.history?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                Aún no se han formulado preguntas. ¡Comienza el interrogatorio de cine!
              </div>
            ) : (
              room.history?.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-black/40 border border-gray-800/80 space-y-3 transition-all hover:border-gray-700"
                >
                  {/* Asker and Question */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{item.askerAvatar}</span>
                        <strong className="text-gray-300">{item.askerName}</strong>
                        <span className="text-gray-500 text-[10px]">preguntó ({item.targetName}):</span>
                      </div>
                      <p className="text-sm font-semibold text-amber-200">
                        "{item.question}"
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Verdict Results */}
                  <div className="pt-2 border-t border-gray-800/60 space-y-1.5">
                    {item.results?.map(res => (
                      <div
                        key={res.targetId}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-gray-900/50 border border-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{res.targetAvatar}</span>
                          <span className="text-gray-400 font-medium">{res.targetName}:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {getVerdictBadge(res.verdict?.veredicto)}
                          {res.verdict?.detalle && (
                            <span className="text-gray-400 text-[11px] italic">
                              "{res.verdict.detalle}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Detective Deduction Notebook */}
        <div className="lg:col-span-4 rounded-3xl bg-[#121520] border border-gray-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-3">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono-code">
                Libreta del Detective (Privada)
              </h3>
            </div>
            
            <p className="text-[11px] text-gray-500 mb-2">
              Tacha pistas descartadas o anota tus deducciones. Solo tú puedes ver este bloc.
            </p>

            {/* Quick crossable chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                'Antes 2000', 'Después 2000', 'Premios Óscar', 'Animación',
                'Director Europeo', 'EEUU', 'Terror', 'Comedia', 'Ciencia Ficción', 'Drama', '+ 2 Horas'
              ].map(tag => {
                const isCrossed = crossedClues.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCrossedClue(tag)}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                      isCrossed
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 line-through opacity-70'
                        : 'bg-black/30 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Freeform Notes */}
            <textarea
              rows={8}
              value={myNotes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Escribe tus pistas, sospechas de actores o títulos que vayas deduciendo..."
              className="w-full p-3 rounded-2xl bg-black/50 border border-gray-800 focus:border-amber-500 focus:outline-none text-xs text-gray-200 resize-none font-mono placeholder-gray-600"
            />
          </div>

          <div className="text-[10px] text-gray-600 font-mono pt-2 border-t border-gray-800/80">
            Tus notas se guardan automáticamente en tu dispositivo.
          </div>
        </div>

      </div>

      {/* 6. Sticky Floating Drawer for "Mi Película Oculta" */}
      {me?.secretMovie && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            type="button"
            onClick={() => setShowMySecret(!showMySecret)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-xl backdrop-blur-md hover:bg-amber-500/25 transition-all"
          >
            {showMySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Mi Película Oculta</span>
          </button>

          {showMySecret && (
            <div className="absolute bottom-12 left-0 w-80 rounded-2xl bg-[#121520] border border-amber-500/50 p-4 shadow-2xl space-y-2 text-xs animate-fadeIn">
              <div className="flex gap-3">
                {me.secretMovie.poster_path && (
                  <img
                    src={me.secretMovie.poster_path}
                    alt=""
                    className="w-14 h-20 object-cover rounded-lg border border-gray-700 shadow flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-400 font-mono uppercase block">Tu Secreto:</span>
                  <h4 className="font-bold text-gray-100 truncate">{me.secretMovie.title}</h4>
                  <span className="text-[11px] text-gray-400 block">{me.secretMovie.year}</span>
                  <span className="text-[10px] text-gray-500 block truncate">{(me.secretMovie.directors || []).join(', ')}</span>
                </div>
              </div>
              <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-800">
                <span>Reparto: </span>
                <span className="text-gray-300">{(me.secretMovie.cast || []).slice(0, 3).join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
