/**
 * Gemini AI Service for CineClue
 * Optimized for ultra-fast response, real movie frame images, and real official soundtrack audio.
 */

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const STORAGE_KEY = 'cineclue_gemini_api_key';

class GeminiService {
  constructor() {
    this.apiKey = this.getApiKey();
    this.modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-lite-latest';
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
        'gemini-flash-lite-latest'
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
   * Also fetches real movie frame image and real soundtrack audio preview.
   * @param {string} userQuery Título o descripción escrita por el Jugador A
   * @returns {Promise<Object>} Ficha técnica completa con imagen real y audio real
   */
  async searchAndDetailMovie(userQuery) {
    if (!userQuery || userQuery.trim().length === 0) {
      throw new Error('Debes escribir el nombre de una película.');
    }

    const systemPrompt = `Eres un experto historiador y crítico de cine. Tu tarea es identificar con precisión la película que el usuario describe y generar una ficha técnica detallada en formato JSON estricto.
IMPORTANTE:
- Identifica la película correcta incluso si hay erratas en el título o si el usuario escribe solo una palabra clave.
- En composer, incluye el nombre del compositor principal de la banda sonora (ej. Hans Zimmer, John Williams, Jóhann Jóhannsson).
- En posterEmoji, elige un emoji representativo del filme.`;

    const prompt = `Película buscada por el usuario: "${userQuery.trim()}".
Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
{
  "title": "Título en español más conocido",
  "originalTitle": "Título original",
  "year": 2000,
  "directors": ["Nombre del Director"],
  "cast": ["Actor 1", "Actor 2", "Actor 3", "Actor 4"],
  "genres": ["Género 1", "Género 2"],
  "country": "País principal de producción",
  "overview": "Sinopsis de 2 frases capturando la premisa sin revelar el final.",
  "composer": "Nombre del compositor principal",
  "soundtrackClue": "Breve frase sobre la música sin decir el título",
  "posterEmoji": "🎬"
}`;

    const rawText = await this._callGemini(prompt, systemPrompt, null, null, true);
    const parsed = this._extractJson(rawText);

    if (parsed && parsed.title && parsed.year) {
      // Fetch real media assets (image and audio) in parallel
      const mediaAssets = await this._fetchMediaAssets(
        parsed.title,
        parsed.originalTitle || parsed.title,
        parsed.year,
        parsed.composer
      );

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
        composer: parsed.composer || 'Compositor de cine',
        soundtrackClue: parsed.soundtrackClue || `Banda sonora compuesta por ${parsed.composer || 'orquesta'}`,
        posterEmoji: parsed.posterEmoji || '🎬',
        frameImage: mediaAssets.frameImage || null,
        audio: mediaAssets.audio || null
      };
    }

    throw new Error(`Gemini no devolvió un formato válido para "${userQuery}".`);
  }

  /**
   * Fetch real movie frame image from OMDb and real audio preview from iTunes
   */
  async _fetchMediaAssets(title, originalTitle, year, composer) {
    let frameImage = null;
    let audio = null;

    // 1. Fetch real movie image from OMDb
    const imageQueries = [originalTitle, title].filter(Boolean);
    for (const q of imageQueries) {
      try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=trilogy&t=${encodeURIComponent(q)}&y=${year || ''}`);
        const d = await res.json();
        if (d.Response === 'True' && d.Poster && d.Poster !== 'N/A') {
          frameImage = d.Poster;
          break;
        }
      } catch {
        // ignore
      }
    }

    // 2. Fetch real official audio preview from iTunes Search API
    const audioQueries = [];
    if (composer) {
      audioQueries.push(`${composer} ${originalTitle || title}`);
    }
    audioQueries.push(`${originalTitle || title} soundtrack`);
    audioQueries.push(originalTitle || title);

    for (const q of audioQueries) {
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`);
        const d = await res.json();
        if (d.results && d.results.length > 0) {
          const match = d.results.find(r => r.previewUrl);
          if (match) {
            audio = {
              url: match.previewUrl,
              track: match.trackName,
              artist: match.artistName,
              artwork: match.artworkUrl100
            };
            break;
          }
        }
      } catch {
        // ignore
      }
    }

    return { frameImage, audio };
  }

  /**
   * Arbitrate a detective's question against the secret movie dossier
   * Instant heuristic check first (0ms), fallback to Gemini with strict Yes/No.
   */
  async arbitrateQuestion(secretMovie, question) {
    if (!question || !secretMovie) {
      return { veredicto: 'INDETERMINADO', detalle: 'Pregunta no válida' };
    }

    // 1. Instant local heuristic check (0ms response, zero latency, 100% spoiler-free!)
    const instantVerdict = this._instantHeuristic(secretMovie, question);
    if (instantVerdict) {
      return instantVerdict;
    }

    // 2. Ultra-fast semantic evaluation with Gemini
    const systemPrompt = `Eres el árbitro imparcial del juego "Quién es Quién: Cine".
Se te proporciona la ficha de una película secreta y una pregunta formulada por un detective.
Tu misión es responder ESTRICTAMENTE en formato JSON:
{
  "veredicto": "SI" | "NO" | "MAYOR" | "MENOR" | "INDETERMINADO",
  "detalle": "máximo 4 palabras neutrales"
}

REGLAS DE ORO OBLIGATORIAS:
- El "veredicto" SOLO puede ser una de estas 5 palabras: "SI", "NO", "MAYOR", "MENOR", "INDETERMINADO".
- PROHIBIDO DAR LA RESPUESTA O EL TÍTULO. Jamás reveles la solución.
- Si el detective formula una pregunta abierta ("¿de qué trata?", "¿quién es?", "¿cómo se llama?"), responde siempre:
  "veredicto": "INDETERMINADO", "detalle": "Solo preguntas de Sí o No"
- NUNCA incluyas en "detalle" el nombre de los actores, director, personajes ni el año exacto.
- Si la pregunta compara años o valores numéricos, responde MAYOR o MENOR según corresponda.`;

    const prompt = `FICHA TÉCNICA SECRETA:
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
      const rawText = await this._callGemini(prompt, systemPrompt, null, null, true);
      const parsed = this._extractJson(rawText);
      const validVerdicts = ['SI', 'NO', 'MAYOR', 'MENOR', 'INDETERMINADO'];

      if (parsed && parsed.veredicto) {
        let v = parsed.veredicto.toUpperCase().trim();
        if (!validVerdicts.includes(v)) {
          v = v.includes('SI') ? 'SI' : v.includes('NO') ? 'NO' : 'INDETERMINADO';
        }

        // Anti-spoiler sanitize
        const sanitizedDetalle = this._sanitizeDetalle(parsed.detalle || '', secretMovie);

        return {
          veredicto: v,
          detalle: sanitizedDetalle
        };
      }
    } catch (err) {
      console.warn('Error en arbitrateQuestion con Gemini:', err.message);
    }

    return {
      veredicto: 'INDETERMINADO',
      detalle: 'No concluyente en la ficha'
    };
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

    // Substring match
    if (cleanGuess.length >= 4 && (cleanTitle.includes(cleanGuess) || cleanOriginal.includes(cleanGuess))) {
      return { isCorrect: true, feedback: '¡Acierto comprobado!' };
    }

    // AI flexible check
    try {
      const prompt = `¿La respuesta del jugador "${guess}" se refiere inequívocamente a la película "${secretMovie.title}" (${secretMovie.year})?
Responde estrictamente en JSON:
{
  "isCorrect": true/false,
  "feedback": "máximo 3 palabras"
}`;
      const rawText = await this._callGemini(prompt, 'Evalúa si el título escrito corresponde a la película objetivo.', null, null, true, 40);
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
   * Instant local heuristic checker for ultra-fast standard questions (0ms)
   */
  _instantHeuristic(movie, question) {
    const q = this._normalize(question);

    // 1. Direct title inquiry
    const normTitle = this._normalize(movie.title);
    const normOriginal = this._normalize(movie.originalTitle || '');
    if (q.includes(normTitle) || (normOriginal.length > 3 && q.includes(normOriginal))) {
      return {
        veredicto: 'SI',
        detalle: '¡Película correcta!'
      };
    }

    // 2. Open questions filter -> MUST be INDETERMINADO!
    if (
      q.includes('quien') || 
      q.includes('como se llama') || 
      q.includes('de que trata') || 
      q.includes('cual es') || 
      q.includes('que pelicula') ||
      q.includes('dime el') ||
      q.includes('dime la')
    ) {
      return {
        veredicto: 'INDETERMINADO',
        detalle: 'Solo preguntas de Sí o No'
      };
    }

    // 3. Year comparisons
    const yearMatch = q.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      const targetYear = parseInt(yearMatch[1], 10);
      const isBefore = q.includes('antes') || q.includes('anterior') || q.includes('menor');
      const isAfter = q.includes('despues') || q.includes('posterior') || q.includes('mayor') || q.includes('luego');

      if (isBefore) {
        return {
          veredicto: movie.year < targetYear ? 'SI' : 'NO',
          detalle: movie.year < targetYear ? 'Anterior a esa fecha' : 'Estrenada en o después'
        };
      }
      if (isAfter) {
        return {
          veredicto: movie.year > targetYear ? 'SI' : 'NO',
          detalle: movie.year > targetYear ? 'Posterior a esa fecha' : 'Estrenada antes o en año'
        };
      }
      if (q.includes('es del') || q.includes('es de') || q.includes('ano') || q.includes('estreno')) {
        if (movie.year === targetYear) {
          return { veredicto: 'SI', detalle: 'Año exacto coincide' };
        }
        return {
          veredicto: movie.year > targetYear ? 'MAYOR' : 'MENOR',
          detalle: movie.year > targetYear ? 'Es más reciente' : 'Es más antigua'
        };
      }
    }

    // 4. Decades
    if (q.includes('los 90') || q.includes('anos 90') || q.includes('noventa')) {
      const is90s = movie.year >= 1990 && movie.year <= 1999;
      return { veredicto: is90s ? 'SI' : 'NO', detalle: is90s ? 'Década de 1990' : 'Otra década' };
    }
    if (q.includes('los 80') || q.includes('anos 80') || q.includes('ochenta')) {
      const is80s = movie.year >= 1980 && movie.year <= 1989;
      return { veredicto: is80s ? 'SI' : 'NO', detalle: is80s ? 'Década de 1980' : 'Otra década' };
    }
    if (q.includes('los 2000') || q.includes('anos 2000') || q.includes('siglo xxi')) {
      const is2000s = movie.year >= 2000;
      return { veredicto: is2000s ? 'SI' : 'NO', detalle: is2000s ? 'Siglo XXI' : 'Siglo XX' };
    }

    // 5. Oscars and Awards
    if (q.includes('oscar') || q.includes('premio') || q.includes('goya') || q.includes('estatuilla')) {
      return {
        veredicto: 'SI',
        detalle: 'Reconocida por la crítica'
      };
    }

    // 6. Animation
    if (q.includes('animacion') || q.includes('dibujo') || q.includes('animada')) {
      const isAnim = (movie.genres || []).some(g => this._normalize(g).includes('animaci'));
      return {
        veredicto: isAnim ? 'SI' : 'NO',
        detalle: isAnim ? 'Producción de animación' : 'Imagen real'
      };
    }

    // 7. Runtime / Duration
    if (q.includes('2 horas') || q.includes('dos horas') || q.includes('120 min') || q.includes('larga')) {
      return {
        veredicto: 'SI',
        detalle: 'Metraje superior estándar'
      };
    }

    // 8. Common Genres
    const genresToCheck = [
      { key: 'terror', name: 'terror' },
      { key: 'miedo', name: 'terror' },
      { key: 'comedia', name: 'comedia' },
      { key: 'graciosa', name: 'comedia' },
      { key: 'ciencia ficcion', name: 'ciencia ficcion' },
      { key: 'ficcion', name: 'ciencia ficcion' },
      { key: 'accion', name: 'accion' },
      { key: 'drama', name: 'drama' },
      { key: 'romance', name: 'romance' },
      { key: 'romantica', name: 'romance' },
      { key: 'thriller', name: 'thriller' },
      { key: 'suspense', name: 'thriller' },
      { key: 'misterio', name: 'misterio' },
      { key: 'crimen', name: 'crimen' },
      { key: 'policiaca', name: 'crimen' }
    ];

    for (const g of genresToCheck) {
      if (q.includes(g.key)) {
        const matches = (movie.genres || []).some(genreStr =>
          this._normalize(genreStr).includes(g.name)
        );
        return {
          veredicto: matches ? 'SI' : 'NO',
          detalle: matches ? 'Género confirmado' : 'No clasificada en ese género'
        };
      }
    }

    // 9. Country / Nationality (Dynamic matcher for all countries)
    const countries = [
      { keys: ['italia', 'italiana', 'italiano'], id: 'italia', label: 'Producción italiana' },
      { keys: ['espana', 'espanol', 'espanola'], id: 'espana', label: 'Producción española' },
      { keys: ['francia', 'frances', 'francesa'], id: 'francia', label: 'Producción francesa' },
      { keys: ['estados unidos', 'americana', 'americano', 'eeuu', 'hollywood', 'norteamericana'], id: 'estados unidos', label: 'Producción estadounidense' },
      { keys: ['reino unido', 'inglaterra', 'britanica', 'britanico', 'inglesa'], id: 'reino unido', label: 'Producción británica' },
      { keys: ['alemania', 'aleman', 'alemana'], id: 'alemania', label: 'Producción alemana' },
      { keys: ['japon', 'japones', 'japonesa'], id: 'japon', label: 'Producción japonesa' },
      { keys: ['corea', 'coreana', 'coreano'], id: 'corea', label: 'Producción coreana' },
      { keys: ['mexico', 'mexicana', 'mexicano'], id: 'mexico', label: 'Producción mexicana' },
      { keys: ['argentina', 'argentino', 'argentina'], id: 'argentina', label: 'Producción argentina' }
    ];

    const movieCountry = this._normalize(movie.country || '');
    for (const c of countries) {
      if (c.keys.some(k => q.includes(k))) {
        const match = movieCountry.includes(c.id);
        return {
          veredicto: match ? 'SI' : 'NO',
          detalle: match ? c.label : 'Producción de otro país'
        };
      }
    }

    if (q.includes('europeo') || q.includes('europa') || q.includes('europea')) {
      const euroCountries = ['espana', 'francia', 'italia', 'reino unido', 'alemania', 'suecia', 'dinamarca', 'belgica', 'irlanda'];
      const isEuro = euroCountries.some(c => movieCountry.includes(c));
      return {
        veredicto: isEuro ? 'SI' : 'NO',
        detalle: isEuro ? 'Origen cinematográfico europeo' : 'Origen no europeo'
      };
    }

    // 10. Director checks
    const directors = (movie.directors || []).map(d => this._normalize(d));
    for (const d of directors) {
      const parts = d.split(' ');
      const lastName = parts[parts.length - 1];
      if (q.includes(d) || (lastName.length > 3 && q.includes(lastName))) {
        return { veredicto: 'SI', detalle: 'Dirección confirmada' };
      }
    }

    // 11. Actor checks
    const cast = (movie.cast || []).map(c => this._normalize(c));
    for (const a of cast) {
      const actorNameOnly = a.split('(')[0].trim();
      const parts = actorNameOnly.split(' ');
      const lastName = parts[parts.length - 1];
      if (q.includes(actorNameOnly) || (lastName.length > 3 && q.includes(lastName))) {
        return { veredicto: 'SI', detalle: 'Figura en el reparto' };
      }
    }

    return null;
  }

  _sanitizeDetalle(detalle, movie) {
    if (!detalle) return '';
    let clean = detalle.trim().slice(0, 50);

    const titleWords = this._normalize(movie.title).split(' ').filter(w => w.length > 3);
    for (const word of titleWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(regex, '***');
    }

    if (movie.year) {
      clean = clean.replace(new RegExp(`\\b${movie.year}\\b`, 'g'), 'esa fecha');
    }

    return clean;
  }

  async _callGemini(prompt, systemInstruction = '', explicitKey = null, preferredModel = null, forceJson = false, maxTokens = null) {
    const key = (explicitKey || this.getApiKey()).trim();
    if (!key) {
      throw new Error('No hay clave de API de Gemini configurada.');
    }

    const modelsToTry = [
      preferredModel || this.modelName || 'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest'
    ];
    const uniqueModels = [...new Set(modelsToTry)];

    let lastError = null;

    for (const model of uniqueModels) {
      try {
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

        payload.generationConfig = {
          temperature: 0.1
        };

        if (forceJson) {
          payload.generationConfig.responseMimeType = 'application/json';
        }

        if (maxTokens) {
          payload.generationConfig.maxOutputTokens = maxTokens;
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

        throw new Error('La respuesta de Gemini no contiene texto.');
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo obtener respuesta de Gemini.');
  }

  _extractJson(text) {
    if (!text) return null;
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    try {
      return JSON.parse(clean);
    } catch {
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
}

export const geminiService = new GeminiService();
