import React, { useState } from 'react';
import { Key, X, CheckCircle2, AlertTriangle, Sparkles, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { sounds } from '../utils/audio';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(geminiService.getApiKey() || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    sounds.playClapperSnap();
    geminiService.setApiKey(apiKey);
    setTestResult({ success: true, message: '¡Clave guardada con éxito!' });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTest = async () => {
    sounds.playClapperSnap();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await geminiService.testApiKey(apiKey);
      setTestResult(res);
      if (res.success) {
        geminiService.setApiKey(apiKey);
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Error de conexión' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#151926] border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Clave de Gemini AI</h3>
            <p className="text-xs text-gray-400">
              La IA analiza películas y arbitra las preguntas
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="Pega aquí tu clave (AQ... o AIza...)"
              className="w-full bg-[#181D2A] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/60 font-mono transition-colors"
            />
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Se almacena localmente en tu navegador (`localStorage`) para tus partidas en Vercel. También puedes definirla como variable de entorno `VITE_GEMINI_API_KEY`.
          </p>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="flex-1 py-3 rounded-xl bg-[#1e2436] hover:bg-[#283047] text-gray-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {testing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Probando...
              </>
            ) : (
              'Probar Conexión'
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Guardar Clave
          </button>
        </div>
      </div>
    </div>
  );
}
