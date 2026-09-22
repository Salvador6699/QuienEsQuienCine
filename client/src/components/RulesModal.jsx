import React from 'react';
import { X, Clapperboard, Sparkles, HelpCircle, ShieldAlert, Award } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121520] border border-amber-500/30 p-6 shadow-2xl shadow-amber-500/10 text-gray-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clapperboard className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-cinema text-amber-300">Reglamento Oficial: CineClue</h2>
            <p className="text-xs text-gray-400">Quién es Quién de Cine con Árbitro IA Oficial</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          {/* Phase 1 */}
          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <h3 className="text-base font-semibold text-amber-400 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono">1</span>
              Fase de Preparación (Película Secreta)
            </h3>
            <p>
              Cada jugador busca y elige en secreto una película real utilizando la base de datos de <strong>TMDB</strong>.
              El servidor almacena de forma segura su ficha técnica (año, director, reparto, géneros, país, sinopsis).
              <strong>¡Ningún rival podrá ver tu película elegida!</strong>
            </p>
          </div>

          {/* Phase 2 */}
          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <h3 className="text-base font-semibold text-amber-400 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono">2</span>
              Fase de Partida y Turnos
            </h3>
            <p className="mb-2">
              Los turnos rotan entre los jugadores activos. En tu turno puedes hacer <strong>una pregunta en lenguaje natural</strong> dirigida a un rival específico o a <strong>TODOS</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-code text-gray-400">
              <div className="p-2 rounded bg-black/40 border border-gray-800">"¿Es anterior al año 2000?"</div>
              <div className="p-2 rounded bg-black/40 border border-gray-800">"¿Ganó algún premio Óscar?"</div>
              <div className="p-2 rounded bg-black/40 border border-gray-800">"¿El director es europeo?"</div>
              <div className="p-2 rounded bg-black/40 border border-gray-800">"¿Dura más de 2 horas?"</div>
            </div>
          </div>

          {/* Phase 3 - Referee Gemini */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-purple-950/30 border border-blue-500/30">
            <h3 className="text-base font-semibold text-blue-400 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
              Árbitro IA Oficial: Gemini 3.8 Flash
            </h3>
            <p className="mb-3">
              Gemini compara tu pregunta con la ficha técnica oculta del rival y emite un veredicto estricto en JSON:
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">[SÍ]</span>
              <span className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">[NO]</span>
              <span className="px-2.5 py-1 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300">[MAYOR]</span>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">[MENOR]</span>
              <span className="px-2.5 py-1 rounded bg-gray-600/30 border border-gray-600/40 text-gray-300">[INDETERMINADO]</span>
            </div>
            <p className="mt-2 text-xs text-gray-400 italic">
              * El árbitro puede incluir una aclaración de máximo 6 palabras sin revelar nombres ni el título.
            </p>
          </div>

          {/* Phase 4 - Guessing and Lives */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <h3 className="text-base font-semibold text-rose-400 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Resolución y Vidas de Adivinanza
            </h3>
            <p>
              Cada jugador cuenta con <strong>2 intentos (vidas)</strong> de resolución:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-300">
              <li>Si adivinas la película de un rival, su tarjeta se revela al público y queda descubierta.</li>
              <li>Si fallas la adivinanza, <strong>pierdes 1 intento</strong>. Al llegar a 0 intentos, quedas <strong>eliminado</strong>.</li>
              <li>¡Gana el jugador que descubra todas las películas rivales o el último participante en pie!</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/25 transition-all"
          >
            ¡Entendido, al plató!
          </button>
        </div>

      </div>
    </div>
  );
}
