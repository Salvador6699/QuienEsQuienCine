/**
 * Gemini AI Service for CineClue
 * Direct REST API client for Google Gemini 3.6 Flash
 * Self-contained for Vercel deployment with zero backend dependencies.
 */

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const STORAGE_KEY = 'cineclue_gemini_api_key';

class GeminiService {
  constructor() {
    this.apiKey = this.getApiKey();
    this.modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
  }

  getApiKey() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return DEFAULT_API_KEY;
  }

  setApiKey(key) {
    const clean = (key || '').trim();
    this.apiKey = clean;
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Test API key validity with a lightweight prompt
   */
  async testApiKey(keyToTest) {
    const key = (keyToTest || this.getApiKey()).trim();
    if (!key) return { success: false, message: 'La clave no puede estar vacía' };

    try {
      const res = await this._callGemini(
        'Responde exactamente con la palabra OK.',
        'Eres un verificador de estado rápido.',
        key,
        'gemini-3.6-flash'
      );
      if (res && res.trim().length > 0) {
        return { success: true, message: '¡Clave de Gemini válida y conectada con éxito!' };
      }
      return { success: false, message: 'No se recibió respuesta del modelo.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error al conectar con la API de Gemini.' };
    }
  }

  /**
   * Search and generate complete dossier for a movie typed by Player A
   * @param {string} userQuery Título o descripción escrita por el Jugador A
   * @returns {Promise<Object>} Ficha técnica completa con pistas de BSO y Fotograma
   */
  async searchAndDetailMovie(userQuery) {
    if (!userQuery || userQuery.trim().length === 0) {
      throw new Error('Debes escribir el nombre de una película.');
    }

    const systemPrompt = `Eres un experto historiador y crítico de cine. Tu tarea es identificar con precisión la película que el usuario describe y generar una ficha técnica detallada en formato JSON estricto.
IMPORTANTE:
- Identifica la película correcta incluso si hay erratas en el título o si el usuario escribe solo una palabra clave (ejemplo: si escribe "prisioneros", identifica la película Prisoners de Denis Villeneuve).
- En soundtrackClue, describe el compositor, el instrumento o melodía icónica y el sentimiento de la música SIN revelar el título de la película.
- En soundtrackAudioStyle, elige uno de: 'epic_orchestral' | 'mystery_strings' | 'synthwave' | 'spaghetti_western' | 'waltz_melancholy'.
- En photogramClue, describe un fotograma visual emblemático e inconfundible (iluminación, composición, elementos visuales en pantalla, colores) SIN mencionar nombres de personajes o el título.
- En posterEmoji, elige un emoji representativo del filme.`;

    const prompt = `Película buscada por el usuario: "${userQuery.trim()}".
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "title": "Título en español más conocido",
  "originalTitle": "Título original",
  "year": 2000,
  "directors": ["Nombre del Director"],
  "cast": ["Actor 1", "Actor 2", "Actor 3", "Actor 4"],
  "genres": ["Género 1", "Género 2"],
  "country": "País principal de producción",
  "overview": "Sinopsis de 2 frases capturando la premisa sin revelar el final.",
  "soundtrackClue": "Pista descriptiva de la banda sonora...",
  "soundtrackAudioStyle": "epic_orchestral",
  "photogramClue": "Descripción visual cinematográfica del fotograma más recordado...",
  "posterEmoji": "🎬"
}`;

    const rawText = await this._callGemini(prompt, systemPrompt);
    const parsed = this._extractJson(rawText);

    if (parsed && parsed.title && parsed.year) {
      return {
        id: Date.now(),
        title: parsed.title,
        originalTitle: parsed.originalTitle || parsed.title,
        year: Number(parsed.year) || 2000,
        directors: Array.isArray(parsed.directors) ? parsed.directors : [parsed.directors || 'Director'],
        cast: Array.isArray(parsed.cast) ? parsed.cast : [parsed.cast || 'Actor'],
        genres: Array.isArray(parsed.genres) ? parsed.genres : ['Cine'],
        country: parsed.country || 'Internacional',
        overview: parsed.overview || 'Sinopsis clásica del filme.',
        soundtrackClue: parsed.soundtrackClue || 'Melodía característica que define el ritmo y la atmósfera de la cinta.',
        soundtrackAudioStyle: parsed.soundtrackAudioStyle || 'mystery_strings',
        photogramClue: parsed.photogramClue || 'Un plano con iluminación dramática y elementos visuales característicos.',
        posterEmoji: parsed.posterEmoji || '🎬'
      };
    }

    throw new Error(`Gemini no devolvió un formato válido para "${userQuery}". Respuesta: ${rawText?.slice(0, 120)}`);
  }

  /**
   * Arbitrate a detective's question against the secret movie dossier
   * @param {Object} secretMovie Ficha técnica
   * @param {string} question Pregunta del detective en turno
   * @returns {Promise<{veredicto: string, detalle: string}>}
   */
  async arbitrateQuestion(secretMovie, question) {
    if (!question || !secretMovie) {
      return { veredicto: 'INDETERMINADO', detalle: 'Pregunta o película no válida' };
    }

    const systemPrompt = `Eres el árbitro imparcial del juego de adivinanzas de cine "CineClue". 
Se te proporciona la ficha técnica de la película secreta y la pregunta formulada por un detective.
Debes responder ESTRICTAMENTE en formato JSON:
{
  "veredicto": "SI" | "NO" | "MAYOR" | "MENOR" | "INDETERMINADO",
  "detalle": "máximo 6 a 8 palabras explicando el matiz"
}
Reglas estrictas:
- Si la pregunta compara años (ej. '¿es anterior a 1995?'), responde SI/NO o MAYOR/MENOR según corresponda.
- NUNCA reveles el título, personajes o actores en el campo "detalle".
- Si la pregunta no se puede deducir con certeza de la historia del cine o la ficha técnica, responde INDETERMINADO.`;

    const prompt = `FICHA DE LA PELÍCULA SECRETA:
- Título: ${secretMovie.title} (${secretMovie.originalTitle || ''})
- Año: ${secretMovie.year}
- Directores: ${(secretMovie.directors || []).join(', ')}
- Reparto: ${(secretMovie.cast || []).join(', ')}
- Géneros: ${(secretMovie.genres || []).join(', ')}
- País: ${secretMovie.country}
- Sinopsis: ${secretMovie.overview}

PREGUNTA DEL DETECTIVE:
"${question}"

Devuelve únicamente el JSON con "veredicto" y "detalle".`;

    try {
      const rawText = await this._callGemini(prompt, systemPrompt);
      const parsed = this._extractJson(rawText);
      const validVerdicts = ['SI', 'NO', 'MAYOR', 'MENOR', 'INDETERMINADO'];

      if (parsed && parsed.veredicto) {
        const v = parsed.veredicto.toUpperCase().trim();
        return {
          veredicto: validVerdicts.includes(v) ? v : 'INDETERMINADO',
          detalle: (parsed.detalle || '').slice(0, 100).trim()
        };
      }
    } catch (err) {
      console.warn('Error en arbitrateQuestion con Gemini, usando evaluador heurístico:', err.message);
    }

    // Heuristic arbiter fallback
    return this._heuristicArbitrate(secretMovie, question);
  }

  /**
   * Check if a player's final solve guess is correct
   */
  async checkSolveGuess(secretMovie, guess) {
    if (!guess || !secretMovie) return { isCorrect: false, feedback: 'Respuesta vacía' };

    const cleanGuess = this._normalize(guess);
    const cleanTitle = this._normalize(secretMovie.title);
    const cleanOriginal = this._normalize(secretMovie.originalTitle || '');

    // Direct check
    if (cleanGuess === cleanTitle || cleanGuess === cleanOriginal) {
      return { isCorrect: true, feedback: '¡Título exacto!' };
    }

    // Substring / fuzzy match
    if (cleanGuess.length >= 4 && (cleanTitle.includes(cleanGuess) || cleanOriginal.includes(cleanGuess))) {
      return { isCorrect: true, feedback: '¡Acierto comprobado!' };
    }

    // AI flexible check
    try {
      const prompt = `¿La respuesta del jugador "${guess}" se refiere inequívocamente a la película "${secretMovie.title}" (${secretMovie.year})?
Responde estrictamente con un JSON:
{
  "isCorrect": true/false,
  "feedback": "máximo 4 palabras"
}`;
      const rawText = await this._callGemini(prompt, 'Evalúa si el título escrito por el usuario corresponde a la película objetivo.');
      const parsed = this._extractJson(rawText);
      if (parsed && typeof parsed.isCorrect === 'boolean') {
        return parsed;
      }
    } catch {
      // ignore
    }

    return { isCorrect: false, feedback: 'Título no coincide' };
  }

  /**
   * Internal REST caller for Gemini 3.6 Flash
   */
  async _callGemini(prompt, systemInstruction = '', explicitKey = null, preferredModel = null) {
    const key = (explicitKey || this.getApiKey()).trim();
    if (!key) {
      throw new Error('No hay clave de API de Gemini configurada.');
    }

    const model = preferredModel || this.modelName || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return text;
    }

    throw new Error('La respuesta de Gemini no contiene candidatos de texto.');
  }

  _extractJson(text) {
    if (!text) return null;
    let clean = text.trim();
    // Strip markdown code fences if model wrapped response in ```json ... ```
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    try {
      return JSON.parse(clean);
    } catch {
      // Find JSON block with regex
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  _normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();
  }

  _heuristicArbitrate(movie, question) {
    const q = this._normalize(question);

    // Year check
    const yearMatch = q.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      const targetYear = parseInt(yearMatch[1], 10);
      const isBefore = q.includes('antes') || q.includes('anterior') || q.includes('menor');
      const isAfter = q.includes('despues') || q.includes('posterior') || q.includes('mayor');

      if (isBefore) {
        return {
          veredicto: movie.year < targetYear ? 'SI' : 'NO',
          detalle: movie.year < targetYear ? 'Estrenada antes de ese año' : 'Estrenada en o después'
        };
      }
      if (isAfter) {
        return {
          veredicto: movie.year > targetYear ? 'SI' : 'NO',
          detalle: movie.year > targetYear ? 'Estrenada con posterioridad' : 'Estrenada antes o en año'
        };
      }
    }

    // Oscar / Awards
    if (q.includes('oscar') || q.includes('premio') || q.includes('goya')) {
      return { veredicto: 'SI', detalle: 'Reconocida por la crítica y premios' };
    }

    // Direct match with genres
    for (const genre of movie.genres || []) {
      if (q.includes(this._normalize(genre))) {
        return { veredicto: 'SI', detalle: `Pertenece al género ${genre}` };
      }
    }

    // Default neutral
    return {
      veredicto: 'INDETERMINADO',
      detalle: 'No concluyente en la ficha técnica'
    };
  }
}

export const geminiService = new GeminiService();
