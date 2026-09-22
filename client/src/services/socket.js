import { io } from 'socket.io-client';

// In development, Vite proxies or connects directly to localhost:3001
const URL = window.location.port === '5173' ? 'http://localhost:3001' : '/';

export const socket = io(URL, {
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export const socketService = {
  createRoom: (hostData) => {
    return new Promise((resolve, reject) => {
      socket.emit('room:create', hostData, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al crear sala'));
      });
    });
  },

  joinRoom: (code, player) => {
    return new Promise((resolve, reject) => {
      socket.emit('room:join', { code, player }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al unirse a la sala'));
      });
    });
  },

  startSelection: (code) => {
    return new Promise((resolve, reject) => {
      socket.emit('room:start-selection', { code }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al iniciar selección'));
      });
    });
  },

  setMovie: (code, movieDetails) => {
    return new Promise((resolve, reject) => {
      socket.emit('room:set-movie', { code, movieDetails }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al guardar película'));
      });
    });
  },

  askQuestion: (code, targetId, question) => {
    return new Promise((resolve, reject) => {
      socket.emit('game:ask-question', { code, targetId, question }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al consultar al árbitro'));
      });
    });
  },

  guessMovie: (code, targetId, guessedTitle) => {
    return new Promise((resolve, reject) => {
      socket.emit('game:guess-movie', { code, targetId, guessedTitle }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al resolver película'));
      });
    });
  },

  sendChat: (code, text) => {
    socket.emit('room:send-chat', { code, text });
  },

  restartRoom: (code) => {
    return new Promise((resolve, reject) => {
      socket.emit('room:restart', { code }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Error al reiniciar sala'));
      });
    });
  }
};
