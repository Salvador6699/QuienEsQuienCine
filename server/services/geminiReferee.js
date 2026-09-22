import { GoogleGenAI, Type } from '@google/genai';

const SYSTEM_INSTRUCTION = `Eres el árbitro imparcial del juego de adivinanzas de cine. Se te proporciona la ficha técnica de una película secreta (oculta para el jugador) y una pregunta formulada por un rival.
Debes responder estrictamente en formato JSON:
{
  "veredicto": "SI" | "NO" | "MAYOR" | "MENOR" | "INDETERMINADO",
  "detalle": "máximo 6 palabras explicando el matiz si es necesario"
}
Reglas:
- Si la pregunta compara años (ej. '¿es posterior a 1995?'), responde SI/NO o MAYOR/MENOR según corresponda.
- Preguntas sobre fama ('¿es muy conocido?') deben basarse en directores/actores galardonados con Oscars, Goyas, Palmes d'Or o con taquillas internacionales históricas. Si es dudoso, responde INDETERMINADO.
- NUNCA reveles el título, personajes o actores en el campo detalle.`;

class GeminiRefereeService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setModelName(model) {
    this.modelName = model;
  }

  /**
   * Arbitrate a question against a secret movie
   * @param {Object} secretMovie Ficha técnica
   * @param {string} question Pregunta del rival
   * @returns {Promise<{veredicto: string, detalle: string}>}
   */
  async arbitrate(secretMovie, question) {
    if (!question || !secretMovie) {
      return {
        veredicto: 'INDETERMINADO',
        detalle: 'Pregunta o película no válida'
      };
    }

    // Try Gemini API if key is available
    if (this.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        // Models to try in order (support user specified, 2.5-flash, 1.5-flash)
        const modelsToTry = [
          this.modelName,
          'gemini-2.5-flash',
          'gemini-1.5-flash'
        ];
        const uniqueModels = [...new Set(modelsToTry)];

        let lastErr = null;
        for (const model of uniqueModels) {
          try {
            const prompt = `FICHA TÉCNICA DE LA PELÍCULA OCULTA:
- Título: ${secretMovie.title} (${secretMovie.original_title || ''})
- Año de estreno: ${secretMovie.year}
- Director(es): ${(secretMovie.directors || []).join(', ')}
- Reparto principal: ${(secretMovie.cast || []).join(', ')}
- Géneros: ${(secretMovie.genres || []).join(', ')}
- País(es): ${secretMovie.country}
- Duración: ${secretMovie.runtime || 'desconocida'} minutos
- Sinopsis: ${secretMovie.overview}
- Premios / Logros: ${secretMovie.awards || 'Sin premios destacados'}

PREGUNTA DEL RIVAL:
"${question}"

Recuerda: Responde estrictamente con el JSON especificado y NUNCA reveles el título, personajes o actores en el detalle.`;

            const response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    veredicto: {
                      type: Type.STRING,
                      enum: ['SI', 'NO', 'MAYOR', 'MENOR', 'INDETERMINADO']
                    },
                    detalle: {
                      type: Type.STRING,
                      description: 'máximo 6 palabras explicando el matiz si es necesario'
                    }
                  },
                  required: ['veredicto', 'detalle']
                }
              }
            });

            const text = response.text;
            if (text) {
              const parsed = JSON.parse(text);
              const validVerdicts = ['SI', 'NO', 'MAYOR', 'MENOR', 'INDETERMINADO'];
              const normalizedVerdict = validVerdicts.includes(parsed.veredicto?.toUpperCase())
                ? parsed.veredicto.toUpperCase()
                : 'INDETERMINADO';

              return {
                veredicto: normalizedVerdict,
                detalle: parsed.detalle ? parsed.detalle.trim().slice(0, 80) : ''
              };
            }
          } catch (modelErr) {
            lastErr = modelErr;
            console.warn(`Gemini referee attempt with model ${model} failed:`, modelErr.message);
          }
        }

        console.error('All Gemini model calls failed, using heuristic arbiter:', lastErr?.message);
      } catch (err) {
        console.error('Gemini referee critical error:', err);
      }
    }

    // Heuristic arbiter fallback when no API key or API call fails
    return this.heuristicArbitrate(secretMovie, question);
  }

  /**
   * Smart deterministic heuristic arbiter for offline/zero-config play
   */
  heuristicArbitrate(movie, question) {
    const q = question.toLowerCase().trim();

    // 1. Year questions (e.g. "es de antes del 2000", "es posterior a 1990", "es del siglo xxi")
    const yearMatch = q.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      const targetYear = parseInt(yearMatch[1], 10);
      const isBefore = q.includes('antes') || q.includes('anterior') || q.includes('menor');
      const isAfter = q.includes('después') || q.includes('posterior') || q.includes('mayor') || q.includes('luego');

      if (isBefore) {
        return {
          veredicto: movie.year < targetYear ? 'SI' : 'NO',
          detalle: movie.year < targetYear ? 'Estrenada antes de esa fecha' : 'Estrenada en o después'
        };
      }
      if (isAfter) {
        return {
          veredicto: movie.year > targetYear ? 'SI' : 'NO',
          detalle: movie.year > targetYear ? 'Estrenada con posterioridad' : 'Estrenada antes o en año'
        };
      }
      if (q.includes('año') || q.includes('es del') || q.includes('es de')) {
        if (movie.year === targetYear) {
          return { veredicto: 'SI', detalle: 'Año exacto coincide' };
        }
        return {
          veredicto: movie.year > targetYear ? 'MAYOR' : 'MENOR',
          detalle: movie.year > targetYear ? 'Es más reciente' : 'Es más antigua'
        };
      }
    }

    // 2. Oscar / Awards questions
    if (q.includes('oscar') || q.includes('óscar') || q.includes('premio') || q.includes('goya') || q.includes('palma')) {
      const awards = (movie.awards || '').toLowerCase();
      const hasOscar = awards.includes('óscar') || awards.includes('oscar');
      if (q.includes('oscar') || q.includes('óscar')) {
        return {
          veredicto: hasOscar ? 'SI' : 'NO',
          detalle: hasOscar ? 'Ganó premios de la Academia' : 'No obtuvo la estatuilla'
        };
      }
      return {
        veredicto: awards.length > 5 ? 'SI' : 'NO',
        detalle: awards.length > 5 ? 'Tiene reconocimientos oficiales' : 'Sin premios mayores destacados'
      };
    }

    // 3. Animation questions
    if (q.includes('animación') || q.includes('animada') || q.includes('dibujos')) {
      const isAnimation = (movie.genres || []).some(g => g.toLowerCase().includes('animaci'));
      return {
        veredicto: isAnimation ? 'SI' : 'NO',
        detalle: isAnimation ? 'Producida en animación' : 'Imagen real'
      };
    }

    // 4. Country / Origin questions
    if (q.includes('español') || q.includes('españa')) {
      const isSpanish = (movie.country || '').toLowerCase().includes('españa');
      return {
        veredicto: isSpanish ? 'SI' : 'NO',
        detalle: isSpanish ? 'Producción con participación española' : 'Producción extranjera'
      };
    }
    if (q.includes('europeo') || q.includes('europa')) {
      const europeanCountries = ['españa', 'francia', 'italia', 'reino unido', 'alemania', 'suecia', 'dinamarca'];
      const isEuropean = europeanCountries.some(c => (movie.country || '').toLowerCase().includes(c));
      return {
        veredicto: isEuropean ? 'SI' : 'NO',
        detalle: isEuropean ? 'Origen cinematográfico europeo' : 'Origen no europeo'
      };
    }
    if (q.includes('estadounidense') || q.includes('hollywood') || q.includes('americana') || q.includes('estados unidos') || q.includes('eeuu')) {
      const isUS = (movie.country || '').toLowerCase().includes('estados unidos');
      return {
        veredicto: isUS ? 'SI' : 'NO',
        detalle: isUS ? 'Producida en Estados Unidos' : 'Fuera de Estados Unidos'
      };
    }

    // 5. Runtime / Duration questions
    if (q.includes('2 horas') || q.includes('dos horas') || q.includes('120 min') || q.includes('larga')) {
      const isOver2Hours = movie.runtime >= 120;
      return {
        veredicto: isOver2Hours ? 'SI' : 'NO',
        detalle: isOver2Hours ? 'Supera las dos horas' : 'Menos de dos horas'
      };
    }

    // 6. Genre checks
    const genres = (movie.genres || []).map(g => g.toLowerCase());
    const genreKeywords = [
      { key: 'terror', name: 'Terror' },
      { key: 'miedo', name: 'Terror' },
      { key: 'comedia', name: 'Comedia' },
      { key: 'graciosa', name: 'Comedia' },
      { key: 'ciencia ficción', name: 'Ciencia ficción' },
      { key: 'fantasia', name: 'Fantasía' },
      { key: 'fantasía', name: 'Fantasía' },
      { key: 'acción', name: 'Acción' },
      { key: 'drama', name: 'Drama' },
      { key: 'romance', name: 'Romance' },
      { key: 'romántica', name: 'Romance' },
      { key: 'western', name: 'Western' },
      { key: 'bélica', name: 'Bélica' },
      { key: 'guerra', name: 'Bélica' },
      { key: 'crimen', name: 'Crimen' },
      { key: 'policíaca', name: 'Crimen' }
    ];

    for (const g of genreKeywords) {
      if (q.includes(g.key)) {
        const matches = genres.some(gen => gen.includes(g.name.toLowerCase()));
        return {
          veredicto: matches ? 'SI' : 'NO',
          detalle: matches ? `Clasificada en este género` : `No pertenece a ese género`
        };
      }
    }

    // 7. Director checks
    const directors = (movie.directors || []).map(d => d.toLowerCase());
    for (const dir of directors) {
      const parts = dir.split(' ');
      const lastName = parts[parts.length - 1];
      if (q.includes(dir) || (lastName.length > 3 && q.includes(lastName))) {
        return {
          veredicto: 'SI',
          detalle: 'Dirección confirmada'
        };
      }
    }

    // 8. Actor checks
    const cast = (movie.cast || []).map(c => c.toLowerCase());
    for (const actor of cast) {
      const actorNameOnly = actor.split('(')[0].trim();
      const parts = actorNameOnly.split(' ');
      const lastName = parts[parts.length - 1];
      if (q.includes(actorNameOnly) || (lastName.length > 3 && q.includes(lastName))) {
        return {
          veredicto: 'SI',
          detalle: 'Figura en el reparto'
        };
      }
    }

    // Default indeterminate
    return {
      veredicto: 'INDETERMINADO',
      detalle: 'Pregunta subjetiva o fuera de ficha'
    };
  }
}

export const geminiReferee = new GeminiRefereeService();
