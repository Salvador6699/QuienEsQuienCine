import { geminiReferee } from './geminiReferee.js';

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostData, socketId) {
    let code = this.generateCode();
    while (this.rooms.has(code)) {
      code = this.generateCode();
    }

    const host = {
      id: socketId,
      name: hostData.name || 'Director Anónimo',
      avatar: hostData.avatar || '🎬',
      isHost: true,
      isReady: false,
      secretMovie: null,
      hasSelectedMovie: false,
      lives: 2,
      isEliminated: false,
      isSolved: false,
      solvedBy: null
    };

    const room = {
      code,
      status: 'LOBBY', // 'LOBBY' | 'SELECTING' | 'PLAYING' | 'GAME_OVER'
      hostId: socketId,
      players: [host],
      turnIndex: 0,
      round: 1,
      history: [],
      messages: [],
      winner: null,
      createdAt: Date.now()
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase());
  }

  joinRoom(code, playerData, socketId) {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error('Sala no encontrada con ese código');
    }

    if (room.players.length >= 8) {
      throw new Error('La sala está completa (máximo 8 jugadores)');
    }

    if (room.status !== 'LOBBY') {
      // Allow reconnect if player id was already in room
      const existing = room.players.find(p => p.id === socketId || p.name === playerData.name);
      if (existing) {
        existing.id = socketId;
        return room;
      }
      throw new Error('La partida ya ha comenzado en esta sala');
    }

    const player = {
      id: socketId,
      name: playerData.name || `Cinéfilo ${room.players.length + 1}`,
      avatar: playerData.avatar || '🍿',
      isHost: false,
      isReady: false,
      secretMovie: null,
      hasSelectedMovie: false,
      lives: 2,
      isEliminated: false,
      isSolved: false,
      solvedBy: null
    };

    room.players.push(player);
    return room;
  }

  removePlayer(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const idx = room.players.findIndex(p => p.id === socketId);
      if (idx !== -1) {
        const removed = room.players.splice(idx, 1)[0];
        
        if (room.players.length === 0) {
          this.rooms.delete(code);
          return null;
        }

        // If host left, assign new host
        if (removed.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].id;
        }

        // Adjust turn index if needed
        if (room.turnIndex >= room.players.length) {
          room.turnIndex = 0;
        }

        return room;
      }
    }
    return null;
  }

  startSelection(code, socketId) {
    const room = this.getRoom(code);
    if (!room) throw new Error('Sala no encontrada');
    if (room.hostId !== socketId) throw new Error('Solo el anfitrión puede iniciar la selección');
    if (room.players.length < 2) throw new Error('Se necesitan al menos 2 jugadores para jugar');

    room.status = 'SELECTING';
    return room;
  }

  setSecretMovie(code, socketId, movieDetails) {
    const room = this.getRoom(code);
    if (!room) throw new Error('Sala no encontrada');

    const player = room.players.find(p => p.id === socketId);
    if (!player) throw new Error('Jugador no encontrado en la sala');

    player.secretMovie = movieDetails;
    player.hasSelectedMovie = true;
    player.isReady = true;

    // Check if all players selected movies
    const allSelected = room.players.every(p => p.hasSelectedMovie);
    if (allSelected) {
      room.status = 'PLAYING';
      room.turnIndex = 0;
      room.round = 1;
    }

    return room;
  }

  getActivePlayers(room) {
    return room.players.filter(p => !p.isEliminated);
  }

  getCurrentTurnPlayer(room) {
    const active = this.getActivePlayers(room);
    if (active.length === 0) return null;
    const index = room.turnIndex % active.length;
    return active[index];
  }

  advanceTurn(room) {
    const active = this.getActivePlayers(room);
    if (active.length <= 1) return;
    room.turnIndex = (room.turnIndex + 1) % active.length;
    if (room.turnIndex === 0) {
      room.round += 1;
    }
  }

  async askQuestion(code, socketId, targetId, question) {
    const room = this.getRoom(code);
    if (!room) throw new Error('Sala no encontrada');
    if (room.status !== 'PLAYING') throw new Error('La partida no está en curso');

    const currentTurn = this.getCurrentTurnPlayer(room);
    if (!currentTurn || currentTurn.id !== socketId) {
      throw new Error('No es tu turno de preguntar');
    }

    const asker = currentTurn;
    const isTargetAll = targetId === 'ALL';
    const targets = isTargetAll
      ? room.players.filter(p => p.id !== socketId && !p.isSolved)
      : room.players.filter(p => p.id === targetId && !p.isSolved);

    if (targets.length === 0) {
      throw new Error('Objetivo no válido o ya resuelto');
    }

    const arbitrationResults = [];

    // Query Gemini Referee for each targeted secret movie
    for (const target of targets) {
      if (!target.secretMovie) continue;

      const verdict = await geminiReferee.arbitrate(target.secretMovie, question);
      arbitrationResults.push({
        targetId: target.id,
        targetName: target.name,
        targetAvatar: target.avatar,
        verdict
      });
    }

    const historyItem = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      round: room.round,
      askerId: asker.id,
      askerName: asker.name,
      askerAvatar: asker.avatar,
      isTargetAll,
      targetName: isTargetAll ? 'A TODOS' : targets[0].name,
      question,
      results: arbitrationResults,
      timestamp: Date.now()
    };

    room.history.unshift(historyItem);

    // Advance turn to next non-eliminated player
    this.advanceTurn(room);

    return { room, historyItem };
  }

  normalizeTitle(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, ""); // keep alphanumeric only
  }

  guessMovie(code, socketId, targetId, guessedTitle) {
    const room = this.getRoom(code);
    if (!room) throw new Error('Sala no encontrada');
    if (room.status !== 'PLAYING') throw new Error('La partida no está en curso');

    const guesser = room.players.find(p => p.id === socketId);
    if (!guesser) throw new Error('Jugador no encontrado');
    if (guesser.isEliminated) throw new Error('Has sido eliminado de la partida');

    const target = room.players.find(p => p.id === targetId);
    if (!target) throw new Error('Rival no encontrado');
    if (target.id === socketId) throw new Error('No puedes adivinar tu propia película');
    if (target.isSolved) throw new Error('Esta película ya fue descubierta');

    const secret = target.secretMovie;
    if (!secret) throw new Error('La película secreta no está disponible');

    const normGuessed = this.normalizeTitle(guessedTitle);
    const normTitle = this.normalizeTitle(secret.title);
    const normOriginal = this.normalizeTitle(secret.original_title);

    const isCorrect = normGuessed.length > 2 && (
      normTitle.includes(normGuessed) ||
      normGuessed.includes(normTitle) ||
      normOriginal.includes(normGuessed) ||
      normGuessed.includes(normOriginal)
    );

    const logEntry = {
      id: `g_${Date.now()}`,
      guesserId: guesser.id,
      guesserName: guesser.name,
      targetId: target.id,
      targetName: target.name,
      guessedTitle,
      isCorrect,
      timestamp: Date.now()
    };

    if (isCorrect) {
      target.isSolved = true;
      target.solvedBy = guesser.name;

      // Check if guesser solved all opponents
      const remainingUnsolved = room.players.filter(p => p.id !== guesser.id && !p.isSolved);
      if (remainingUnsolved.length === 0) {
        room.status = 'GAME_OVER';
        room.winner = guesser;
      }
    } else {
      guesser.lives -= 1;
      if (guesser.lives <= 0) {
        guesser.isEliminated = true;

        // Check if only one active player remains
        const active = this.getActivePlayers(room);
        if (active.length === 1) {
          room.status = 'GAME_OVER';
          room.winner = active[0];
        } else if (active.length === 0) {
          room.status = 'GAME_OVER';
          room.winner = null; // Draw
        }
      }
    }

    // Advance turn if it was guesser's turn
    const currentTurn = this.getCurrentTurnPlayer(room);
    if (currentTurn && currentTurn.id === guesser.id) {
      this.advanceTurn(room);
    }

    return { room, logEntry, isCorrect };
  }

  addMessage(code, socketId, text) {
    const room = this.getRoom(code);
    if (!room) return null;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return null;

    const message = {
      id: `msg_${Date.now()}`,
      senderId: player.id,
      senderName: player.name,
      senderAvatar: player.avatar,
      text: text.trim().slice(0, 150),
      timestamp: Date.now()
    };

    room.messages.push(message);
    if (room.messages.length > 50) room.messages.shift();
    return message;
  }

  restartRoom(code, socketId) {
    const room = this.getRoom(code);
    if (!room) throw new Error('Sala no encontrada');
    if (room.hostId !== socketId) throw new Error('Solo el anfitrión puede reiniciar la sala');

    room.status = 'LOBBY';
    room.winner = null;
    room.round = 1;
    room.turnIndex = 0;
    room.history = [];
    room.messages = [];

    for (const player of room.players) {
      player.secretMovie = null;
      player.hasSelectedMovie = false;
      player.isReady = false;
      player.lives = 2;
      player.isEliminated = false;
      player.isSolved = false;
      player.solvedBy = null;
    }

    return room;
  }

  /**
   * Safe room state for client consumption (secrets hidden)
   */
  getSanitizedRoom(room, viewerSocketId) {
    if (!room) return null;

    return {
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      turnIndex: room.turnIndex,
      round: room.round,
      currentTurnPlayerId: this.getCurrentTurnPlayer(room)?.id || null,
      winner: room.winner ? { id: room.winner.id, name: room.winner.name, avatar: room.winner.avatar } : null,
      history: room.history,
      messages: room.messages,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        hasSelectedMovie: p.hasSelectedMovie,
        lives: p.lives,
        isEliminated: p.isEliminated,
        isSolved: p.isSolved,
        solvedBy: p.solvedBy,
        // Only show secret movie if it belongs to the viewer, or if solved, or game over!
        secretMovie: (p.id === viewerSocketId || p.isSolved || room.status === 'GAME_OVER')
          ? p.secretMovie
          : null
      }))
    };
  }
}

export const roomManager = new RoomManager();
