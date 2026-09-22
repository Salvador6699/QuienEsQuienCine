# 🎬 CineClue - ¿Quién es Quién de Cine? (PWA Multijugador)

Progressive Web Application (PWA) multijugador en tiempo real basada en el clásico juego "Quién es Quién", adaptado al mundo del cine con metadatos oficiales de **TMDB (The Movie Database)** y **Gemini 3.8 Flash** como Árbitro IA imparcial oficial.

---

## 🌟 Características Principales

1. **Multijugador en Tiempo Real (2 a 8 jugadores)**:
   - Creación de salas privadas con código de 6 caracteres y enlace compartible.
   - Sincronización instantánea con WebSockets (Socket.io).
   - Chat y camerino de espera interactivo.

2. **Fase de Preparación Segura**:
   - Cada jugador busca y elige en secreto una película real del catálogo de TMDB con autocompletado en vivo.
   - La ficha técnica (año, dirección, reparto, géneros, país, sinopsis, premios) se almacena **estrictamente en el servidor** (anti-trampas).

3. **Árbitro IA Oficial (Gemini 3.8 Flash)**:
   - En su turno, el jugador formula preguntas en lenguaje natural dirigidas a un rival o a todos (*"¿Es de antes del 2000?"*, *"¿Ganó algún Oscar?"*, *"¿El director es europeo?"*).
   - Gemini responde exclusivamente con formato JSON estructurado:
     - `[SÍ]`
     - `[NO]`
     - `[MAYOR]` (comparaciones temporales/numéricas)
     - `[MENOR]`
     - `[INDETERMINADO]` (preguntas subjetivas o no comprobables)
     - Aclaración de máximo 6 palabras sin revelar nombres ni el título.
   - *Modo Heurístico de Respaldo*: Permite jugar inmediatamente incluso sin claves API configuradas.

4. **Mecánica de Resolución y Vidas**:
   - Botón **"Resolver / Adivinar Película"** con 2 vidas de resolución.
   - Si fallas pierdes un intento; al llegar a 0 vidas quedas eliminado.
   - Si aciertas, la película rival se revela al público. Gana el jugador que descubra todas las películas o el último en pie.

5. **PWA & Experiencia Cinematográfica**:
   - Estética oscura *Noir Cinema* (paleta ámbar Óscar, carmesí y negro pizarra).
   - Efectos de sonido sintetizados mediante HTML5 Web Audio API (claqueta, veredictos, fanfarria).
   - Libreta del detective privada con pistas descartables.
   - Instalable en móviles y escritorio mediante Service Worker y Web Manifest.

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar el Servidor y la Aplicación

```bash
# Iniciar servidor completo (Backend + Frontend compilado en puerto 3001)
npm start
```

Abre tu navegador en: **`http://localhost:3001`**

### 2. Desarrollo con Hot-Reload (Opcional)

Si deseas modificar el frontend con recarga instantánea:

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend Vite
npm run dev:client
```

---

## 🔑 Configuración de Claves API (Opcional)

CineClue incluye un catálogo pre-cargado de más de 50 películas clásicas y un árbitro heurístico para que funcione sin necesidad de configurar claves.

Para activar la búsqueda completa en TMDB y el modelo Gemini oficial, puedes configurar las claves de dos formas:

### Opción A: Desde el modal de "Ajustes" (⚙️) en la propia aplicación
Haz clic en el icono de engranaje en la barra superior de la app, pega tus claves y pulsa **Guardar Ajustes**.

### Opción B: En el archivo `server/.env`
```env
PORT=3001
GEMINI_API_KEY=tu_clave_de_google_ai_studio
TMDB_API_KEY=tu_clave_de_the_movie_database
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti, Web Audio API, PWA (Service Worker + Web Manifest).
- **Backend**: Node.js, Express, Socket.io (WebSockets).
- **Integración IA**: Google GenAI SDK (`@google/genai`) con Structured Outputs (JSON Schema).
- **Datos Cinematográficos**: TMDB API v3 con fallback a base de datos interna.
