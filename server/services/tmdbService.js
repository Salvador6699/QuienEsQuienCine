import axios from 'axios';
import { mockMovies } from './mockMovies.js';

class TmdbService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  async searchMovies(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    // If API key is present, try calling TMDB
    if (this.apiKey) {
      try {
        const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
          params: {
            api_key: this.apiKey,
            query: cleanQuery,
            language: 'es-ES',
            include_adult: false,
            page: 1
          },
          timeout: 6000
        });

        const results = response.data?.results || [];
        return results.slice(0, 10).map(m => ({
          id: m.id,
          title: m.title || m.original_title,
          original_title: m.original_title,
          year: m.release_date ? new Date(m.release_date).getFullYear() : null,
          overview: m.overview || 'Sinopsis no disponible.',
          poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          vote_average: m.vote_average
        }));
      } catch (err) {
        console.warn('TMDB API search error, falling back to internal catalog:', err.message);
      }
    }

    // Fallback: search in mockMovies
    const matches = mockMovies.filter(m =>
      m.title.toLowerCase().includes(cleanQuery) ||
      m.original_title.toLowerCase().includes(cleanQuery) ||
      m.directors.some(d => d.toLowerCase().includes(cleanQuery)) ||
      m.cast.some(a => a.toLowerCase().includes(cleanQuery))
    );

    return matches.slice(0, 10).map(m => ({
      id: m.id,
      title: m.title,
      original_title: m.original_title,
      year: m.year,
      overview: m.overview,
      poster_path: m.poster_path,
      vote_average: 8.8
    }));
  }

  async getMovieDetails(movieId) {
    const id = Number(movieId);

    // If API key is present, fetch complete credits from TMDB
    if (this.apiKey) {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: {
            api_key: this.apiKey,
            append_to_response: 'credits,keywords,release_dates',
            language: 'es-ES'
          },
          timeout: 6000
        });

        const data = response.data;
        const crew = data.credits?.crew || [];
        const cast = data.credits?.cast || [];

        const directors = crew
          .filter(c => c.job === 'Director')
          .map(c => c.name);

        const topCast = cast
          .slice(0, 6)
          .map(c => `${c.name} (${c.character || 'Personaje'})`);

        const genres = (data.genres || []).map(g => g.name);
        const countries = (data.production_countries || []).map(c => c.name);

        return {
          id: data.id,
          title: data.title,
          original_title: data.original_title,
          year: data.release_date ? new Date(data.release_date).getFullYear() : null,
          directors: directors.length > 0 ? directors : ['No especificado'],
          cast: topCast,
          genres,
          country: countries.join(', ') || 'Internacional',
          overview: data.overview || 'Sinopsis no disponible.',
          poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
          runtime: data.runtime || 0,
          awards: data.vote_average >= 8 ? 'Alta valoración de crítica / Premios de la academia' : 'Comercial'
        };
      } catch (err) {
        console.warn('TMDB API getDetails error, falling back to internal catalog:', err.message);
      }
    }

    // Check mockMovies
    const found = mockMovies.find(m => m.id === id);
    if (found) {
      return found;
    }

    // Default basic object
    return {
      id,
      title: `Película #${id}`,
      original_title: `Película #${id}`,
      year: 2000,
      directors: ['Director Anónimo'],
      cast: ['Actor Principal'],
      genres: ['Cine'],
      country: 'Internacional',
      overview: 'Detalles no disponibles.',
      poster_path: null,
      runtime: 120,
      awards: 'Desconocido'
    };
  }
}

export const tmdbService = new TmdbService();
