# 🎬 CineClue - ¿Quién es Quién de Cine? (Vercel Edition)

Juego de deducción cinematográfica directo y sin servidores complejos, listo para **despliegue inmediato en Vercel**, con **Gemini AI** como árbitro imparcial oficial y motor de cine.

---

## 🌟 Características Principales

1. **100% Vercel & Sin Multisalas**:
   - Todo el juego se ejecuta en el navegador mediante React + Vite.
   - Sin servidores Node.js ni WebSockets que se desconecten o requieran configuración adicional.

2. **2, 3 o 4 Jugadores**:
   - **Director**: Elige en secreto la película con ayuda de Gemini.
   - **Detectives**: Toman turnos rotativos ordenados (*Round-Robin*) para interrogar a la IA, solicitar pistas y adivinar.
   - Rotación automática de roles entre rondas.

3. **Búsqueda y Confirmación por IA**:
   - El Director escribe cualquier película (incluso con erratas o sinopsis).
   - Gemini extrae la ficha técnica completa y el Director confirma con un clic (*"¡Sí, es esta!"*) antes de comenzar la ronda.

4. **Sistema de Puntos y Pistas (100 pts base)**:
   - **100 puntos** si los detectives adivinan únicamente haciendo preguntas a la IA.
   - **Pista de Banda Sonora**: Resta **20 puntos** (revela compositor, estilo y sintetizador de audio).
   - **Pista de Fotograma**: Resta **20 puntos** (revela descripción del plano visual más icónico).
   - Puntuación al acertar: **100, 80 o 60 puntos**.

5. **Árbitro Inteligente Gemini**:
   - Evalúa cada pregunta con: `[SÍ]`, `[NO]`, `[MAYOR]`, `[MENOR]`, `[INDETERMINADO]` y un breve matiz explicativo sin hacer spoilers.

---

## 🚀 Puesta en Marcha Rápida

### Entrar en modo desarrollo:

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

### Compilar para producción (Vercel):

```bash
npm run build
```

---

## 🔑 Clave de Gemini

La clave se encuentra configurada en el archivo `.env` (`VITE_GEMINI_API_KEY`) y también puedes cambiarla o probarla directamente desde el botón con el icono de llave 🔑 en la barra superior del juego.
