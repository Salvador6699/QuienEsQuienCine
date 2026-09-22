import React, { useState, useEffect } from 'react';
import { X, Key, Film, Sparkles, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [tmdbKey, setTmdbKey] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [status, setStatus] = useState({ hasGeminiKey: false, hasTmdbKey: false });
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then(r => r.json())
        .then(data => {
          setStatus({
            hasGeminiKey: data.hasGeminiKey,
            hasTmdbKey: data.hasTmdbKey
          });
          if (data.modelName) setModelName(data.modelName);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiKey.trim() || undefined,
          tmdbApiKey: tmdbKey.trim() || undefined,
          modelName
        })
      });
      const data = await res.json();
      setStatus({
        hasGeminiKey: data.hasGeminiKey,
        hasTmdbKey: data.hasTmdbKey
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestReferee = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/referee/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: {
            title: 'El Padrino',
            year: 1972,
            directors: ['Francis Ford Coppola'],
            cast: ['Marlon Brando', 'Al Pacino'],
            genres: ['Drama', 'Crimen'],
            country: 'Estados Unidos',
            awards: '3 premios Óscar'
          },
          question: '¿Es una película anterior al año 2000?'
        })
      });
      const data = await res.json();
      setTestResult(data.verdict);
    } catch (err) {
      setTestResult({ veredicto: 'ERROR', detalle: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#121520] border border-gray-700/80 p-6 shadow-2xl text-gray-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-gray-800 text-amber-400 border border-gray-700">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-cinema text-amber-300">Ajustes de API y Modelo</h2>
            <p className="text-xs text-gray-400">Configura tus claves opcionales de Gemini y TMDB</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* Status Pills */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-700 flex items-center justify-between">
              <span>Árbitro Gemini:</span>
              {status.hasGeminiKey ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Heurístico
                </span>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-700 flex items-center justify-between">
              <span>Buscador TMDB:</span>
              {status.hasTmdbKey ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> API TMDB
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Catálogo Local
                </span>
              )}
            </div>
          </div>

          {/* Gemini API Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
              <span>Gemini API Key (Google GenAI)</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline"
              >
                Obtener clave gratis ↗
              </a>
            </label>
            <input
              type="password"
              placeholder={status.hasGeminiKey ? "••••••••••••••••••••••••••••" : "Pega tu clave AIzaSy..."}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-xs font-mono text-gray-200"
            />
          </div>

          {/* Gemini Model */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Modelo de Árbitro IA
            </label>
            <select
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-xs text-gray-200"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 / 3.8 Flash (Recomendado - Ultra rápido)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>

          {/* TMDB API Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
              <span>TMDB API Key (v3)</span>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline"
              >
                Obtener de themoviedb.org ↗
              </a>
            </label>
            <input
              type="password"
              placeholder={status.hasTmdbKey ? "••••••••••••••••••••••••••••" : "Pega tu clave TMDB..."}
              value={tmdbKey}
              onChange={e => setTmdbKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-700 focus:border-amber-500 focus:outline-none text-xs font-mono text-gray-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestReferee}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-300 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Probar Árbitro
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saveSuccess ? '¡Guardado!' : 'Guardar Ajustes'}
            </button>
          </div>
        </form>

        {/* Live Test Verdict Card */}
        {testResult && (
          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-gray-800 text-xs">
            <span className="text-gray-400 block mb-1">Prueba contra 'El Padrino' (1972) - "¿Es anterior al 2000?":</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-bold ${
                testResult.veredicto === 'SI' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300'
              }`}>
                [{testResult.veredicto}]
              </span>
              <span className="text-gray-300 italic">{testResult.detalle}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
