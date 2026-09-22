import React from 'react';
import { X, Clapperboard, Sparkles, Music, Image as ImageIcon, Users, Trophy } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121520] border border-amber-500/30 p-6 shadow-2xl text-gray-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clapperboard className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-cinema text-amber-300">Reglas Oficiales: CineClue</h2>
            <p className="text-xs text-gray-400">Quién es Quién de Cine con Árbitro Gemini AI</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
          {/* Rule 1: Jugadores y Roles */}
          <div className="p-4 rounded-xl bg-[#181D2A] border border-gray-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-400" />
              1. Jugadores y Roles (2, 3 o 4 jugadores)
            </h3>
            <p className="mb-2">
              En cada ronda, un jugador asume el rol de <strong>Director</strong> y los demás son los <strong>Detectives</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><strong>2 Jugadores:</strong> 1 Director elige la película secreta y 1 Detective la interroga.</li>
              <li><strong>3 o 4 Jugadores:</strong> 1 Director elige y los Detectives toman turnos rotativos para hacer preguntas.</li>
              <li>Al finalizar la ronda, el rol de Director pasa automáticamente al siguiente jugador.</li>
            </ul>
          </div>

          {/* Rule 2: Selección y Confirmación con IA */}
          <div className="p-4 rounded-xl bg-[#181D2A] border border-gray-800">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              2. Selección y Confirmación Secreta
            </h3>
            <p>
              El Director escribe cualquier película que desee. La IA de Gemini busca la ficha técnica completa y le muestra una tarjeta previa. El Director confirma si es exactamente la que tiene en mente antes de comenzar el interrogatorio.
            </p>
          </div>

          {/* Rule 3: Puntuación y Pistas (100 pts) */}
          <div className="p-4 rounded-xl bg-[#181D2A] border border-gray-800">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              3. Sistema de Puntos y Pistas (100 puntos base)
            </h3>
            <p className="mb-2">
              La ronda comienza con un pozo máximo de <strong>100 puntos</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="p-2.5 rounded-lg bg-[#121620] border border-amber-500/30 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <strong className="text-amber-300">Pista Banda Sonora:</strong>
                  <div className="text-[11px] text-gray-400">Resta 20 puntos del pozo</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121620] border border-cyan-500/30 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <strong className="text-cyan-300">Pista Fotograma:</strong>
                  <div className="text-[11px] text-gray-400">Resta 20 puntos del pozo</div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              El detective que acierte la película se adjudica todos los puntos restantes de la ronda (100, 80 o 60 pts).
            </p>
          </div>

          {/* Rule 4: El Árbitro IA */}
          <div className="p-4 rounded-xl bg-[#181D2A] border border-gray-800">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              4. Respuestas del Árbitro Gemini
            </h3>
            <p className="mb-2">
              Gemini evalúa cada pregunta de forma rigurosa y responde con:
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">SÍ</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">NO</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">MAYOR</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">MENOR</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">INDETERMINADO</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            ¡Entendido, a jugar!
          </button>
        </div>
      </div>
    </div>
  );
}
